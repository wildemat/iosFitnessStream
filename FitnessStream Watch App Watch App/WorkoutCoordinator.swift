import Combine
import Foundation
import HealthKit
import WatchConnectivity

enum WatchWorkoutState {
    case idle, active, paused
}

final class WorkoutCoordinator: NSObject, ObservableObject {

    @Published var workoutState: WatchWorkoutState = .idle
    @Published var workoutName: String = ""
    @Published var heartRate: Double = 0
    @Published var heartRateZone: Int = 0
    @Published var activeCalories: Double = 0
    @Published var distanceMeters: Double = 0
    @Published var stepCount: Int = 0
    @Published var paceMinPerKm: Double = 0
    @Published var elapsedSeconds: TimeInterval = 0
    @Published var isPhoneReachable = false

    private let healthStore = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    private var startDate: Date?
    private var timer: Timer?
    private var currentActivityType: HKWorkoutActivityType = .other

    override init() {
        super.init()
    }

    func activate() {
        requestHealthKitAuthorization()
        activateWCSession()
    }

    // MARK: - HealthKit authorization

    private func requestHealthKitAuthorization() {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        let share: Set<HKSampleType> = [HKWorkoutType.workoutType()]
        let read: Set<HKObjectType> = [
            HKWorkoutType.workoutType(),
            HKQuantityType(.heartRate),
            HKQuantityType(.activeEnergyBurned),
            HKQuantityType(.distanceWalkingRunning),
            HKQuantityType(.distanceCycling),
            HKQuantityType(.stepCount),
        ]
        healthStore.requestAuthorization(toShare: share, read: read) { _, _ in }
    }

    // MARK: - WatchConnectivity

    private func activateWCSession() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    private func sendAllMetricsToPhone() {
        guard WCSession.default.activationState == .activated,
              WCSession.default.isReachable else { return }

        var payload: [String: Any] = ["source": "watch"]
        if heartRate > 0 { payload["heartRate"] = heartRate }
        if activeCalories > 0 { payload["activeEnergyKcal"] = activeCalories }
        if distanceMeters > 0 { payload["distanceMeters"] = distanceMeters }
        if stepCount > 0 { payload["stepCount"] = Double(stepCount) }
        if paceMinPerKm > 0, paceMinPerKm.isFinite { payload["paceMinPerKm"] = paceMinPerKm }

        WCSession.default.sendMessage(payload, replyHandler: nil) { _ in }
    }

    // MARK: - Workout lifecycle

    private func startWorkout(name: String) {
        guard workoutState == .idle else { return }

        let activityType = Self.activityType(for: name)
        currentActivityType = activityType
        let config = HKWorkoutConfiguration()
        config.activityType = activityType
        config.locationType = .outdoor

        do {
            session = try HKWorkoutSession(healthStore: healthStore, configuration: config)
            builder = session?.associatedWorkoutBuilder()
        } catch {
            return
        }

        session?.delegate = self
        builder?.delegate = self
        builder?.dataSource = HKLiveWorkoutDataSource(
            healthStore: healthStore,
            workoutConfiguration: config
        )

        let now = Date()
        startDate = now
        session?.startActivity(with: now)
        builder?.beginCollection(withStart: now) { _, _ in }

        workoutName = name
        workoutState = .active
        heartRate = 0
        heartRateZone = 0
        activeCalories = 0
        distanceMeters = 0
        stepCount = 0
        paceMinPerKm = 0
        elapsedSeconds = 0
        startTimer()
    }

    private func pauseWorkout() {
        guard workoutState == .active else { return }
        session?.pause()
        timer?.invalidate()
        workoutState = .paused
    }

    private func resumeWorkout() {
        guard workoutState == .paused else { return }
        session?.resume()
        startTimer()
        workoutState = .active
    }

    private func endWorkout() {
        guard workoutState != .idle else { return }
        session?.end()
        let endDate = Date()
        builder?.endCollection(withEnd: endDate) { [weak self] _, _ in
            self?.builder?.finishWorkout { _, _ in }
        }
        timer?.invalidate()
        workoutState = .idle
        heartRate = 0
        heartRateZone = 0
        activeCalories = 0
        distanceMeters = 0
        stepCount = 0
        paceMinPerKm = 0
        elapsedSeconds = 0
        workoutName = ""
    }

