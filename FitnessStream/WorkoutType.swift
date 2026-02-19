import HealthKit

struct WorkoutType: Equatable {
    let activityType: HKWorkoutActivityType
    let displayName: String

    static let all: [WorkoutType] = [
        WorkoutType(activityType: .running, displayName: "Running"),
        WorkoutType(activityType: .cycling, displayName: "Cycling"),
        WorkoutType(activityType: .walking, displayName: "Walking"),
        WorkoutType(activityType: .swimming, displayName: "Swimming"),
        WorkoutType(activityType: .hiking, displayName: "Hiking"),
        WorkoutType(activityType: .yoga, displayName: "Yoga"),
        WorkoutType(activityType: .highIntensityIntervalTraining, displayName: "HIIT"),
        WorkoutType(activityType: .functionalStrengthTraining, displayName: "Strength"),
        WorkoutType(activityType: .rowing, displayName: "Rowing"),
        WorkoutType(activityType: .elliptical, displayName: "Elliptical"),
        WorkoutType(activityType: .socialDance, displayName: "Dance"),
        WorkoutType(activityType: .cooldown, displayName: "Cooldown"),
    ]

    static func == (lhs: WorkoutType, rhs: WorkoutType) -> Bool {
        lhs.activityType == rhs.activityType
    }
}
