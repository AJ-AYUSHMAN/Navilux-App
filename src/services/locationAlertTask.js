import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';

export const LOCATION_ALARM_TASK = 'LOCATION_ALARM_TASK';

let globalSound = null;

export const playAlarmAudio = async () => {
  try {
    if (globalSound) {
      await globalSound.stopAsync();
      await globalSound.unloadAsync();
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
      { shouldPlay: true, isLooping: true }
    );
    globalSound = sound;
  } catch (e) {
    console.log("Audio play error", e);
  }
};

export const stopAlarmAudio = async () => {
  try {
    if (globalSound) {
      await globalSound.stopAsync();
      await globalSound.unloadAsync();
      globalSound = null;
    }
  } catch (e) {
    console.log("Audio stop error", e);
  }
};

function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c * 1000; // Distance in meters
  return d;
}

function deg2rad(deg) { return deg * (Math.PI / 180); }

// Setup Notification Categories
Notifications.setNotificationCategoryAsync('ALARM_ACTIONS', [
  { identifier: 'SNOOZE_5', buttonTitle: 'Snooze 5m' },
  { identifier: 'SNOOZE_15', buttonTitle: 'Snooze 15m' },
  { identifier: 'DISMISS', buttonTitle: 'Stop Alarm', options: { isDestructive: true } },
]).catch(e => console.log('Error setting notification categories', e));

TaskManager.defineTask(LOCATION_ALARM_TASK, async ({ data, error }) => {
  if (error) {
    console.log("Location Alarm Task Error:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    const loc = locations[0];
    if (!loc) return;

    try {
      const alarmsStr = await AsyncStorage.getItem('@dest_alarms');
      if (alarmsStr) {
        let alarms = JSON.parse(alarmsStr);
        let updated = false;
        let anyActive = false;

        alarms.forEach(alarm => {
          if (alarm.isActive) {
            anyActive = true;
            const dist = getDistanceFromLatLonInM(
              loc.coords.latitude, 
              loc.coords.longitude, 
              alarm.latitude, 
              alarm.longitude
            );

            // trigger alarm if within radius
            if (dist <= alarm.radius) {
              Notifications.scheduleNotificationAsync({
                content: {
                  title: "📍 WAKE UP! Destination Reached! 🚨",
                  body: `You are within ${alarm.radius}m of ${alarm.name}. Tap to stop the alarm.`,
                  sound: true,
                  categoryIdentifier: 'ALARM_ACTIONS',
                  data: { alarmId: alarm.id, screen: 'DestinationAlert', isRinging: true },
                  vibrate: [0, 1000, 1000, 1000, 1000, 1000],
                },
                trigger: null,
              });
              
              playAlarmAudio(); // Start playing the loud alarm loop

              alarm.isActive = false; // Auto-stop tracking
              alarm.isCompleted = true;
              alarm.isRinging = true; // Mark as currently ringing so UI can show the stop button
              updated = true;
            }
          }
        });

        if (updated) {
          await AsyncStorage.setItem('@dest_alarms', JSON.stringify(alarms));
        }

        // If no active alarms left, we can gracefully stop updates
        if (!anyActive && !updated) {
           stopLocationAlarmTask();
        }
      }
    } catch (e) {
      console.log("Error processing background location:", e);
    }
  }
});

export const startLocationAlarmTask = async () => {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_ALARM_TASK);
    if (!hasStarted) {
      await Location.startLocationUpdatesAsync(LOCATION_ALARM_TASK, {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 100, // Update every 100 meters
        deferredUpdatesInterval: 30000, // Update max every 30 seconds
        foregroundService: {
          notificationTitle: "Destination Alert Active",
          notificationBody: "Monitoring your location for alarms.",
          notificationColor: "#7EC7FF",
        }
      });
      console.log("Started location alarm task");
    }
  } catch(e) {
    console.log("Error starting location alarm task:", e);
  }
};

export const stopLocationAlarmTask = async () => {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_ALARM_TASK);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_ALARM_TASK);
      console.log("Stopped location alarm task");
    }
  } catch(e) {
    console.log("Error stopping location alarm task:", e);
  }
};
