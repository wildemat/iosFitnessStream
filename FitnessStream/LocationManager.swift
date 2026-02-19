import CoreLocation

protocol LocationManagerDelegate: AnyObject {
    func locationManager(_ manager: LocationManager, didUpdate location: CLLocation)
}

final class LocationManager: NSObject, CLLocationManagerDelegate {
    private let clManager = CLLocationManager()
    weak var delegate: LocationManagerDelegate?

    override init() {
        super.init()
        clManager.delegate = self
        clManager.desiredAccuracy = kCLLocationAccuracyBest
        clManager.activityType = .fitness
        clManager.allowsBackgroundLocationUpdates = true
        clManager.showsBackgroundLocationIndicator = true
    }

    func requestAuthorization() {
        clManager.requestWhenInUseAuthorization()
    }

    func start() {
        clManager.startUpdatingLocation()
    }

    func stop() {
        clManager.stopUpdatingLocation()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        delegate?.locationManager(self, didUpdate: loc)
    }
}
