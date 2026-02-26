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

    private let pingButton: UIButton = {
        let b = UIButton(type: .system)
        b.translatesAutoresizingMaskIntoConstraints = false
        var config = UIButton.Configuration.tinted()
        config.title = "Test Connection"
        config.image = UIImage(systemName: "antenna.radiowaves.left.and.right")
        config.imagePadding = 6
        config.cornerStyle = .medium
        config.buttonSize = .small
        b.configuration = config
        return b
    }()

    private let pingStatusLabel: UILabel = {
        let l = UILabel()
        l.font = .preferredFont(forTextStyle: .caption1)
        l.textColor = .secondaryLabel
        l.numberOfLines = 2
        l.translatesAutoresizingMaskIntoConstraints = false
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
        view.addSubview(pingButton)
        view.addSubview(pingStatusLabel)
        view.addSubview(workoutsLabel)
        view.addSubview(tableView)

        pingButton.addTarget(self, action: #selector(pingEndpoint), for: .touchUpInside)

        NSLayoutConstraint.activate([
            endpointLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 24),
            endpointLabel.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            endpointLabel.trailingAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),

            endpointField.topAnchor.constraint(equalTo: endpointLabel.bottomAnchor, constant: 8),
            endpointField.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            endpointField.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            endpointField.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),

            pingButton.topAnchor.constraint(equalTo: endpointField.bottomAnchor, constant: 10),
            pingButton.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),

            pingStatusLabel.centerYAnchor.constraint(equalTo: pingButton.centerYAnchor),
            pingStatusLabel.leadingAnchor.constraint(equalTo: pingButton.trailingAnchor, constant: 10),
            pingStatusLabel.trailingAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),

            workoutsLabel.topAnchor.constraint(equalTo: pingButton.bottomAnchor, constant: 20),
            workoutsLabel.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),

            tableView.topAnchor.constraint(equalTo: workoutsLabel.bottomAnchor, constant: 8),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
    }

    @objc private func pingEndpoint() {
        endpointField.resignFirstResponder()

        let raw = endpointField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        EndpointStorage.endpointURL = raw.isEmpty ? nil : raw

        guard !raw.isEmpty, let url = URL(string: raw) else {
            showPingResult(success: false, message: "Enter a URL first")
            return
        }

        pingButton.isEnabled = false
        pingButton.configuration?.showsActivityIndicator = true
        pingStatusLabel.text = nil

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = Data("{\"ping\":true}".utf8)
        request.timeoutInterval = 5

        let start = CFAbsoluteTimeGetCurrent()

        URLSession.shared.dataTask(with: request) { [weak self] _, response, error in
            let ms = Int((CFAbsoluteTimeGetCurrent() - start) * 1000)

            DispatchQueue.main.async {
                guard let self else { return }
                self.pingButton.isEnabled = true
                self.pingButton.configuration?.showsActivityIndicator = false

                if let error {
                    self.showPingResult(success: false, message: error.localizedDescription)
                    return
                }

                guard let http = response as? HTTPURLResponse else {
                    self.showPingResult(success: false, message: "No HTTP response")
                    return
                }

                if (200...299).contains(http.statusCode) {
                    self.showPingResult(success: true, message: "OK  \(http.statusCode) · \(ms) ms")
                } else {
                    self.showPingResult(success: false, message: "HTTP \(http.statusCode) · \(ms) ms")
                }
            }
        }.resume()
    }

    private func showPingResult(success: Bool, message: String) {
        let icon = success ? "✓" : "✗"
        pingStatusLabel.text = "\(icon)  \(message)"
        pingStatusLabel.textColor = success ? .systemGreen : .systemRed
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
        let vc = LiveMetricsViewController(workoutType: selected)
        navigationController?.pushViewController(vc, animated: true)
    }
}
