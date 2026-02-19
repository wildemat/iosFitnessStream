import Foundation

final class StreamClient {
    private let session = URLSession(configuration: .default)
    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        e.keyEncodingStrategy = .convertToSnakeCase
        return e
    }()

    func send(_ metrics: WorkoutMetrics) {
        guard let urlString = EndpointStorage.endpointURL,
              let url = URL(string: urlString) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? encoder.encode(metrics)

        session.dataTask(with: request) { _, _, _ in }.resume()
    }
}
