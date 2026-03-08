import UIKit

final class StreamSettingsViewController: UIViewController {

    var onDismiss: (() -> Void)?

    // MARK: - Stream toggle

    private let streamToggle: UISwitch = {
        let s = UISwitch()
        s.translatesAutoresizingMaskIntoConstraints = false
        return s
    }()

    // MARK: - Connection section

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

    private let apiKeyField: UITextField = {
        let f = UITextField()
        f.placeholder = "Bearer token"
        f.borderStyle = .roundedRect
        f.autocapitalizationType = .none
        f.autocorrectionType = .no
        f.isSecureTextEntry = true
        f.returnKeyType = .done
        f.backgroundColor = .white
        f.textColor = .black
        f.translatesAutoresizingMaskIntoConstraints = false
        return f
    }()

    private let frequencyValueLabel: UILabel = {
        let l = UILabel()
        l.font = .monospacedDigitSystemFont(
            ofSize: UIFont.preferredFont(forTextStyle: .subheadline).pointSize,
            weight: .medium)
        l.textColor = .darkGray
        l.textAlignment = .right
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let frequencySlider: UISlider = {
        let s = UISlider()
        s.minimumValue = 1
        s.maximumValue = 30
        s.isContinuous = true
        s.translatesAutoresizingMaskIntoConstraints = false
        return s
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

    // MARK: - Data point rows

    private struct DataPointItem {
        let title: String
        let icon: UIImageView
        let button: UIButton
        let row: UIView
        let get: () -> Bool
        let set: (Bool) -> Void
    }

    private var dataPointItems: [DataPointItem] = []

    /// Views that become dimmed / disabled when stream is off.
    private var dependentViews: [UIView] = []
    private var dependentControls: [UIControl] = []

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemGray6
        presentationController?.delegate = self
        buildLayout()
        loadValues()
        wireActions()
        updateDependentState(animated: false)
    }

    // MARK: - Layout

    private func buildLayout() {
        let closeButton = UIButton(type: .system)
        closeButton.setImage(UIImage(systemName: "xmark.circle.fill"), for: .normal)
        closeButton.tintColor = .systemGray
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        closeButton.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)

        let titleLabel = UILabel()
        titleLabel.text = "Stream Settings"
        titleLabel.font = .systemFont(ofSize: 28, weight: .bold)
        titleLabel.textColor = .black
        titleLabel.translatesAutoresizingMaskIntoConstraints = false

        let scrollView = UIScrollView()
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.alwaysBounceVertical = true
        scrollView.keyboardDismissMode = .interactive

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 0
        stack.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(closeButton)
        view.addSubview(titleLabel)
        view.addSubview(scrollView)
        scrollView.addSubview(stack)

        let m: CGFloat = 20
        NSLayoutConstraint.activate([
            closeButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
            closeButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -m),
            closeButton.widthAnchor.constraint(equalToConstant: 30),
            closeButton.heightAnchor.constraint(equalToConstant: 30),

            titleLabel.topAnchor.constraint(equalTo: closeButton.bottomAnchor, constant: 8),
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: m),
            titleLabel.trailingAnchor.constraint(equalTo: closeButton.leadingAnchor, constant: -8),

            scrollView.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 16),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            stack.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor),
            stack.leadingAnchor.constraint(equalTo: scrollView.frameLayoutGuide.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: scrollView.frameLayoutGuide.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor),
        ])

        // --- Stream toggle (always enabled) ---
        let streamRow = makeSwitchRow(text: "Stream data", toggle: streamToggle,
                                      font: .preferredFont(forTextStyle: .headline))
        stack.addArrangedSubview(streamRow)
        stack.addArrangedSubview(makeSpacer(16))

        // --- Connection section ---
        let connHeader = makeSectionHeader("Connection")
        stack.addArrangedSubview(connHeader)

        let endpointGroup = makeFieldGroup(title: "Endpoint URL", field: endpointField)
        stack.addArrangedSubview(endpointGroup)

        let apiKeyGroup = makeFieldGroup(title: "API Key (optional)", field: apiKeyField)
        stack.addArrangedSubview(apiKeyGroup)

        let sliderGroup = makeSliderGroup()
        stack.addArrangedSubview(sliderGroup)

        let pingGroup = makePingGroup()
        stack.addArrangedSubview(pingGroup)

        stack.addArrangedSubview(makeSpacer(16))

        // --- Data points section ---
        let dpHeader = makeSectionHeader("Data Points")
        stack.addArrangedSubview(dpHeader)

        let dpConfig: [(String, () -> Bool, (Bool) -> Void)] = [
            ("Heart Rate",
             { EndpointStorage.heartRateEnabled },
             { EndpointStorage.heartRateEnabled = $0 }),
            ("HR Zone",
             { EndpointStorage.heartRateZoneEnabled },
             { EndpointStorage.heartRateZoneEnabled = $0 }),
            ("Energy",
             { EndpointStorage.activeEnergyEnabled },
             { EndpointStorage.activeEnergyEnabled = $0 }),
            ("Distance",
             { EndpointStorage.distanceEnabled },
             { EndpointStorage.distanceEnabled = $0 }),
            ("Pace",
             { EndpointStorage.paceEnabled },
             { EndpointStorage.paceEnabled = $0 }),
            ("Steps",
             { EndpointStorage.stepCountEnabled },
             { EndpointStorage.stepCountEnabled = $0 }),
            ("Location",
             { EndpointStorage.locationEnabled },
             { EndpointStorage.locationEnabled = $0 }),
            ("Elevation",
             { EndpointStorage.elevationEnabled },
             { EndpointStorage.elevationEnabled = $0 }),
        ]

        for (title, getter, setter) in dpConfig {
            let (row, icon, button) = makeDataPointRow(title: title)
            stack.addArrangedSubview(row)
            dataPointItems.append(DataPointItem(
                title: title, icon: icon, button: button,
                row: row, get: getter, set: setter))
        }

        stack.addArrangedSubview(makeSpacer(40))

        dependentViews = Array(stack.arrangedSubviews.dropFirst(2).dropLast(1))
        dependentControls = [endpointField, apiKeyField, frequencySlider, pingButton]
            + dataPointItems.map(\.button)
    }

    // MARK: - View builders

    private func makeSwitchRow(text: String, toggle: UISwitch,
                               font: UIFont = .preferredFont(forTextStyle: .body)) -> UIView {
        toggle.translatesAutoresizingMaskIntoConstraints = false
        let label = UILabel()
        label.text = text
        label.font = font
        label.textColor = .black
        label.translatesAutoresizingMaskIntoConstraints = false

        let container = UIView()
        container.backgroundColor = .white
        container.addSubview(label)
        container.addSubview(toggle)
        let m: CGFloat = 20
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: m),
            label.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            toggle.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -m),
            toggle.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            toggle.leadingAnchor.constraint(greaterThanOrEqualTo: label.trailingAnchor, constant: 8),
            container.heightAnchor.constraint(equalToConstant: 52),
        ])
        return container
    }

    private func makeDataPointRow(title: String) -> (UIView, UIImageView, UIButton) {
        let label = UILabel()
        label.text = title
        label.font = .preferredFont(forTextStyle: .body)
        label.textColor = .black
        label.translatesAutoresizingMaskIntoConstraints = false

        let icon = UIImageView()
        icon.translatesAutoresizingMaskIntoConstraints = false
        icon.contentMode = .scaleAspectFit
        icon.tintColor = .black
        icon.preferredSymbolConfiguration = UIImage.SymbolConfiguration(pointSize: 22, weight: .regular)

        let button = UIButton(type: .system)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.addTarget(self, action: #selector(dataPointTapped(_:)), for: .touchUpInside)

        let container = UIView()
        container.backgroundColor = .white
        container.addSubview(label)
        container.addSubview(icon)
        container.addSubview(button)

        let m: CGFloat = 20
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: m),
            label.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            icon.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -m),
            icon.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            icon.widthAnchor.constraint(equalToConstant: 24),
            icon.heightAnchor.constraint(equalToConstant: 24),
            icon.leadingAnchor.constraint(greaterThanOrEqualTo: label.trailingAnchor, constant: 8),
            button.topAnchor.constraint(equalTo: container.topAnchor),
            button.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            button.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            button.bottomAnchor.constraint(equalTo: container.bottomAnchor),
            container.heightAnchor.constraint(equalToConstant: 48),
        ])
        return (container, icon, button)
    }

    private func makeFieldGroup(title: String, field: UITextField) -> UIView {
        let label = UILabel()
        label.text = title
        label.font = .preferredFont(forTextStyle: .subheadline)
        label.textColor = .darkGray
        label.translatesAutoresizingMaskIntoConstraints = false

        let container = UIView()
        container.backgroundColor = .white
        container.addSubview(label)
        container.addSubview(field)
        let m: CGFloat = 20
        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: container.topAnchor, constant: 12),
            label.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: m),
            label.trailingAnchor.constraint(lessThanOrEqualTo: container.trailingAnchor, constant: -m),
            field.topAnchor.constraint(equalTo: label.bottomAnchor, constant: 6),
            field.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: m),
            field.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -m),
            field.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),
            field.bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -12),
        ])
        return container
    }

    private func makeSliderGroup() -> UIView {
        let label = UILabel()
        label.text = "Write Frequency"
        label.font = .preferredFont(forTextStyle: .subheadline)
        label.textColor = .darkGray
        label.translatesAutoresizingMaskIntoConstraints = false

        let container = UIView()
        container.backgroundColor = .white
        container.addSubview(label)
        container.addSubview(frequencyValueLabel)
        container.addSubview(frequencySlider)
        let m: CGFloat = 20
        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: container.topAnchor, constant: 12),
            label.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: m),
            frequencyValueLabel.centerYAnchor.constraint(equalTo: label.centerYAnchor),
            frequencyValueLabel.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -m),
            frequencyValueLabel.leadingAnchor.constraint(greaterThanOrEqualTo: label.trailingAnchor, constant: 8),
            frequencySlider.topAnchor.constraint(equalTo: label.bottomAnchor, constant: 8),
            frequencySlider.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: m),
            frequencySlider.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -m),
            frequencySlider.bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -12),
        ])
        return container
    }

    private func makePingGroup() -> UIView {
        let container = UIView()
        container.backgroundColor = .white
        container.addSubview(pingButton)
        container.addSubview(pingStatusLabel)
        let m: CGFloat = 20
        NSLayoutConstraint.activate([
            pingButton.topAnchor.constraint(equalTo: container.topAnchor, constant: 8),
            pingButton.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: m),
            pingButton.bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -8),
            pingStatusLabel.centerYAnchor.constraint(equalTo: pingButton.centerYAnchor),
            pingStatusLabel.leadingAnchor.constraint(equalTo: pingButton.trailingAnchor, constant: 10),
            pingStatusLabel.trailingAnchor.constraint(lessThanOrEqualTo: container.trailingAnchor, constant: -m),
        ])
        return container
    }

    private func makeSectionHeader(_ title: String) -> UIView {
        let label = UILabel()
        label.text = title
        label.font = .preferredFont(forTextStyle: .subheadline)
        label.textColor = .systemGray
        label.translatesAutoresizingMaskIntoConstraints = false
        let container = UIView()
        container.addSubview(label)
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 20),
            label.topAnchor.constraint(equalTo: container.topAnchor, constant: 4),
            label.bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -4),
        ])
        return container
    }

    private func makeSpacer(_ height: CGFloat) -> UIView {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.heightAnchor.constraint(equalToConstant: height).isActive = true
        return v
    }

    // MARK: - Load stored values

    private func loadValues() {
        streamToggle.isOn = EndpointStorage.streamEnabled
        endpointField.text = EndpointStorage.endpointURL
        apiKeyField.text = EndpointStorage.apiKey
        frequencySlider.value = Float(EndpointStorage.writeFrequency)
        updateFrequencyLabel()
        refreshDataPointIcons()
    }

    private func refreshDataPointIcons() {
        for item in dataPointItems {
            let enabled = item.get()
            item.icon.image = UIImage(systemName: enabled ? "checkmark.circle.fill" : "circle")
            item.icon.tintColor = enabled ? .black : .systemGray3
        }
    }

    // MARK: - Actions

    private func wireActions() {
        streamToggle.addTarget(self, action: #selector(streamToggleChanged), for: .valueChanged)
        frequencySlider.addTarget(self, action: #selector(frequencySliderChanged), for: .valueChanged)
        pingButton.addTarget(self, action: #selector(pingEndpoint), for: .touchUpInside)

        endpointField.delegate = self
        apiKeyField.delegate = self
    }

    @objc private func closeTapped() {
        endpointField.resignFirstResponder()
        apiKeyField.resignFirstResponder()
        persistTextFields()
        dismiss(animated: true) { [weak self] in
            self?.onDismiss?()
        }
    }

    @objc private func streamToggleChanged(_ sender: UISwitch) {
        EndpointStorage.streamEnabled = sender.isOn
        updateDependentState(animated: true)
    }

    @objc private func frequencySliderChanged(_ sender: UISlider) {
        let rounded = roundf(sender.value)
        sender.value = rounded
        EndpointStorage.writeFrequency = TimeInterval(rounded)
        updateFrequencyLabel()
    }

    @objc private func dataPointTapped(_ sender: UIButton) {
        guard let item = dataPointItems.first(where: { $0.button === sender }) else { return }
        let newValue = !item.get()
        item.set(newValue)
        item.icon.image = UIImage(systemName: newValue ? "checkmark.circle.fill" : "circle")
        item.icon.tintColor = newValue ? .black : .systemGray3
    }

    @objc private func pingEndpoint() {
        endpointField.resignFirstResponder()
        apiKeyField.resignFirstResponder()
        persistTextFields()

        let raw = endpointField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
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
        let key = apiKeyField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !key.isEmpty {
            request.setValue(key, forHTTPHeaderField: "X-API-Key")
        }
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

    // MARK: - Helpers

    private func persistTextFields() {
        let url = endpointField.text?.trimmingCharacters(in: .whitespacesAndNewlines)
        EndpointStorage.endpointURL = (url?.isEmpty == true) ? nil : url

        let key = apiKeyField.text?.trimmingCharacters(in: .whitespacesAndNewlines)
        EndpointStorage.apiKey = (key?.isEmpty == true) ? nil : key
    }

    private func updateFrequencyLabel() {
        let seconds = Int(EndpointStorage.writeFrequency)
        frequencyValueLabel.text = seconds == 1 ? "1 second" : "\(seconds) seconds"
    }

    private func showPingResult(success: Bool, message: String) {
        let icon = success ? "✓" : "✗"
        pingStatusLabel.text = "\(icon)  \(message)"
        pingStatusLabel.textColor = success ? .systemGreen : .systemRed
    }

    private func updateDependentState(animated: Bool) {
        let enabled = streamToggle.isOn
        let apply = {
            for control in self.dependentControls {
                control.isEnabled = enabled
            }
            for v in self.dependentViews {
                v.alpha = enabled ? 1.0 : 0.4
            }
        }
        if animated {
            UIView.animate(withDuration: 0.25, animations: apply)
        } else {
            apply()
        }
    }
}

// MARK: - UIAdaptivePresentationControllerDelegate

extension StreamSettingsViewController: UIAdaptivePresentationControllerDelegate {
    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        onDismiss?()
    }
}

// MARK: - UITextFieldDelegate

extension StreamSettingsViewController: UITextFieldDelegate {
    func textFieldDidEndEditing(_ textField: UITextField) {
        persistTextFields()
    }

    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.resignFirstResponder()
        return true
    }
}
