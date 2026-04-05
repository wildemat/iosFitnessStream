- Pausing workout in the app sends a pause event to the server to keep UI updated
- Require API key for GET on the fitness events
- Save layout state of the overlays into loadable configs
- auto bump version

3-2

- the overlays resizing just expands the bounds and content doesn't change. how to increase size of contents while keeping it dynamic updates...
- the dashboard view should be a blank slate, and selecting items from control bar will add it to the slate. Then a dropdown on each widget in the control bar to toggle transparent, color theme, etc. for each widget
  - minimap and dashboard have extra options. zoom and reset layout. Should be a single options state for each widget and dashboard should just have a static reset layout button that takes the current collection of widgets and places them

3-4

### Overlay changes:

- remove url param loading and related code. leave only dashboard view. local state to track which widgets are enabled. toggling them appends them to the UI with spacing determined by the number of currently enabled widgets
- scaled rendering. Expanding / collapsing the widgets scales their contents respectively, move to SVG rendering?
- only global option should be "reset layout". Each widget should be attached to its own state of options including:
  - theme
  - background transparency
  - opacity
  - dimensions
    - each widget rendered with a base dimension of 100%, whatever pixels are required to render the full contents as they are presently built.
  - map widget will have extra "zoom" layout.
- combined widget state is saved into a global shared state that a user can export and download as json and import to load the state.

3-7

### Custom segments

#### Workout history & export

- Workout history screen listing past workouts saved by the app (HKSampleQuery on HKWorkoutType, filtered to app source)
- Workout detail screen showing summary, segment activities, events, and metadata
- Export button on detail screen that queries HealthKit for the full workout including HKWorkoutActivity segments, HKWorkoutEvents, and all custom metadata
- Metrics query function to fetch associated samples (HR, energy, distance, etc.) for the workout time range
- Metrics transformer to assemble the queried data into a structured export model (workout → activities → metadata + time-series samples)
- Data exporter handler to serialize the model to JSON and present via UIActivityViewController (AirDrop, Files, share sheet)

#### Streaming protocol

- Include current segment metadata in the streaming payload (current_exercise, segment_index, exercise_reps, exercise_load_lb as optional fields on WorkoutMetrics)
- Update TypeScript WorkoutMetrics interface and Node server pretty-print to match

#### Custom workout builder

- Workout creation screen where the user builds a workout by adding ordered segments, each with a title, rep count, and weight amount
- Persist custom workout templates (local storage or Core Data) so they can be reused
- When running a custom workout, the phone LiveMetricsViewController shows: current workout name, active segment (title, reps, weight), segment progress (e.g. 3/8), plus the standard metrics (HR, energy, distance, etc.)
- Watch ContentView mirrors the same segment-aware display: current segment title, reps, weight, segment progress, and standard metrics
- Watch double-tap haptic gesture (WKGestureRecognizer or Digital Crown) to advance from the current segment to the next; triggers segment finalization (HKWorkoutActivity + HKWorkoutEvent written to the builder) and starts the next segment
- Phone UI also has a "Next Segment" button as a fallback for advancing without the watch
- Segment durations (actual elapsed time per segment) recorded in each HKWorkoutActivity's metadata alongside exercise_name, reps_count, and load_lb
- Final segment auto-completes when the user ends the workout

4-5

- need snapshot tests to use for ai dev validation
