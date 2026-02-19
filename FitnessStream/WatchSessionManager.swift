import WatchConnectivity

protocol WatchSessionDelegate: AnyObject {
    func watchSession(_ manager: WatchSessionManager, didReceiveMetrics metrics: [String: Double])
    func watchSession(_ manager: WatchSessionManager, didChangeReachability reachable: Bool)
}

final class WatchSessionManager: NSObject {

    static let shared = WatchSessionManager()
    weak var delegate: WatchSessionDelegate?

    private(set) var isReachable = false
    private(set) var isPaired = false

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
        guard WCSession.default.isReachable else { return }
        let message: [String: Any] = [
            "command": command,
            "workoutName": workoutName,
        ]
        WCSession.default.sendMessage(message, replyHandler: nil)
    }

    func sendMetrics(_ metrics: WorkoutMetrics) {
        guard WCSession.default.isReachable else { return }
        guard let data = try? JSONEncoder().encode(metrics) else { return }
        let message: [String: Any] = ["metrics": data]
        WCSession.default.sendMessage(message, replyHandler: nil)
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
