import SwiftUI

struct ContentView: View {

    @EnvironmentObject var coordinator: WorkoutCoordinator

    var body: some View {
        switch coordinator.workoutState {
        case .idle:
            idleView
        case .active, .paused:
            workoutView
        }
    }

    // MARK: - Idle

    private var idleView: some View {
        VStack(spacing: 14) {
            Image(systemName: "heart.circle")
                .font(.system(size: 44))
                .foregroundStyle(.gray)

            Text("FitnessStream")
                .font(.headline)

            HStack(spacing: 6) {
                Circle()
                    .fill(coordinator.isPhoneReachable ? .green : .gray)
                    .frame(width: 8, height: 8)
                Text(coordinator.isPhoneReachable
                     ? "iPhone connected"
                     : "Waiting for iPhone\u{2026}")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Active workout

    private var workoutView: some View {
        ScrollView {
            VStack(spacing: 6) {
                headerRow
                heartRateCard
                Divider()
                timeRow
                statsGrid
            }
            .padding(.horizontal, 4)
        }
    }

    private var headerRow: some View {
        HStack {
            Text(coordinator.workoutName.uppercased())
                .font(.caption2)
                .foregroundStyle(.secondary)

            Spacer()

            if coordinator.workoutState == .paused {
                Text("PAUSED")
                    .font(.system(size: 10, weight: .bold))
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(.yellow.opacity(0.3))
                    .clipShape(Capsule())
                    .foregroundStyle(.yellow)
            }
        }
    }

    private var heartRateCard: some View {
        VStack(spacing: 2) {
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Image(systemName: "heart.fill")
                    .foregroundStyle(.red)
                    .font(.title3)

                Text(coordinator.heartRate > 0
                     ? "\(Int(coordinator.heartRate))"
                     : "--")
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .monospacedDigit()

                Text("BPM")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .padding(.bottom, 4)
            }

            if coordinator.heartRate > 0 {
                Text("Zone \(coordinator.heartRateZone)")
                    .font(.system(size: 11, weight: .semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(zoneColor.opacity(0.25))
                    .clipShape(Capsule())
                    .foregroundStyle(zoneColor)
            }
        }
    }

    private var timeRow: some View {
        HStack {
            Image(systemName: "timer")
                .foregroundStyle(.gray)
            Text(formattedTime(coordinator.elapsedSeconds))
                .font(.system(.body, design: .monospaced))
                .monospacedDigit()
        }
    }

    private var statsGrid: some View {
        VStack(spacing: 4) {
            if coordinator.activeCalories > 0 {
                statRow(icon: "flame.fill", color: .orange,
                        value: "\(Int(coordinator.activeCalories))", unit: "kcal")
            }
            if coordinator.distanceMeters > 0 {
                statRow(icon: "figure.walk", color: .cyan,
                        value: formattedDistance(coordinator.distanceMeters), unit: "km")
            }
            if coordinator.paceMinPerKm > 0, coordinator.paceMinPerKm.isFinite {
                statRow(icon: "speedometer", color: .mint,
                        value: formattedPace(coordinator.paceMinPerKm), unit: "min/km")
            }
            if coordinator.stepCount > 0 {
                statRow(icon: "shoeprints.fill", color: .teal,
                        value: "\(coordinator.stepCount)", unit: "steps")
            }
        }
    }

    private func statRow(icon: String, color: Color, value: String, unit: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .frame(width: 16)
            Text(value)
                .font(.system(.caption, design: .monospaced))
                .monospacedDigit()
            Text(unit)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Spacer()
        }
    }

    // MARK: - Helpers

    private var zoneColor: Color {
        switch coordinator.heartRateZone {
        case 1: return .blue
        case 2: return .green
        case 3: return .yellow
        case 4: return .orange
        case 5: return .red
        default: return .gray
        }
    }

    private func formattedTime(_ seconds: TimeInterval) -> String {
        let total = Int(seconds)
        let hrs = total / 3600
        let mins = (total % 3600) / 60
        let secs = total % 60
        if hrs > 0 {
            return String(format: "%d:%02d:%02d", hrs, mins, secs)
        }
        return String(format: "%02d:%02d", mins, secs)
    }

    private func formattedDistance(_ meters: Double) -> String {
        String(format: "%.2f", meters / 1000.0)
    }

    private func formattedPace(_ minPerKm: Double) -> String {
        let mins = Int(minPerKm)
        let secs = Int((minPerKm - Double(mins)) * 60)
        return String(format: "%d:%02d", mins, secs)
    }
}
