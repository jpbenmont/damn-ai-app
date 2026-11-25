import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notification behavior for foreground & background
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const initNotifications = async () => {
  if (Platform.OS === 'web') return;

  try {
    // Set up Android notification channel with high importance & app color theme
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('damn_discipline', {
        name: 'DAMN Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#141416',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    console.log('Push notifications initialized successfully');
  } catch (error) {
    console.warn('Error initializing push notifications:', error);
  }
};

/**
 * Trigger an immediate native push notification to Android status bar / shade
 */
export const sendPushNotification = async (
  title: string,
  body: string,
  data: Record<string, any> = {}
) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#141416',
        vibrate: [0, 250, 250, 250],
      },
      trigger: null, // send immediately
    });
  } catch (error) {
    console.warn('Error sending push notification:', error);
  }
};

/**
 * Schedule daily smart push reminders with funny, tough-love, attention-grabbing copy
 */
export const scheduleDailyReminders = async (name: string = 'Warrior') => {
  if (Platform.OS === 'web') return;

  try {
    // Cancel previous scheduled reminders to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. Morning Assistant Briefing (8:00 AM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'DAMN',
        body: `${name}, DAMN is ready! Check your daily reminders and family errands ⚡`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#141416',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    });

    // 2. Midday Focus & Reminders (1:30 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'DAMN',
        body: `${name}, reviewing your afternoon schedule. Check your pending reminders and stay on track!`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#141416',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 13,
        minute: 30,
      },
    });

    // 3. Evening Family & Errands Radar (6:30 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'DAMN',
        body: `${name}, check the family shopping radar or add items before wrapping up your day!`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#141416',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 18,
        minute: 30,
      },
    });

    // 4. Night Schedule Wrap-up (9:30 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'DAMN',
        body: `${name}, review tomorrow's reminders so you can wake up completely prepared.`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#141416',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 30,
      },
    });
  } catch (error) {
    console.warn('Error scheduling daily push reminders:', error);
  }
};
