import HealthKit
import CoreLocation

enum WorkoutState {
    case notStarted, running, paused, ended
}

protocol WorkoutSessionDelegate: AnyObject {
    func workoutSession(_ manager: WorkoutSessionManager, didUpdateMetrics metrics: WorkoutMetrics)
    func workoutSession(_ manager: WorkoutSessionManager, didChangeState state: WorkoutState)
    func workoutSession(_ manager: WorkoutSessionManager, didFailWith error: Error)
}

final class WorkoutSessionManager: NSObject {

    let workoutType: WorkoutType
    let healthStore = HKHealthStore()
    weak var delegate: WorkoutSessionDelegate?

    private(set) var state: WorkoutState = .notStarted
    private(set) var metrics = WorkoutMetrics()

    private var session: HKWorkoutSession?
    private var startDate: Date?

    private var heartRateQuery: HKAnchoredObjectQuery?
    private var energyQuery: HKAnchoredObjectQuery?
    private var distanceQuery: HKAnchoredObjectQuery?

    private let locationManager = LocationManager()
    let streamClient = StreamClient()
    private var updateTimer: Timer?

    private let notificationManager = WorkoutNotificationManager.shared

    init(workoutType: WorkoutType) {
        self.workoutType = workoutType
        super.init()
        locationManager.delegate = self
        metrics.workoutType = workoutType.displayName
        notificationManager.requestAuthorization()
    }

    // MARK: - Authorization

    func requestAuthorization(completion: @escaping (Bool, Error?) -> Void) {
        let share: Set<HKSampleType> = [HKWorkoutType.workoutType()]
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

        startDate = Date()
        metrics.timestamp = startDate!
        session?.startActivity(with: startDate!)

        startQueries()
        locationManager.requestAuthorization()
        locationManager.start()
        startUpdateTimer()
        notificationManager.postWorkoutActive(name: workoutType.displayName, elapsed: 0)

        state = .running
        delegate?.workoutSession(self, didChangeState: state)
    }

    func pauseWorkout() {
        session?.pause()
        locationManager.stop()
        updateTimer?.invalidate()
        state = .paused
        delegate?.workoutSession(self, didChangeState: state)
    }

    func resumeWorkout() {
        session?.resume()
        locationManager.start()
        startUpdateTimer()
        state = .running
        delegate?.workoutSession(self, didChangeState: state)
    }

    func endWorkout() {
        session?.end()
        locationManager.stop()
        stopQueries()
        updateTimer?.invalidate()
        notificationManager.removeWorkoutNotification()
        state = .ended
        delegate?.workoutSession(self, didChangeState: state)
    }

    // MARK: - Timer

    private func startUpdateTimer() {
        updateTimer?.invalidate()
        updateTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.tick()
        }
    }

    private var tickCount = 0

    private func tick() {
        guard let start = startDate else { return }
        metrics.elapsedSeconds = Date().timeIntervalSince(start)
        metrics.timestamp = Date()
        delegate?.workoutSession(self, didUpdateMetrics: metrics)
        streamClient.send(metrics)

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
        heartRateQuery = makeQuery(type: HKQuantityType(.heartRate), unit: .count().unitDivided(by: .minute())) { [weak self] value in
            self?.metrics.heartRate = value
            self?.metrics.heartRateZone = Self.zone(forBpm: value)
        }
        energyQuery = makeQuery(type: HKQuantityType(.activeEnergyBurned), unit: .kilocalorie()) { [weak self] value in
            self?.metrics.activeEnergyKcal = value
        }

        let distanceType: HKQuantityType = workoutType.activityType == .cycling
            ? HKQuantityType(.distanceCycling)
            : HKQuantityType(.distanceWalkingRunning)
        distanceQuery = makeQuery(type: distanceType, unit: .meter()) { [weak self] value in
            self?.metrics.distanceMeters = value
            if let elapsed = self?.metrics.elapsedSeconds, elapsed > 0, value > 0 {
                self?.metrics.paceMinPerKm = (elapsed / 60.0) / (value / 1000.0)
            }
        }
    }

    private func stopQueries() {
        [heartRateQuery, energyQuery, distanceQuery].compactMap { $0 }.forEach {
            healthStore.stop($0)
        }
    }

    private func makeQuery(
        type: HKQuantityType,
        unit: HKUnit,
        handler: @escaping (Double) -> Void
    ) -> HKAnchoredObjectQuery {
        let query = HKAnchoredObjectQuery(
            type: type,
            predicate: HKQuery.predicateForSamples(withStart: startDate, end: nil),
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { _, samples, _, _, _ in
            self.process(samples: samples, unit: unit, handler: handler)
        }
        query.updateHandler = { _, samples, _, _, _ in
            self.process(samples: samples, unit: unit, handler: handler)
        }
        healthStore.execute(query)
        return query
    }

    private func process(samples: [HKSample]?, unit: HKUnit, handler: @escaping (Double) -> Void) {
        guard let quantitySamples = samples as? [HKQuantitySample],
              let latest = quantitySamples.last else { return }
        let value = latest.quantity.doubleValue(for: unit)
        DispatchQueue.main.async { handler(value) }
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
