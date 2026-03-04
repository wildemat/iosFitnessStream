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
