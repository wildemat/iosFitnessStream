<p align="center">
  <a href="https://apps.apple.com/us/app/fitness-stream/id6759740524">
    <img src="FitnessStream/Assets.xcassets/AppIcon.appiconset/AppIcon.png" width="140" height="140" alt="Fitness Stream" />
  </a>
</p>

<h1 align="center">Fitness Stream (Proof of Concept)</h1>

<p align="center">
  Stream live workout metrics from your iPhone into OBS overlays — heart rate, pace, distance, GPS minimap, and more. Take your iPhone and camera out on a workout; see everything live in OBS back home.
</p>

<p align="center">
  <a href="https://apps.apple.com/us/app/fitness-stream/id6759740524">
    <img src="https://img.shields.io/badge/Download_on_the-App_Store-000000?style=for-the-badge&logo=app-store&logoColor=white" alt="Download on the App Store" />
  </a>
</p>

<p align="center">
  Demo livestream: <a href="https://youtube.com/live/KvPspU89zE4">youtube.com/live/KvPspU89zE4</a>
</p>

<br/>

<img src='overlays/assets/overlays.png'/>

## How It Works

```
┌────────────────┐  POST /       ┌───────┐  SSE /events  ┌──────────────────┐
│   iPhone App   │ ────────────▶ │  API  │ ────────────▶ │  Client website  │
│ (FitnessStream)│               └───────┘               │     (React)      │
└────────────────┘                                       └────────┬─────────┘
                                                                  │
                                                       OBS Browser Source
                                                                  │
┌────────────────┐  RTSP         ┌────────────┐                   ▼
│  Video source  │ ────────────▶ │ Moblin App │ ─── RTSP ───▶ ┌──────────────────────────┐
│ (iPhone/GoPro) │               │  (iPhone)  │               │          OBS             │
└────────────────┘               └────────────┘               │  • Camera via RTSP       │
                                                              │  • Overlays via Browser  │
                                                              └──────────────────────────┘
```

You take your iPhone (running FitnessStream) and a video source (an iPhone or GoPro, streaming through Moblin) out on a workout. The iPhone app POSTs live metrics to an externally accessible API. Back at home, OBS receives the camera feed from Moblin via RTSP and displays real-time metric overlays from the client website, which subscribes to the API's SSE stream.

| #   | Component              | What it does                                                                            |
| --- | ---------------------- | --------------------------------------------------------------------------------------- |
| 1   | **iPhone App**         | Starts a workout and POSTs live metrics to the API                                      |
| 2   | **API**                | Receives metrics and re-broadcasts them as a Server-Sent Events stream                  |
| 3   | **Client website**     | React app that renders live widgets (HR, pace, map, etc.) from the SSE stream           |
| 4   | **Video source**       | An iPhone or GoPro that provides the camera feed to Moblin                               |
| 5   | **Moblin App**         | Receives the video feed and streams it to OBS via RTSP                                  |
| 6   | **OBS**                | Combines the camera feed (RTSP) with metric overlays (Browser Source) into your stream  |

### Deployment options

The API must be reachable over the internet so the iPhone can send metrics from anywhere. The client website can run locally on the OBS machine or be hosted externally.

| Approach                              | API                                                    | Client website     | Cost | Setup difficulty |
| ------------------------------------- | ------------------------------------------------------ | ------------------ | ---- | ---------------- |
| **Cloud-hosted API**                  | Deployed to a hosting provider                         | Hosted or local    | Free tier or paid | Easiest |
| **Self-hosted + tunnel**              | On your OBS machine, exposed via a free tunnel service | Local              | Free | Moderate |
| **Self-hosted + port&nbsp;forwarding** | On your OBS machine, exposed via router port forwarding | Local             | Free | Requires router config |

A completely free setup is possible by self-hosting the API on your OBS machine and exposing it with a free tunnel service (Cloudflare Tunnel, Tailscale, or ngrok). This works, but requires more network configuration and is less convenient than deploying to a cloud provider.

