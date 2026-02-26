import HealthKit
import CoreLocation

enum WorkoutState {
    case notStarted, running, paused, ended
}

protocol WorkoutSessionDelegate: AnyObject {
    func workoutSession(_ manager: WorkoutSessionManager, didUpdateMetrics metrics: WorkoutMetrics)
    func workoutSession(_ manager: WorkoutSessionManager, didChangeState state: WorkoutState)
    func workoutSession(_ manager: WorkoutSessionManager, didFailWith error: Error)
    func workoutSession(_ manager: WorkoutSessionManager, didSaveWorkout success: Bool, error: Error?)
}

final class WorkoutSessionManager: NSObject {

    let workoutType: WorkoutType
    let healthStore = HKHealthStore()
    weak var delegate: WorkoutSessionDelegate?

    private(set) var state: WorkoutState = .notStarted
    private(set) var metrics = WorkoutMetrics()

    private var session: HKWorkoutSession?
    private var workoutBuilder: HKWorkoutBuilder?
    private var startDate: Date?
    private var endDate: Date?

    private var heartRateQuery: HKAnchoredObjectQuery?
    private var energyQuery: HKAnchoredObjectQuery?
    private var distanceQuery: HKAnchoredObjectQuery?

    private let locationManager = LocationManager()
    let streamClient = StreamClient()
    private var updateTimer: Timer?

    private let notificationManager = WorkoutNotificationManager.shared
    private let watchSession = WatchSessionManager.shared

    /// Tracks which metric fields are currently being provided by the Apple Watch.
    /// iPhone HealthKit queries skip updating any field in this set.
    private var watchProvidedMetrics: Set<String> = []

    init(workoutType: WorkoutType) {
        self.workoutType = workoutType
        super.init()
        locationManager.delegate = self
        watchSession.delegate = self
        metrics.workoutType = workoutType.displayName
        notificationManager.requestAuthorization()
    }

    // MARK: - Authorization

    func requestAuthorization(completion: @escaping (Bool, Error?) -> Void) {
        let share: Set<HKSampleType> = [
            HKWorkoutType.workoutType(),
            HKQuantityType(.activeEnergyBurned),
            HKQuantityType(.distanceWalkingRunning),
            HKQuantityType(.distanceCycling),
        ]
        let read: Set<HKObjectType> = [
            HKWorkoutType.workoutType(),
            HKQuantityType(.heartRate),
            HKQuantityType(.activeEnergyBurned),
            HKQuantityType(.distanceWalkingRunning),
            HKQuantityType(.distanceCycling),
            HKQuantityType(.stepCount),
        ]
        healthStore.requestAuthorization(toShare: share, read: read, completion: completion)
    }

    // MARK: - Session lifecycle

    func startWorkout() {
        let config = HKWorkoutConfiguration()
        config.activityType = workoutType.activityType
        config.locationType = .outdoor

        do {
            session = try HKWorkoutSession(healthStore: healthStore, configuration: config)
            session?.delegate = self
        } catch {
            delegate?.workoutSession(self, didFailWith: error)
            return
        }

        let now = Date()
        startDate = now
        endDate = nil
        metrics.timestamp = now
        session?.startActivity(with: now)

        workoutBuilder = HKWorkoutBuilder(healthStore: healthStore, configuration: config, device: .local())
        workoutBuilder?.beginCollection(withStart: now) { _, _ in }

        watchProvidedMetrics.removeAll()
        startQueries()
        locationManager.requestAuthorization()
        locationManager.start()
        startUpdateTimer()
        notificationManager.postWorkoutActive(name: workoutType.displayName, elapsed: 0)
        watchSession.sendWorkoutCommand("start", workoutName: workoutType.displayName)

        state = .running
        delegate?.workoutSession(self, didChangeState: state)
    }

    func pauseWorkout() {
        session?.pause()
        locationManager.stop()
        updateTimer?.invalidate()
        watchSession.sendWorkoutCommand("pause", workoutName: workoutType.displayName)
        state = .paused
        delegate?.workoutSession(self, didChangeState: state)
    }

    func resumeWorkout() {
        session?.resume()
        locationManager.start()
        startUpdateTimer()
        watchSession.sendWorkoutCommand("resume", workoutName: workoutType.displayName)
        state = .running
        delegate?.workoutSession(self, didChangeState: state)
    }

