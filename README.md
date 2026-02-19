a lightweight ios app to collect live fitness data through the ios api during a workout.
The app can continue in the background while the workout is live.
During the workout, a data stream is opened to a configurable endpoint where the key metrics get sent over the wire, like heartrate, pace, etc.
The interface for the app shows a field to input the endpoint, and also a list of the workouts from the built-in fitness app.
When a workout is selected, the user can "start" the workout. Then the live metrics are displayed on the screen including:

- heart rate
- heart rate zone
- active energy burn
- distance covered
- pace
- steps
- location
- elevation
- elapsed time in the workout

From this screen the user can "pause" and "end" the workout.

If the app is closed while a workout is running, then the workout continues and data is still transmitted. The iphone lockscreen shows a notification badge with the name of the workout and the realtime elapsed time of the workout.

The ux is very minimal, grayscale.

The app should be in sync with the apple watch and data should be collected from the watch if present.
