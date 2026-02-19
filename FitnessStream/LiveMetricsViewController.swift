import UIKit

private func metricLabel(size: CGFloat = 20) -> UILabel {
    let l = UILabel()
    l.font = .monospacedDigitSystemFont(ofSize: size, weight: .semibold)
    l.textColor = .black
    l.textAlignment = .right
    l.translatesAutoresizingMaskIntoConstraints = false
    return l
}

final class LiveMetricsViewController: UIViewController {

    private let workoutType: WorkoutType
    private(set) lazy var manager = WorkoutSessionManager(workoutType: workoutType)

    // MARK: - Metric labels

    private let elapsedLabel = metricLabel(size: 48)
    private let hrValueLabel = metricLabel()
    private let hrZoneLabel  = metricLabel()
    private let energyLabel  = metricLabel()
    private let distanceLabel = metricLabel()
    private let paceLabel    = metricLabel()
    private let stepsLabel   = metricLabel()
    private let locationLabel = metricLabel(size: 13)
    private let elevationLabel = metricLabel()

    private let pauseButton: UIButton = {
        let b = UIButton(type: .system)
        b.setTitle("Pause", for: .normal)
        b.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
        b.setTitleColor(.white, for: .normal)
        b.backgroundColor = .darkGray
        b.layer.cornerRadius = 12
        b.translatesAutoresizingMaskIntoConstraints = false
        return b
    }()

    private let endButton: UIButton = {
        let b = UIButton(type: .system)
        b.setTitle("End", for: .normal)
        b.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
        b.setTitleColor(.white, for: .normal)
        b.backgroundColor = .black
        b.layer.cornerRadius = 12
        b.translatesAutoresizingMaskIntoConstraints = false
        return b
    }()

    private let statusLabel: UILabel = {
        let l = UILabel()
        l.font = .preferredFont(forTextStyle: .footnote)
        l.textColor = .systemGray
        l.textAlignment = .center
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    // MARK: - Init

    init(workoutType: WorkoutType) {
        self.workoutType = workoutType
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemGray6
        title = workoutType.displayName
        navigationItem.hidesBackButton = true

        buildLayout()
        pauseButton.addTarget(self, action: #selector(pauseTapped), for: .touchUpInside)
        endButton.addTarget(self, action: #selector(endTapped), for: .touchUpInside)
        pauseButton.isHidden = true
        endButton.isHidden = true

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

    // MARK: - Layout

    private func buildLayout() {
        let rows: [(String, UILabel)] = [
            ("Heart Rate",  hrValueLabel),
            ("HR Zone",     hrZoneLabel),
            ("Energy",      energyLabel),
            ("Distance",    distanceLabel),
            ("Pace",        paceLabel),
            ("Steps",       stepsLabel),
            ("Location",    locationLabel),
            ("Elevation",   elevationLabel),
        ]

        let grid = UIStackView()
        grid.axis = .vertical
        grid.spacing = 2
        grid.translatesAutoresizingMaskIntoConstraints = false

        for (title, valueLabel) in rows {
            let row = makeRow(title: title, valueLabel: valueLabel)
            grid.addArrangedSubview(row)
        }

        let scroll = UIScrollView()
        scroll.translatesAutoresizingMaskIntoConstraints = false

        let buttonStack = UIStackView(arrangedSubviews: [pauseButton, endButton])
        buttonStack.axis = .horizontal
        buttonStack.spacing = 16
        buttonStack.distribution = .fillEqually
        buttonStack.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(elapsedLabel)
        view.addSubview(scroll)
        view.addSubview(buttonStack)
        view.addSubview(statusLabel)
        scroll.addSubview(grid)

        NSLayoutConstraint.activate([
            elapsedLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            elapsedLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),

            scroll.topAnchor.constraint(equalTo: elapsedLabel.bottomAnchor, constant: 20),
            scroll.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scroll.bottomAnchor.constraint(equalTo: buttonStack.topAnchor, constant: -12),

            grid.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor),
            grid.leadingAnchor.constraint(equalTo: scroll.frameLayoutGuide.leadingAnchor),
            grid.trailingAnchor.constraint(equalTo: scroll.frameLayoutGuide.trailingAnchor),
            grid.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor),

            buttonStack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            buttonStack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            pauseButton.heightAnchor.constraint(equalToConstant: 50),
            endButton.heightAnchor.constraint(equalToConstant: 50),

            statusLabel.topAnchor.constraint(equalTo: buttonStack.bottomAnchor, constant: 8),
            statusLabel.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -12),
            statusLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
        ])

        elapsedLabel.text = "00:00"
        for (_, lbl) in rows { lbl.text = "--" }
    }

