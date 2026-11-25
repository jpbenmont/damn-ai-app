import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { voiceService } from './voiceService';

const REMINDERS_STORAGE_KEY = '@damn_smart_reminders_v1';

export interface SmartReminder {
  id: string;
  title: string;
  createdAt: number;
  scheduledAt: number;
  durationSeconds: number;
  stage5MinNotificationId?: string;
  stage1MinNotificationId?: string;
  stage5MinSent: boolean;
  stage1MinSent: boolean;
  stage1MinAcknowledged: boolean;
  onTimeSent: boolean;
  voiceAlertTriggered: boolean;
  completed: boolean;
}

class ReminderService {
  private reminders: SmartReminder[] = [];
  private checkInterval: any = null;
  private notificationListener: any = null;
  private responseListener: any = null;
  private listeners: Set<(reminders: SmartReminder[]) => void> = new Set();

  constructor() {
    this.init();
  }

  public async init() {
    await this.loadReminders();
    this.setupNotificationListeners();
    this.startWatchLoop();
  }

  public subscribe(listener: (reminders: SmartReminder[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getActiveReminders());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const active = this.getActiveReminders();
    this.listeners.forEach((l) => l(active));
  }

  private async loadReminders(): Promise<SmartReminder[]> {
    try {
      const data = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
      if (data) {
        this.reminders = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load reminders:', e);
    }
    this.notify();
    return this.reminders;
  }

  private async saveReminders() {
    try {
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(this.reminders));
    } catch (e) {
      console.warn('Failed to save reminders:', e);
    }
    this.notify();
  }

  public getReminders(): SmartReminder[] {
    return [...this.reminders];
  }

  public getActiveReminders(): SmartReminder[] {
    return this.reminders.filter((r) => !r.completed);
  }

  /**
   * Set up interactive notification action categories & reaction tracking
   */
  private setupNotificationListeners() {
    if (Platform.OS === 'web') return;

    // Define 1-minute warning interactive notification category
    Notifications.setNotificationCategoryAsync('reminder_warning', [
      {
        identifier: 'ACKNOWLEDGE_REMINDER',
        buttonTitle: "✅ I'M READY / GOT IT",
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'DISMISS_REMINDER',
        buttonTitle: 'Dismiss',
        options: {
          opensAppToForeground: false,
        },
      },
    ]).catch(() => {});

    // Listen to user interactions (clicks, button taps) on push notifications
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }

    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const reminderId = data?.reminderId;
      const stage = data?.stage;

      if (reminderId) {
        if (stage === '1_min' || response.actionIdentifier === 'ACKNOWLEDGE_REMINDER') {
          this.acknowledgeReminder(reminderId);
        }
      }
    });
  }

  /**
   * User reacted to the 1-minute warning notification
   */
  public async acknowledgeReminder(reminderId: string) {
    const reminder = this.reminders.find((r) => r.id === reminderId);
    if (reminder) {
      reminder.stage1MinAcknowledged = true;
      await this.saveReminders();

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // Provide instant audio feedback
      voiceService.speak("1-minute warning acknowledged, bro! I will alert you at the exact moment.", {
        personality: 'hype',
      });
    }
  }

  /**
   * Schedule a new smart multi-stage escalating reminder
   * - 5 minutes before notification
   * - 1 minute before notification (with reaction tracking)
   * - On-time notification (or voice wake-up escalation if user didn't react)
   */
  public async scheduleSmartReminder(
    title: string,
    durationSeconds: number
  ): Promise<{ reminder: SmartReminder; message: string }> {
    const now = Date.now();
    const scheduledAt = now + durationSeconds * 1000;
    const reminderId = `rem_${now}_${Math.random().toString(36).substring(2, 7)}`;

    const reminder: SmartReminder = {
      id: reminderId,
      title: title.trim(),
      createdAt: now,
      scheduledAt,
      durationSeconds,
      stage5MinSent: false,
      stage1MinSent: false,
      stage1MinAcknowledged: false,
      onTimeSent: false,
      voiceAlertTriggered: false,
      completed: false,
    };

    // Calculate stage offsets
    // Stage 1: 5 minutes before (300 seconds)
    // Stage 2: 1 minute before (60 seconds)
    const stage5MinSeconds = durationSeconds > 360 ? durationSeconds - 300 : Math.round(durationSeconds * 0.5);
    const stage1MinSeconds = durationSeconds > 90 ? durationSeconds - 60 : Math.round(durationSeconds * 0.85);

    // Schedule native background notifications if on mobile
    if (Platform.OS !== 'web') {
      try {
        // 1. Stage: 5 Min Warning
        if (durationSeconds >= 120) {
          const id5Min = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'DAMN',
              body: `Your reminder for "${reminder.title}" is in 5 minutes!`,
              data: { reminderId, stage: '5_min' },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.HIGH,
              color: '#141416',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: Math.max(1, stage5MinSeconds),
            },
          });
          reminder.stage5MinNotificationId = id5Min;
        }

        // 2. Stage: 1 Min Warning (Interactive reaction required!)
        if (durationSeconds >= 30) {
          const id1Min = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'DAMN',
              body: `Tap to acknowledge "${reminder.title}"! Otherwise DAMN will wake up and alert you.`,
              data: { reminderId, stage: '1_min' },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
              categoryIdentifier: 'reminder_warning',
              color: '#FF4757',
              vibrate: [0, 250, 250, 250],
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: Math.max(1, stage1MinSeconds),
            },
          });
          reminder.stage1MinNotificationId = id1Min;
        }
      } catch (err) {
        console.warn('Error scheduling stage notifications:', err);
      }
    }

    this.reminders.push(reminder);
    await this.saveReminders();

    const hours = Math.floor(durationSeconds / 3600);
    const mins = Math.floor((durationSeconds % 3600) / 60);
    const secs = durationSeconds % 60;
    let timeLabel = '';
    if (hours > 0) timeLabel += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (mins > 0) timeLabel += `${mins} minute${mins > 1 ? 's' : ''} `;
    if (secs > 0 && hours === 0 && mins === 0) timeLabel += `${secs} second${secs > 1 ? 's' : ''} `;
    timeLabel = timeLabel.trim();

    const spoken = `Locked in! Reminding you to "${reminder.title}" in ${timeLabel}. I'll send a 5-minute heads-up, a 1-minute warning to react, and wake you up with full voice if you don't answer!`;

    return { reminder, message: spoken };
  }

  /**
   * Watch loop that evaluates reminders continuously
   */
  private startWatchLoop() {
    if (this.checkInterval) clearInterval(this.checkInterval);

    this.checkInterval = setInterval(() => {
      this.evaluateReminders();
    }, 2000);
  }

  /**
   * Evaluate all active reminders and trigger on-time notifications or voice wake-up escalation
   */
  public async evaluateReminders() {
    const now = Date.now();
    let hasChanges = false;

    for (const reminder of this.reminders) {
      if (reminder.completed) continue;

      const timeLeftMs = reminder.scheduledAt - now;

      // Check 5-min warning
      if (timeLeftMs <= 300000 && !reminder.stage5MinSent) {
        reminder.stage5MinSent = true;
        hasChanges = true;
      }

      // Check 1-min warning
      if (timeLeftMs <= 60000 && !reminder.stage1MinSent) {
        reminder.stage1MinSent = true;
        hasChanges = true;
      }

      // Check exact on-time trigger
      if (timeLeftMs <= 0 && !reminder.onTimeSent) {
        reminder.onTimeSent = true;
        reminder.completed = true;
        hasChanges = true;

        if (reminder.stage1MinAcknowledged) {
          // User acknowledged the 1-min warning! Send on-time notification
          if (Platform.OS !== 'web') {
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'DAMN',
                body: `You acknowledged the warning! Time for "${reminder.title}".`,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.MAX,
                color: '#20C997',
              },
              trigger: null,
            }).catch(() => {});
          }

          voiceService.speak(
            `Time's up! You acknowledged the warning. Time for: ${reminder.title}!`,
            { personality: 'hype' }
          );
        } else {
          // User DID NOT react to the 1-min warning notification!
          // VOICE WAKES UP AND SPEAKS WHAT USER SAID TO REMEMBER!
          reminder.voiceAlertTriggered = true;

          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } catch {}

          if (Platform.OS !== 'web') {
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'DAMN',
                body: `You told me to remember: "${reminder.title}". Voice waking up now!`,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.MAX,
                color: '#DC2626',
                vibrate: [0, 500, 200, 500, 200, 500],
              },
              trigger: null,
            }).catch(() => {});
          }

          const wakeUpSpeech = `Yo bro, wake up! You asked me to remind you: ${reminder.title}! You didn't react to the one-minute warning, so I'm calling you out right now. Stop sleeping and handle this!`;

          voiceService.speak(wakeUpSpeech, {
            personality: 'savage',
            rate: 1.1,
            pitch: 1.05,
          });
        }
      }
    }

    if (hasChanges) {
      await this.saveReminders();
    }
  }

  public async deleteReminder(id: string) {
    this.reminders = this.reminders.filter((r) => r.id !== id);
    await this.saveReminders();
  }

  public async cancelReminder(id: string) {
    return this.deleteReminder(id);
  }

  public async reactToWarning(id: string) {
    return this.acknowledgeReminder(id);
  }

  public async clearCompleted() {
    this.reminders = this.reminders.filter((r) => !r.completed);
    await this.saveReminders();
  }
}

export const reminderService = new ReminderService();

