import UIKit

final class LiveMetricsViewController: UIViewController {

    private let workoutType: WorkoutType
    private(set) lazy var manager = WorkoutSessionManager(workoutType: workoutType)

    private let statusLabel: UILabel = {
        let l = UILabel()
        l.font = .monospacedDigitSystemFont(ofSize: 18, weight: .medium)
        l.textColor = .darkGray
        l.textAlignment = .center
        l.numberOfLines = 0
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    init(workoutType: WorkoutType) {
        self.workoutType = workoutType
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError() }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemGray6
        title = workoutType.displayName
        navigationItem.hidesBackButton = true

        view.addSubview(statusLabel)
        NSLayoutConstraint.activate([
            statusLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            statusLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            statusLabel.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 20),
        ])

        statusLabel.text = "Requesting authorization…"
        manager.delegate = self
        manager.requestAuthorization { [weak self] authorized, _ in
            DispatchQueue.main.async {
                guard let self else { return }
                if authorized {
                    self.manager.startWorkout()
                } else {
                    self.statusLabel.text = "HealthKit authorization denied"
                }
            }
        }
    }
}

// MARK: - WorkoutSessionDelegate

extension LiveMetricsViewController: WorkoutSessionDelegate {
    func workoutSession(_ manager: WorkoutSessionManager, didUpdateMetrics metrics: WorkoutMetrics) {
        let elapsed = Int(metrics.elapsedSeconds)
        let mm = elapsed / 60
        let ss = elapsed % 60
        statusLabel.text = "Streaming \(workoutType.displayName)\n\(String(format: "%02d:%02d", mm, ss))"
    }

    func workoutSession(_ manager: WorkoutSessionManager, didChangeState state: WorkoutState) {
        switch state {
        case .running:  statusLabel.text = "Streaming \(workoutType.displayName)…"
        case .paused:   statusLabel.text = "Paused"
        case .ended:    statusLabel.text = "Workout ended"
        case .notStarted: break
        }
    }

    func workoutSession(_ manager: WorkoutSessionManager, didFailWith error: Error) {
        statusLabel.text = "Error: \(error.localizedDescription)"
    }
}