    private func makeRow(title: String, valueLabel: UILabel) -> UIView {
        let titleLabel = UILabel()
        titleLabel.text = title
        titleLabel.font = .preferredFont(forTextStyle: .caption1)
        titleLabel.textColor = .systemGray
        titleLabel.setContentHuggingPriority(.defaultHigh, for: .horizontal)

        let stack = UIStackView(arrangedSubviews: [titleLabel, valueLabel])
        stack.axis = .horizontal
        stack.distribution = .fill
        stack.alignment = .firstBaseline
        stack.spacing = 8

        let container = UIView()
        container.backgroundColor = .white
        stack.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: container.topAnchor, constant: 12),
            stack.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -20),
            stack.bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -12),
        ])
        return container
    }

    // MARK: - Actions

    @objc private func pauseTapped() {
        if manager.state == .running {
            manager.pauseWorkout()
        } else if manager.state == .paused {
            manager.resumeWorkout()
        }
    }

    @objc private func endTapped() {
        let alert = UIAlertController(title: "End Workout?", message: nil, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        alert.addAction(UIAlertAction(title: "End", style: .destructive) { [weak self] _ in
            self?.manager.endWorkout()
        })
        present(alert, animated: true)
    }

    // MARK: - Helpers

    private func updateMetricsUI(_ m: WorkoutMetrics) {
        let elapsed = Int(m.elapsedSeconds)
        let mm = elapsed / 60
        let ss = elapsed % 60
        elapsedLabel.text = String(format: "%02d:%02d", mm, ss)

        hrValueLabel.text  = m.heartRate.map { String(format: "%.0f bpm", $0) } ?? "--"
        hrZoneLabel.text   = m.heartRateZone.map { "Zone \($0)" } ?? "--"
        energyLabel.text   = m.activeEnergyKcal.map { String(format: "%.0f kcal", $0) } ?? "--"
        distanceLabel.text = m.distanceMeters.map { formatDistance($0) } ?? "--"
        paceLabel.text     = m.paceMinPerKm.map { formatPace($0) } ?? "--"
        stepsLabel.text    = m.stepCount.map { "\($0)" } ?? "--"
        elevationLabel.text = m.elevationMeters.map { String(format: "%.0f m", $0) } ?? "--"

        if let lat = m.latitude, let lon = m.longitude {
            locationLabel.text = String(format: "%.5f, %.5f", lat, lon)
        } else {
            locationLabel.text = "--"
        }
    }

    private func formatDistance(_ meters: Double) -> String {
        if meters >= 1000 {
            return String(format: "%.2f km", meters / 1000)
        }
        return String(format: "%.0f m", meters)
    }

    private func formatPace(_ minPerKm: Double) -> String {
        guard minPerKm.isFinite, minPerKm > 0 else { return "--" }
        let totalSeconds = Int(minPerKm * 60)
        return String(format: "%d:%02d /km", totalSeconds / 60, totalSeconds % 60)
    }
}

// MARK: - WorkoutSessionDelegate

extension LiveMetricsViewController: WorkoutSessionDelegate {
    func workoutSession(_ manager: WorkoutSessionManager, didUpdateMetrics metrics: WorkoutMetrics) {
        updateMetricsUI(metrics)
    }

    func workoutSession(_ manager: WorkoutSessionManager, didChangeState state: WorkoutState) {
        switch state {
        case .running:
            statusLabel.text = "Streaming to endpoint…"
            pauseButton.isHidden = false
            endButton.isHidden = false
            pauseButton.setTitle("Pause", for: .normal)
            pauseButton.backgroundColor = .darkGray
        case .paused:
            statusLabel.text = "Paused"
            pauseButton.setTitle("Resume", for: .normal)
            pauseButton.backgroundColor = .systemGray2
        case .ended:
            statusLabel.text = "Workout ended"
            pauseButton.isHidden = true
            endButton.isHidden = true
            navigationItem.hidesBackButton = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
                self?.navigationController?.popViewController(animated: true)
            }
        case .notStarted: break
        }
    }

    func workoutSession(_ manager: WorkoutSessionManager, didFailWith error: Error) {
        statusLabel.text = "Error: \(error.localizedDescription)"
    }
}