    func endWorkout() {
        session?.end()
        locationManager.stop()
        stopQueries()
        updateTimer?.invalidate()
        notificationManager.removeWorkoutNotification()
        watchSession.sendWorkoutCommand("end", workoutName: workoutType.displayName)
        watchProvidedMetrics.removeAll()

        endDate = Date()
        state = .ended
        delegate?.workoutSession(self, didChangeState: state)

        saveWorkoutToHealthKit()
    }

    // MARK: - Save workout to HealthKit (Fitness app)

    private func saveWorkoutToHealthKit() {
        guard let builder = workoutBuilder,
              let start = startDate,
              let end = endDate else { return }

        var samples: [HKQuantitySample] = []
        if let energy = metrics.activeEnergyKcal, energy > 0 {
            let quantity = HKQuantity(unit: .kilocalorie(), doubleValue: energy)
            let sample = HKQuantitySample(type: HKQuantityType(.activeEnergyBurned),
                                          quantity: quantity, start: start, end: end)
            samples.append(sample)
        }
        if let distance = metrics.distanceMeters, distance > 0 {
            let distType: HKQuantityType = workoutType.activityType == .cycling
                ? HKQuantityType(.distanceCycling)
                : HKQuantityType(.distanceWalkingRunning)
            let quantity = HKQuantity(unit: .meter(), doubleValue: distance)
            let sample = HKQuantitySample(type: distType, quantity: quantity, start: start, end: end)
            samples.append(sample)
        }

        let addSamples: (@escaping () -> Void) -> Void = { next in
            guard !samples.isEmpty else { next(); return }
            builder.add(samples) { _, _ in next() }
        }

        addSamples { [weak self] in
            builder.endCollection(withEnd: end) { _, _ in
                builder.finishWorkout { _, error in
                    DispatchQueue.main.async {
                        guard let self else { return }
                        self.delegate?.workoutSession(self, didSaveWorkout: error == nil, error: error)
                        self.workoutBuilder = nil
                    }
                }
            }
        }
    }

    // MARK: - Timer

    private func startUpdateTimer() {
        updateTimer?.invalidate()
        updateTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.tick()
        }
    }

    private var tickCount = 0
    private var lastStreamTime: Date = .distantPast

    private func tick() {
        guard let start = startDate else { return }
        metrics.elapsedSeconds = Date().timeIntervalSince(start)
        metrics.timestamp = Date()
        delegate?.workoutSession(self, didUpdateMetrics: metrics)

        let now = Date()
        if now.timeIntervalSince(lastStreamTime) >= EndpointStorage.writeFrequency {
            streamClient.send(metrics)
            lastStreamTime = now
        }

        tickCount += 1
        if tickCount % 5 == 0 {
            notificationManager.postWorkoutActive(
                name: workoutType.displayName,
                elapsed: metrics.elapsedSeconds
            )
        }
    }

    // MARK: - HealthKit queries

    private func startQueries() {
        heartRateQuery = makeLatestValueQuery(
            type: HKQuantityType(.heartRate),
            unit: .count().unitDivided(by: .minute())
        ) { [weak self] value in
            guard self?.watchProvidedMetrics.contains("heartRate") != true else { return }
            self?.metrics.heartRate = value
            self?.metrics.heartRateZone = Self.zone(forBpm: value)
        }

        energyQuery = makeCumulativeQuery(
            type: HKQuantityType(.activeEnergyBurned),
            unit: .kilocalorie()
        ) { [weak self] total in
            guard self?.watchProvidedMetrics.contains("activeEnergyKcal") != true else { return }
            self?.metrics.activeEnergyKcal = total
        }

        let distanceType: HKQuantityType = workoutType.activityType == .cycling
            ? HKQuantityType(.distanceCycling)
            : HKQuantityType(.distanceWalkingRunning)
        distanceQuery = makeCumulativeQuery(
            type: distanceType,
            unit: .meter()
        ) { [weak self] total in
            guard self?.watchProvidedMetrics.contains("distanceMeters") != true else { return }
            self?.metrics.distanceMeters = total
            if let elapsed = self?.metrics.elapsedSeconds, elapsed > 0, total > 0 {
                self?.metrics.paceMinPerKm = (elapsed / 60.0) / (total / 1000.0)
            }
        }
    }

    private func stopQueries() {
        [heartRateQuery, energyQuery, distanceQuery].compactMap { $0 }.forEach {
            healthStore.stop($0)
        }
    }

    /// Query that reports the most recent sample value (heart rate, etc.)
    private func makeLatestValueQuery(
        type: HKQuantityType,
        unit: HKUnit,
        handler: @escaping (Double) -> Void
    ) -> HKAnchoredObjectQuery {
        let predicate = HKQuery.predicateForSamples(
            withStart: startDate, end: nil, options: .strictStartDate)
        let query = HKAnchoredObjectQuery(
            type: type, predicate: predicate, anchor: nil, limit: HKObjectQueryNoLimit
        ) { _, samples, _, _, _ in
            guard let quantitySamples = samples as? [HKQuantitySample],
                  let latest = quantitySamples.last else { return }
            let value = latest.quantity.doubleValue(for: unit)
            DispatchQueue.main.async { handler(value) }
        }
        query.updateHandler = { _, samples, _, _, _ in
            guard let quantitySamples = samples as? [HKQuantitySample],
                  let latest = quantitySamples.last else { return }
            let value = latest.quantity.doubleValue(for: unit)
            DispatchQueue.main.async { handler(value) }
        }
        healthStore.execute(query)
        return query
    }

    /// Query that sums all samples across batches (energy, distance, etc.)
    private func makeCumulativeQuery(
        type: HKQuantityType,
        unit: HKUnit,
        handler: @escaping (Double) -> Void
    ) -> HKAnchoredObjectQuery {
        var runningTotal: Double = 0
        let predicate = HKQuery.predicateForSamples(
            withStart: startDate, end: nil, options: .strictStartDate)
        let accumulate: ([HKSample]?) -> Void = { samples in
            guard let quantitySamples = samples as? [HKQuantitySample],
                  !quantitySamples.isEmpty else { return }
            let batchSum = quantitySamples.reduce(0.0) {
                $0 + $1.quantity.doubleValue(for: unit)
            }
            runningTotal += batchSum
            let total = runningTotal
            DispatchQueue.main.async { handler(total) }
        }
        let query = HKAnchoredObjectQuery(
            type: type, predicate: predicate, anchor: nil, limit: HKObjectQueryNoLimit
        ) { _, samples, _, _, _ in
            accumulate(samples)
        }
        query.updateHandler = { _, samples, _, _, _ in
            accumulate(samples)
        }
        healthStore.execute(query)
        return query
    }

    // MARK: - Heart rate zones (5 zones based on typical max HR ~190)

    private static func zone(forBpm bpm: Double) -> Int {
        switch bpm {
        case ..<104: return 1
        case 104..<123: return 2
        case 123..<142: return 3
        case 142..<161: return 4
        default: return 5
        }
    }
}

