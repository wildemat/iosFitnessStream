import UserNotifications

final class WorkoutNotificationManager {

    static let shared = WorkoutNotificationManager()
    private let center = UNUserNotificationCenter.current()
    private let notificationID = "com.fitnessstream.workout-active"

    private init() {}

    func requestAuthorization() {
        center.requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }

    func postWorkoutActive(name: String, elapsed: TimeInterval) {
        let content = UNMutableNotificationContent()
        content.title = name
        content.body = formatElapsed(elapsed)
        content.sound = nil
        content.interruptionLevel = .passive
        content.relevanceScore = 1.0

        let request = UNNotificationRequest(
            identifier: notificationID,
            content: content,
            trigger: nil
        )
        center.add(request)
    }

    func removeWorkoutNotification() {
        center.removeDeliveredNotifications(withIdentifiers: [notificationID])
        center.removePendingNotificationRequests(withIdentifiers: [notificationID])
    }

    private func formatElapsed(_ t: TimeInterval) -> String {
        let total = Int(t)
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        if h > 0 {
            return String(format: "%d:%02d:%02d", h, m, s)
        }
        return String(format: "%02d:%02d", m, s)
    }
}
