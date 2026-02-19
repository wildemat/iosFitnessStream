import SwiftUI

@main
struct FitnessStreamWatchApp: App {

    @StateObject private var coordinator = WorkoutCoordinator()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(coordinator)
                .onAppear { coordinator.activate() }
        }
    }
}