// MARK: - HKWorkoutSessionDelegate

extension WorkoutSessionManager: HKWorkoutSessionDelegate {
    func workoutSession(
        _ workoutSession: HKWorkoutSession,
        didChangeTo toState: HKWorkoutSessionState,
        from fromState: HKWorkoutSessionState,
        date: Date
    ) {}

    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.delegate?.workoutSession(self, didFailWith: error)
        }
    }
}

// MARK: - LocationManagerDelegate

extension WorkoutSessionManager: LocationManagerDelegate {
    func locationManager(_ manager: LocationManager, didUpdate location: CLLocation) {
        metrics.latitude = location.coordinate.latitude
        metrics.longitude = location.coordinate.longitude
        metrics.elevationMeters = location.altitude
    }
}

// MARK: - WatchSessionDelegate

extension WorkoutSessionManager: WatchSessionDelegate {
    func watchSession(_ manager: WatchSessionManager, didReceiveMetrics watchMetrics: [String: Double]) {
        if let hr = watchMetrics["heartRate"] {
            metrics.heartRate = hr
            metrics.heartRateZone = Self.zone(forBpm: hr)
            watchProvidedMetrics.insert("heartRate")
        }
        if let energy = watchMetrics["activeEnergyKcal"] {
            metrics.activeEnergyKcal = energy
            watchProvidedMetrics.insert("activeEnergyKcal")
        }
        if let distance = watchMetrics["distanceMeters"] {
            metrics.distanceMeters = distance
            watchProvidedMetrics.insert("distanceMeters")
        }
        if let pace = watchMetrics["paceMinPerKm"], pace.isFinite {
            metrics.paceMinPerKm = pace
            watchProvidedMetrics.insert("paceMinPerKm")
        }
        if let steps = watchMetrics["stepCount"] {
            metrics.stepCount = Int(steps)
            watchProvidedMetrics.insert("stepCount")
        }
    }

    func watchSession(_ manager: WatchSessionManager, didChangeReachability reachable: Bool) {
        if !reachable {
            watchProvidedMetrics.removeAll()
        }
    }
}
