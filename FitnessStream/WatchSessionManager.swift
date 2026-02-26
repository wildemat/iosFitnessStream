import WatchConnectivity
import os.log

protocol WatchSessionDelegate: AnyObject {
    func watchSession(_ manager: WatchSessionManager, didReceiveMetrics metrics: [String: Double])
    func watchSession(_ manager: WatchSessionManager, didChangeReachability reachable: Bool)
}

final class WatchSessionManager: NSObject {

    static let shared = WatchSessionManager()
    weak var delegate: WatchSessionDelegate?

    private(set) var isReachable = false
    private(set) var isPaired = false

    private static let log = Logger(subsystem: "FitnessStream", category: "WatchSession")

    private var pendingCommand: (command: String, workoutName: String)?
    private var retryTimer: Timer?
    private var retryCount = 0
    private static let maxRetries = 5
    private static let retryInterval: TimeInterval = 2.0

    private override init() {
        super.init()
    }

    func activate() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    func sendWorkoutCommand(_ command: String, workoutName: String) {
        retryTimer?.invalidate()
        retryCount = 0

        let context: [String: Any] = [
            "command": command,
            "workoutName": workoutName,
            "sentAt": Date().timeIntervalSince1970,
        ]
        try? WCSession.default.updateApplicationContext(context)
        Self.log.info("Updated applicationContext: \(command) / \(workoutName)")

        pendingCommand = (command, workoutName)
        attemptSendMessage()
    }

    private func attemptSendMessage() {
        guard let pending = pendingCommand else { return }

        guard WCSession.default.activationState == .activated else {
            Self.log.warning("WCSession not activated, will retry")
            scheduleRetry()
            return
        }

        guard WCSession.default.isReachable else {
            Self.log.warning("Watch not reachable, will retry (\(self.retryCount)/\(Self.maxRetries))")
            scheduleRetry()
            return
        }

        let message: [String: Any] = [
            "command": pending.command,
            "workoutName": pending.workoutName,
        ]

        WCSession.default.sendMessage(message, replyHandler: { [weak self] _ in
            Self.log.info("Watch confirmed: \(pending.command)")
            self?.clearPendingCommand()
        }, errorHandler: { [weak self] error in
            Self.log.error("sendMessage failed: \(error.localizedDescription)")
            self?.scheduleRetry()
        })
    }

    private func scheduleRetry() {
        guard retryCount < Self.maxRetries else {
            Self.log.error("Exhausted retries for command: \(self.pendingCommand?.command ?? "nil")")
            clearPendingCommand()
            return
        }
        retryCount += 1
        retryTimer?.invalidate()
        retryTimer = Timer.scheduledTimer(withTimeInterval: Self.retryInterval, repeats: false) { [weak self] _ in
            self?.attemptSendMessage()
        }
    }

    private func clearPendingCommand() {
        DispatchQueue.main.async { [weak self] in
            self?.pendingCommand = nil
            self?.retryTimer?.invalidate()
            self?.retryTimer = nil
            self?.retryCount = 0
        }
    }

    func sendMetrics(_ metrics: WorkoutMetrics) {
        guard WCSession.default.isReachable else { return }
        guard let data = try? JSONEncoder().encode(metrics) else { return }
        let message: [String: Any] = ["metrics": data]
        WCSession.default.sendMessage(message, replyHandler: nil) { error in
            Self.log.error("sendMetrics failed: \(error.localizedDescription)")
        }
    }
}

// MARK: - WCSessionDelegate

extension WatchSessionManager: WCSessionDelegate {

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.isPaired = session.isPaired
            self.isReachable = session.isReachable
        }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) {
        session.activate()
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.isReachable = session.isReachable
            self.delegate?.watchSession(self, didChangeReachability: session.isReachable)

            if session.isReachable, self.pendingCommand != nil {
                Self.log.info("Watch became reachable, retrying pending command")
                self.attemptSendMessage()
            }
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        let metricKeys = ["heartRate", "activeEnergyKcal", "distanceMeters", "stepCount", "paceMinPerKm"]
        var parsed: [String: Double] = [:]
        for key in metricKeys {
            if let value = message[key] as? Double {
                parsed[key] = value
            }
        }

        guard !parsed.isEmpty else { return }

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.delegate?.watchSession(self, didReceiveMetrics: parsed)
        }
    }
}
