import Foundation

struct WorkoutMetrics: Codable {
    var heartRate: Double?
    var heartRateZone: Int?
    var activeEnergyKcal: Double?
    var distanceMeters: Double?
    var paceMinPerKm: Double?
    var stepCount: Int?
    var latitude: Double?
    var longitude: Double?
    var elevationMeters: Double?
    var elapsedSeconds: TimeInterval = 0

    var timestamp: Date = Date()
    var workoutType: String = ""
}
