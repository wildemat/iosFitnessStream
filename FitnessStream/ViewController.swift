import UIKit
import HealthKit

final class ViewController: UIViewController {

    private let streamStatusLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 13, weight: .semibold)
        return l
    }()

    private let workoutsLabel: UILabel = {
        let l = UILabel()
        l.text = "Select Workout"
        l.font = .preferredFont(forTextStyle: .subheadline)
        l.textColor = .darkGray
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let tableView: UITableView = {
        let tv = UITableView(frame: .zero, style: .plain)
        tv.backgroundColor = .systemGray6
        tv.separatorColor = .systemGray4
        tv.translatesAutoresizingMaskIntoConstraints = false
        return tv
    }()

    private let workoutTypes = WorkoutType.all

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemGray6
        title = "Fitness Stream"

        let gearButton = UIButton(type: .system)
        gearButton.setImage(UIImage(systemName: "gearshape"), for: .normal)
        gearButton.addTarget(self, action: #selector(openSettings), for: .touchUpInside)

        let navStack = UIStackView(arrangedSubviews: [streamStatusLabel, gearButton])
        navStack.axis = .horizontal
        navStack.spacing = 8
        navStack.alignment = .center
        navigationItem.rightBarButtonItem = UIBarButtonItem(customView: navStack)

        setupUI()
        tableView.dataSource = self
        tableView.delegate = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "WorkoutCell")
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: animated)
        if let selected = tableView.indexPathForSelectedRow {
            tableView.deselectRow(at: selected, animated: animated)
        }
        updateStreamStatus()
    }

    private func updateStreamStatus() {
        let enabled = EndpointStorage.streamEnabled
        streamStatusLabel.text = enabled ? "Streaming Enabled" : "Streaming Disabled"
        streamStatusLabel.textColor = enabled ? .systemBlue : .systemRed
    }

    private func setupUI() {
        view.addSubview(workoutsLabel)
        view.addSubview(tableView)

        let margin: CGFloat = 20
        NSLayoutConstraint.activate([
            workoutsLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            workoutsLabel.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: margin),

            tableView.topAnchor.constraint(equalTo: workoutsLabel.bottomAnchor, constant: 8),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
    }

    @objc private func openSettings() {
        let settings = StreamSettingsViewController()
        settings.modalPresentationStyle = .formSheet
        present(settings, animated: true)
    }
}

// MARK: - UITableViewDataSource & Delegate

extension ViewController: UITableViewDataSource, UITableViewDelegate {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        workoutTypes.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "WorkoutCell", for: indexPath)
        let workout = workoutTypes[indexPath.row]
        cell.textLabel?.text = workout.displayName
        cell.textLabel?.textColor = .black
        cell.backgroundColor = .white
        cell.accessoryType = .disclosureIndicator
        return cell
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let selected = workoutTypes[indexPath.row]
        let vc = LiveMetricsViewController(workoutType: selected)
        navigationController?.pushViewController(vc, animated: true)
    }
}