---

## Prerequisites

- **OBS Studio** — [obsproject.com](https://obsproject.com)
- **Moblin** — free from the iOS App Store ([moblin.camera](https://moblin.camera))
- **FitnessStream** — the companion iOS app (see [iPhone App](#5-iphone-app-fitnessstream) below)
- **Node.js 18+** — [nodejs.org](https://nodejs.org) (only needed for self-hosted API or running the client website locally)

---

## 1. API

The API accepts JSON metrics via `POST /` from the iPhone app and re-broadcasts them to connected clients via `GET /events` (Server-Sent Events). It is a zero-dependency Node.js process.

The API **must be reachable from the internet** so the iPhone can POST metrics while you're out on a workout.

### Cloud-hosted (recommended)

Deploy the API to any Node.js hosting provider. Free-tier options include:

- [Railway](https://railway.app)
- [Render](https://render.com)
- [Fly.io](https://fly.io)

Once deployed, note your API URL (e.g. `https://fitness-stream.up.railway.app`). You'll configure the iPhone app and client website to point to this URL.

### Self-hosted (free)

Run the API on your OBS machine and expose it to the internet so the iPhone can reach it from anywhere.

```bash
cd local
node server.js
```

On startup it prints:

```
FitnessStream receiver listening on port 8080
Set the app endpoint to:  http://192.168.1.42:8080/
SSE overlay endpoint:     http://localhost:8080/events
Waiting for workout data...
```

To change the port:

```bash
PORT=3000 node server.js
```

To make the API reachable from outside your network, use one of the options below.

#### Cloudflare Tunnel (recommended free option)

Cloudflare Tunnel creates an encrypted outbound connection from your machine to Cloudflare's edge, so you never open a port on your router. Free for personal use. Requires a Cloudflare account and a domain (free domains work).

1. **Install cloudflared:**

   ```bash
   # macOS
   brew install cloudflared

   # Linux
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
   chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/

   # Windows — download from https://github.com/cloudflare/cloudflared/releases
   ```

2. **Authenticate and create a tunnel:**

   ```bash
   cloudflared tunnel login
   cloudflared tunnel create fitness-stream
   cloudflared tunnel route dns fitness-stream stream.yourdomain.com
   ```

3. **Create the config file** at `~/.cloudflared/config.yml`:

   ```yaml
   tunnel: fitness-stream
   credentials-file: /Users/<you>/.cloudflared/<tunnel-id>.json

   ingress:
     - hostname: stream.yourdomain.com
       service: http://localhost:8080
     - service: http_status:404
   ```

4. **Start the tunnel:**

   ```bash
   cloudflared tunnel run fitness-stream
   ```

Your API is now reachable at `https://stream.yourdomain.com`. Point the iPhone app to `https://stream.yourdomain.com/` and the client website to `https://stream.yourdomain.com/events`.

#### Port forwarding

Forward port 8080 on your router to your OBS machine's local IP. The iPhone app then uses your public IP (e.g. `http://<public-ip>:8080/`). Free, but requires router access and a static or known public IP.

#### Tailscale

Tailscale creates a private WireGuard mesh between your devices. Free for personal use. Install on both devices, sign in with the same account, and use the Tailscale IP (e.g. `http://100.x.y.z:8080/`). No router config needed, but both devices must have Tailscale installed.

#### ngrok

ngrok gives you a public HTTPS URL that tunnels to a local port. Free-tier URLs change on restart, so it's better for testing than production.

```bash
brew install ngrok
ngrok config add-authtoken <your-token>
ngrok http 8080
```

---

## 2. Client Website

The client website is a React app that subscribes to the API's SSE stream and renders draggable, configurable widgets (heart rate, pace, distance, GPS minimap, and more). OBS loads it as a Browser Source.

The client website can run locally on the OBS machine or be deployed to any static hosting provider (Vercel, Netlify, GitHub Pages, etc.).

### Running locally

```bash
cd overlays
npm install
npm run dev
```

Vite starts at **http://localhost:5173/**. Open it in a browser to see the dashboard with a control bar for toggling widgets, adjusting the API URL, and setting a stream delay.

Point it at your API's SSE endpoint via the control bar or a query parameter:

```
http://localhost:5173/?server=https://your-api-url.com/events
```

### Building for production

```bash
cd overlays
npm run build
npm run preview
```

Builds to `overlays/dist/` and serves at **http://localhost:4173/**. The built files can also be deployed to any static host if you prefer not to run the client locally.

---

## 3. OBS Setup

### Overlay as Browser Source

1. Open OBS and go to the scene you want to add overlays to.
2. In the **Sources** panel, click **+** and select **Browser**.
3. Name it (e.g. "Fitness Overlay") and click OK.
4. Set the **URL** to your client website address, including the API endpoint:

   ```
   http://localhost:5173/?server=https://your-api-url.com/events
   ```

5. Set the **Width** and **Height** to match your canvas (e.g. 1920 x 1080).
6. Check **Shutdown source when not visible** and **Refresh browser when scene becomes active**.
7. Click OK.

The overlay renders with a transparent background, so only the widgets appear on top of your scene.

**Single widget mode.** Show just one metric using the `overlay` query param:

```
http://localhost:5173/?overlay=heartrate&transparent=true&server=https://your-api-url.com/events
```

Create a separate Browser Source per widget and position them freely in OBS.

**Stream delay.** If your camera feed has latency, set a matching delay (in ms) in the overlay control bar so the metrics stay in sync with the video.

**Custom CSS in OBS.** You can add custom CSS in the Browser Source settings to further style the overlay (e.g. `body { background: transparent !important; }`).

### Camera Feed via RTSP

1. In OBS, click **+** in the Sources panel and select **Media Source**.
2. **Uncheck** "Local File."
3. In the **Input** field, enter the Moblin RTSP URL:

   ```
   rtsp://<moblin-iphone-ip>:7447
   ```

4. Set **Input Format** to `rtsp`.
5. Check **Restart playback when source becomes active**.
6. Set **Network Buffering** to `1 MB` (or lower) to minimize latency.
7. Click OK.

Arrange the camera feed behind the overlay Browser Source so the metrics appear on top of the video.

---

## 4. Video Source and Moblin

The video source is the camera that films your workout — an iPhone or a GoPro. Moblin runs on a separate iPhone, receives the video feed, and streams it to OBS via RTSP.

### Moblin setup (iPhone)

1. Install **Moblin** from the App Store.
2. Open Moblin and tap the **gear icon** to open settings.
3. Under **Stream**, select **RTSP Server** as the protocol.
4. Set a port (default is `7447`) and note the iPhone's local IP.
5. Connect the video source (iPhone camera or GoPro) as an RTSP input.
6. Tap **Go Live** to start the RTSP server.

The Moblin iPhone is now broadcasting at:

```
rtsp://<moblin-iphone-ip>:7447
```

### Reducing latency

- Use 5 GHz Wi-Fi when the Moblin iPhone and OBS machine are on the same network.
- In Moblin, lower the resolution (1080p is plenty) and increase the keyframe interval.
- In OBS, keep the network buffer as low as possible without introducing stutter.
- Match the overlay delay to the RTSP latency for synchronized output.

---

## 5. iPhone App (FitnessStream)

The FitnessStream iOS app collects live workout data (heart rate, HR zone, active energy, distance, pace, steps, GPS, elevation) and POSTs it as JSON to the API every second.

1. Download from the [App Store](https://apps.apple.com/us/app/fitness-stream/id6759740524), or build from source (see below).
2. Enter your API endpoint (e.g. `https://fitness-stream.up.railway.app/` or your tunnel URL).
3. Select a workout type and start the session.

### Building from source

Requires Xcode 26+ with iOS 26.0+ deployment target, an Apple Developer account (free or paid), and a physical iPhone (HealthKit is not available in the simulator).

```bash
git clone https://github.com/wildemat/iosFitnessStream.git
cd iosFitnessStream
open FitnessStream.xcodeproj
```

1. Select your Apple Developer team under **Signing & Capabilities**.
2. Connect your iPhone and select it as the build destination.
3. Press **Cmd+R** to build and run.

See [PUBLISH.md](PUBLISH.md) for TestFlight and Ad Hoc distribution instructions.

---

## Quick-Start Checklist

### With a cloud-hosted API

1. Deploy the API to your hosting provider
2. Run the client website locally: `cd overlays && npm install && npm run dev`
3. In OBS, add a **Browser Source** pointing to `http://localhost:5173/?server=https://your-api-url.com/events`
4. In OBS, add a **Media Source** pointing to `rtsp://<moblin-iphone-ip>:7447`
5. Start Moblin on iPhone and tap Go Live
6. Start a workout in FitnessStream, pointed at your API URL
7. Verify metrics appear in the overlay and the camera feed is visible in OBS

### With a self-hosted API (free)

```bash
# Terminal 1 — API server
cd local
node server.js

# Terminal 2 — Client website
cd overlays
npm install   # first time only
npm run dev

# Terminal 3 — Tunnel (pick one)
cloudflared tunnel run fitness-stream
# or: ngrok http 8080
```

Then follow steps 3–7 above, using your tunnel URL as the API endpoint.

---

## Development

For local development and testing, the repo includes a standalone API server and a mock workout emitter so you can work on the client website and OBS layout without needing an iPhone, an external API, or a live workout.

### Local API server

The `local/` directory contains a zero-dependency Node.js server that behaves identically to the production API. It accepts `POST /` and re-broadcasts via `GET /events` (SSE).

```bash
cd local
node server.js
```

```
FitnessStream receiver listening on port 8080
Set the app endpoint to:  http://192.168.1.42:8080/
SSE overlay endpoint:     http://localhost:8080/events
Waiting for workout data...
```

To change the port:

```bash
PORT=3000 node server.js
```

### Mock workout emitter

A mock emitter simulates a full workout session, sending realistic metrics to the local API every second.

```bash
cd local

# In one terminal
node server.js

# In another terminal
node emitter.js
```

Or run both at once:

```bash
npm start
```

### Client website (local)

```bash
cd overlays
npm install
npm run dev
```

The client website starts at **http://localhost:5173/** and connects to `http://localhost:8080/events` by default — no query parameter needed when using the local API server.

### OBS with local sources

Once the local API server and client website are running, you can set up OBS entirely on your local network:

1. Add a **Browser Source** pointing to `http://localhost:5173/`
2. Add a **Media Source** with an RTSP URL from a local Moblin instance (`rtsp://<local-iphone-ip>:7447`)

This lets you test widget layout, stream delay, and OBS scene composition before going to a production setup.

---

## Project Structure

```
iosFitnessStream/
├── FitnessStream/                  # iOS app (Swift, Xcode project)
│   ├── WorkoutSessionManager.swift # HKWorkoutSession, HealthKit queries
│   ├── StreamClient.swift          # POST JSON metrics to endpoint
│   ├── LocationManager.swift       # CoreLocation for GPS + elevation
│   ├── WorkoutMetrics.swift        # Codable struct for all metric fields
│   └── ...
├── local/                          # Self-hosted API server
│   ├── server.js                   # HTTP server: POST receiver + SSE broadcaster
│   ├── emitter.js                  # Mock workout emitter for testing
│   └── package.json
├── overlays/                       # Client website (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/             # Widget components (HeartRate, Pace, Minimap, etc.)
│   │   ├── hooks/useMetricsStream.ts  # SSE client with buffered delay support
│   │   ├── store/useLayoutStore.ts    # Zustand store for widget layout state
│   │   └── types/metrics.ts        # WorkoutMetrics type definition
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## License

Private — not licensed for redistribution.