    // MARK: - Timer

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self, let start = self.startDate else { return }
            self.elapsedSeconds = Date().timeIntervalSince(start)
        }
    }

    // MARK: - Heart rate zones (mirrors iPhone WorkoutSessionManager)

    private static func zone(forBpm bpm: Double) -> Int {
        switch bpm {
        case ..<104: return 1
        case 104..<123: return 2
        case 123..<142: return 3
        case 142..<161: return 4
        default: return 5
        }
    }

    // MARK: - Workout type mapping (mirrors iPhone WorkoutType.swift)

    private static func activityType(for name: String) -> HKWorkoutActivityType {
        switch name {
        case "Running": return .running
        case "Cycling": return .cycling
        case "Walking": return .walking
        case "Swimming": return .swimming
        case "Hiking": return .hiking
        case "Yoga": return .yoga
        case "HIIT": return .highIntensityIntervalTraining
        case "Strength": return .functionalStrengthTraining
        case "Rowing": return .rowing
        case "Elliptical": return .elliptical
        case "Dance": return .socialDance
        case "Cooldown": return .cooldown
        default: return .other
        }
    }

    // MARK: - Distance type for current workout

    private var distanceType: HKQuantityType {
        currentActivityType == .cycling
            ? HKQuantityType(.distanceCycling)
            : HKQuantityType(.distanceWalkingRunning)
    }
}

// MARK: - WCSessionDelegate

extension WorkoutCoordinator: WCSessionDelegate {

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        DispatchQueue.main.async {
            self.isPhoneReachable = session.isReachable
        }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isPhoneReachable = session.isReachable
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        guard let command = message["command"] as? String,
              let name = message["workoutName"] as? String else { return }
        DispatchQueue.main.async {
            switch command {
            case "start": self.startWorkout(name: name)
            case "pause": self.pauseWorkout()
            case "resume": self.resumeWorkout()
            case "end": self.endWorkout()
            default: break
            }
        }
    }
}

// MARK: - HKWorkoutSessionDelegate

extension WorkoutCoordinator: HKWorkoutSessionDelegate {

    func workoutSession(
        _ workoutSession: HKWorkoutSession,
        didChangeTo toState: HKWorkoutSessionState,
        from fromState: HKWorkoutSessionState,
        date: Date
    ) {}

    func workoutSession(
        _ workoutSession: HKWorkoutSession,
        didFailWithError error: Error
    ) {
        DispatchQueue.main.async {
            self.endWorkout()
        }
    }
}

// MARK: - HKLiveWorkoutBuilderDelegate

extension WorkoutCoordinator: HKLiveWorkoutBuilderDelegate {

    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

    func workoutBuilder(
        _ workoutBuilder: HKLiveWorkoutBuilder,
        didCollectDataOf collectedTypes: Set<HKSampleType>
    ) {
        var changed = false

        for type in collectedTypes {
            guard let quantityType = type as? HKQuantityType else { continue }

            if quantityType == HKQuantityType(.heartRate) {
                guard let stats = workoutBuilder.statistics(for: quantityType),
                      let value = stats.mostRecentQuantity()?
                          .doubleValue(for: .count().unitDivided(by: .minute()))
                else { continue }
                DispatchQueue.main.async {
                    self.heartRate = value
                    self.heartRateZone = Self.zone(forBpm: value)
                }
                changed = true

            } else if quantityType == HKQuantityType(.activeEnergyBurned) {
                guard let stats = workoutBuilder.statistics(for: quantityType),
                      let value = stats.sumQuantity()?.doubleValue(for: .kilocalorie())
                else { continue }
                DispatchQueue.main.async {
                    self.activeCalories = value
                }
                changed = true

            } else if quantityType == distanceType {
                guard let stats = workoutBuilder.statistics(for: quantityType),
                      let value = stats.sumQuantity()?.doubleValue(for: .meter())
                else { continue }
                DispatchQueue.main.async {
                    self.distanceMeters = value
                    if self.elapsedSeconds > 0, value > 0 {
                        self.paceMinPerKm = (self.elapsedSeconds / 60.0) / (value / 1000.0)
                    }
                }
                changed = true

            } else if quantityType == HKQuantityType(.stepCount) {
                guard let stats = workoutBuilder.statistics(for: quantityType),
                      let value = stats.sumQuantity()?.doubleValue(for: .count())
                else { continue }
                DispatchQueue.main.async {
                    self.stepCount = Int(value)
                }
                changed = true
            }
        }

        if changed {
            DispatchQueue.main.async {
                self.sendAllMetricsToPhone()
            }
        }
    }
}
