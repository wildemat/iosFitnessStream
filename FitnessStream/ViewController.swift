import UIKit
import HealthKit

final class ViewController: UIViewController {

    private let endpointLabel: UILabel = {
        let l = UILabel()
        l.text = "Endpoint URL"
        l.font = .preferredFont(forTextStyle: .subheadline)
        l.textColor = .darkGray
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let endpointField: UITextField = {
        let f = UITextField()
        f.placeholder = "https://example.com/stream"
        f.borderStyle = .roundedRect
        f.autocapitalizationType = .none
        f.autocorrectionType = .no
        f.keyboardType = .URL
        f.returnKeyType = .done
        f.backgroundColor = .white
        f.textColor = .black
        f.translatesAutoresizingMaskIntoConstraints = false
        return f
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
        setupUI()
        endpointField.delegate = self
        endpointField.text = EndpointStorage.endpointURL
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
    }

    private func setupUI() {
        view.addSubview(endpointLabel)
        view.addSubview(endpointField)
        view.addSubview(workoutsLabel)
        view.addSubview(tableView)
        NSLayoutConstraint.activate([
            endpointLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 24),
            endpointLabel.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            endpointLabel.trailingAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),

            endpointField.topAnchor.constraint(equalTo: endpointLabel.bottomAnchor, constant: 8),
            endpointField.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            endpointField.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            endpointField.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),

            workoutsLabel.topAnchor.constraint(equalTo: endpointField.bottomAnchor, constant: 24),
            workoutsLabel.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),

            tableView.topAnchor.constraint(equalTo: workoutsLabel.bottomAnchor, constant: 8),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
    }
}

// MARK: - UITextFieldDelegate

extension ViewController: UITextFieldDelegate {
    func textFieldDidEndEditing(_ textField: UITextField) {
        let value = textField.text?.trimmingCharacters(in: .whitespacesAndNewlines)
        EndpointStorage.endpointURL = value?.isEmpty == true ? nil : value
    }

    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.resignFirstResponder()
        return true
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
        _ = selected // will navigate to start screen in feature/start-stream
    }
}
