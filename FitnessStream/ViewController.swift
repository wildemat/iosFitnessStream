import UIKit

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

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemGray6
        title = "Fitness Stream"
        setupEndpointSection()
        endpointField.delegate = self
        endpointField.text = EndpointStorage.endpointURL
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: animated)
    }

    private func setupEndpointSection() {
        view.addSubview(endpointLabel)
        view.addSubview(endpointField)
        NSLayoutConstraint.activate([
            endpointLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 24),
            endpointLabel.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            endpointLabel.trailingAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            endpointField.topAnchor.constraint(equalTo: endpointLabel.bottomAnchor, constant: 8),
            endpointField.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            endpointField.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            endpointField.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),
        ])
    }
}

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
