# Fitness Stream

A lightweight iOS app that collects live fitness data during a workout and streams it to a configurable HTTP endpoint in real time. Minimal grayscale UI, background execution, lockscreen notifications, and Apple Watch sync support.

## Features

- **Endpoint configuration** — enter any URL; persisted across launches
- **Workout selection** — pick from 12 HealthKit workout types
- **Live metrics** — heart rate, HR zone, active energy, distance, pace, steps, GPS, elevation, elapsed time
- **Data streaming** — POST JSON metrics to your endpoint every second
- **Pause / End** — pause/resume toggle and end with confirmation
- **Background** — workout continues when the app is backgrounded; lockscreen notification shows workout name + elapsed time
- **Apple Watch** — WatchConnectivity relay for HR data and workout commands (companion watchOS app required for full sync)

## Requirements

- **Xcode 26+**
- **iOS 26.0+** deployment target (required for `HKWorkoutSession` on iPhone)
- An Apple Developer account (free or paid) for device builds
- A physical iPhone or iOS 26 simulator

## Development Setup

### 1. Clone and open

```bash
git clone https://github.com/wildemat/iosFitnessStream.git
cd iosFitnessStream
open FitnessStream.xcodeproj
```

### 2. Build and run on the simulator

From the command line:

```bash
xcodebuild \
  -scheme FitnessStream \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  build
```

Or in Xcode: select the **FitnessStream** scheme, pick an iOS 26 simulator (e.g. iPhone 17 Pro), and press **Cmd+R**.

> **Note:** HealthKit data (heart rate, energy, distance) is not available in the simulator. Use a physical device for full testing. Location can be simulated via Xcode's Debug > Simulate Location menu.

### 3. Build and run on a device

1. Open `FitnessStream.xcodeproj` in Xcode.
2. Select your Apple Developer team under **Signing & Capabilities** for the FitnessStream target.
3. If needed, change the bundle identifier (`com.fitnessstream.app`) to something unique under your team.
4. Connect your iPhone via USB or Wi-Fi.
5. Select your device in the scheme destination picker.
6. Press **Cmd+R** to build and run.

Xcode will provision a development certificate and profile automatically with "Automatic Signing."

### 4. Entitlements

The app requires these entitlements and permissions (already configured):

| Entitlement / Key | Purpose |
|---|---|
| `com.apple.developer.healthkit` | Read/write workout and health data |
| `NSHealthShareUsageDescription` | HealthKit read prompt |
| `NSHealthUpdateUsageDescription` | HealthKit write prompt |
| `NSLocationWhenInUseUsageDescription` | GPS for distance, pace, route |
| `UIBackgroundModes: location, processing` | Background workout + GPS |

## Publishing to TestFlight (Beta)

TestFlight lets you install the app on your phone (and testers' phones) without the App Store review process.

### Prerequisites

- A **paid** Apple Developer Program membership ($99/year)
- An **App Store Connect** record for your app

### Step-by-step

#### 1. Set up App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com) and sign in.
2. Go to **My Apps > +** and create a new app:
   - Platform: iOS
   - Name: Fitness Stream
   - Bundle ID: `com.fitnessstream.app` (must match Xcode)
   - SKU: `fitnessstream`

#### 2. Configure Xcode for distribution

1. Open `FitnessStream.xcodeproj`.
2. Select the **FitnessStream** target > **Signing & Capabilities**.
3. Ensure your paid Apple Developer team is selected.
4. Under **General**, verify the version (`1.0`) and build number (`1`). Increment the build number for each upload.

#### 3. Archive and upload

1. In Xcode, select **Any iOS Device (arm64)** as the destination (not a simulator).
2. **Product > Archive** (Cmd+Shift+B to build first, then Product > Archive).
3. When the archive completes, the Organizer window opens.
4. Select the archive and click **Distribute App**.
5. Choose **TestFlight & App Store** > **Upload**.
6. Follow the prompts (Xcode handles signing automatically).

Alternatively, from the command line:

```bash
# Archive
xcodebuild \
  -scheme FitnessStream \
  -destination 'generic/platform=iOS' \
  -archivePath build/FitnessStream.xcarchive \
  archive

# Export for TestFlight upload
xcodebuild \
  -exportArchive \
  -archivePath build/FitnessStream.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/export

# Upload via altool or Transporter app
xcrun altool --upload-app \
  -f build/export/FitnessStream.ipa \
  -t ios \
  -u your@apple.id \
  -p @keychain:AC_PASSWORD
```

> For the CLI path, create an `ExportOptions.plist` with method `app-store` and your team ID.

#### 4. Install via TestFlight

1. After upload, go to App Store Connect > **TestFlight**.
2. The build appears after Apple's automated processing (usually 10–30 minutes).
3. Add yourself (or testers) under **Internal Testing** or **External Testing**.
4. On the test device, install the **TestFlight** app from the App Store.
5. Open TestFlight — the build will appear. Tap **Install**.

### Quick alternative: Ad Hoc distribution

For personal use without TestFlight:

1. In the Xcode Organizer, select your archive.
2. Click **Distribute App > Ad Hoc**.
3. Select your device's provisioning profile.
4. Export the `.ipa` file.
5. Install via **Apple Configurator**, `ios-deploy`, or drag into Xcode's Devices window.

## Project Structure

```
FitnessStream/
├── AppDelegate.swift               # App launch, window setup, WCSession activation
├── ViewController.swift            # Endpoint field + workout type table
├── LiveMetricsViewController.swift # Live metrics display, pause/end controls
├── WorkoutSessionManager.swift     # HKWorkoutSession, HealthKit queries, timer
├── StreamClient.swift              # POST JSON metrics to endpoint
├── LocationManager.swift           # CoreLocation wrapper for GPS + elevation
├── WorkoutMetrics.swift            # Codable struct for all metric fields
├── WorkoutType.swift               # 12 HKWorkoutActivityType definitions
├── WorkoutNotificationManager.swift# Lockscreen notification badge
├── WatchSessionManager.swift       # WatchConnectivity for Apple Watch sync
├── EndpointStorage.swift           # UserDefaults persistence for endpoint URL
├── FitnessStream.entitlements      # HealthKit entitlement
└── Info.plist                      # Permissions, background modes, device caps
```

## License

Private — not licensed for redistribution.
