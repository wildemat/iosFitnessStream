import Foundation
import os.log

final class StreamClient {
    private static let log = Logger(subsystem: "FitnessStream", category: "StreamClient")

    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 10
        config.waitsForConnectivity = false
        return URLSession(configuration: config)
    }()

    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        e.keyEncodingStrategy = .convertToSnakeCase
        return e
    }()

    func send(_ metrics: WorkoutMetrics) {
        guard let urlString = EndpointStorage.endpointURL,
              let url = URL(string: urlString) else {
            Self.log.warning("No endpoint URL configured")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        guard let body = try? encoder.encode(metrics) else {
            Self.log.error("Failed to encode metrics")
            return
        }
        request.httpBody = body

        session.dataTask(with: request) { _, response, error in
            if let error {
                Self.log.error("POST failed: \(error.localizedDescription) → \(urlString)")
                return
            }
            if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                Self.log.warning("POST returned \(http.statusCode) from \(urlString)")
            }
        }.resume()
    }
}
