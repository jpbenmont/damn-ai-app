import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { voiceService } from './voiceService';

export interface FamilyReminder {
  id: string;
  title: string;
  createdBy: string;
  targetRelation?: string; // 'All' | 'Mom' | 'Dad' | 'Bro' | etc.
  scheduledAt: number;
  stage5MinSent?: boolean;
  stage1MinSent?: boolean;
  stage1MinAcknowledged?: boolean;
  completed: boolean;
  createdAt: number;
}

export interface FamilyShoppingItem {
  id: string;
  name: string;
  addedBy: string;
  purchased: boolean;
  createdAt: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string; // 'Self' | 'Mom' | 'Dad' | 'Brother' | 'Sister' | 'Spouse' | 'Member'
  isOnline: boolean;
}

export interface FamilyState {
  famCode: string;
  familyName: string;
  members: FamilyMember[];
  reminders: FamilyReminder[];
  shoppingItems: FamilyShoppingItem[];
}

const STORAGE_KEY = '@damn_family_state_v1';

class FamilyService {
  private state: FamilyState = {
    famCode: 'FAM-8K2P91',
    familyName: 'Our Family',
    members: [
      { id: 'mem_1', name: 'Jp (You)', relation: 'Self', isOnline: true },
      { id: 'mem_2', name: 'Mom', relation: 'Mom', isOnline: true },
      { id: 'mem_3', name: 'Dad', relation: 'Dad', isOnline: false },
      { id: 'mem_4', name: 'Alex', relation: 'Brother', isOnline: true },
    ],
    reminders: [
      {
        id: 'fam_rem_1',
        title: 'Electricity bill due tonight by 8 PM',
        createdBy: 'Mom',
        targetRelation: 'All',
        scheduledAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hrs from now
        completed: false,
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'fam_rem_2',
        title: 'Dinner at Grandma’s this Sunday 7 PM',
        createdBy: 'Dad',
        targetRelation: 'All',
        scheduledAt: Date.now() + 24 * 60 * 60 * 1000, // tomorrow
        completed: false,
        createdAt: Date.now() - 7200000,
      },
    ],
    shoppingItems: [
      { id: 'fshop_1', name: 'Milk (2 cartons)', addedBy: 'Mom', purchased: false, createdAt: Date.now() - 1800000 },
      { id: 'fshop_2', name: 'Whole wheat bread & eggs', addedBy: 'Dad', purchased: false, createdAt: Date.now() - 1200000 },
      { id: 'fshop_3', name: 'Dishwasher detergent pods', addedBy: 'Jp', purchased: false, createdAt: Date.now() - 600000 },
    ],
  };

  private listeners: Array<(state: FamilyState) => void> = [];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadState();
    this.startEscalationLoop();
  }

  private async loadState() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.state = {
          ...this.state,
          ...parsed,
          members: parsed.members && parsed.members.length > 0 ? parsed.members : this.state.members,
          reminders: parsed.reminders || this.state.reminders,
          shoppingItems: parsed.shoppingItems || this.state.shoppingItems,
        };
        this.notify();
      }
    } catch (e) {
      console.warn('FamilyService: Failed to load state', e);
    }
  }

  private async saveState() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('FamilyService: Failed to save state', e);
    }
  }

  public subscribe(listener: (state: FamilyState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  public getState(): FamilyState {
    return this.state;
  }

  public getFamCode(): string {
    return this.state.famCode;
  }

  public setFamCode(newCode: string, newFamilyName?: string) {
    const formatted = newCode.trim().toUpperCase();
    this.state.famCode = formatted;
    if (newFamilyName) {
      this.state.familyName = newFamilyName;
    }
    this.saveState();
    this.notify();
  }

  public joinFamilyByCode(code: string): { success: boolean; message: string } {
    const formatted = code.trim().toUpperCase();
    if (!formatted.startsWith('FAM-')) {
      return { success: false, message: 'Invalid FAM Code. It should start with FAM- (e.g. FAM-8K2P91).' };
    }
    this.state.famCode = formatted;
    this.state.familyName = 'Connected Family';
    this.saveState();
    this.notify();
    return { success: true, message: `Connected to family with code ${formatted}!` };
  }

  public addFamilyMember(name: string, relation: string = 'Member') {
    const newMember: FamilyMember = {
      id: `mem_${Date.now()}`,
      name: name.trim(),
      relation: relation.trim(),
      isOnline: true,
    };
    this.state.members.push(newMember);
    this.saveState();
    this.notify();
    return newMember;
  }

  /**
   * Add a shared family reminder
   */
  public addFamilyReminder(
    title: string,
    delayMinutes: number,
    createdBy: string = 'You',
    targetRelation: string = 'All'
  ): FamilyReminder {
    const reminder: FamilyReminder = {
      id: `fam_rem_${Date.now()}`,
      title: title.trim(),
      createdBy,
      targetRelation,
      scheduledAt: Date.now() + delayMinutes * 60 * 1000,
      completed: false,
      createdAt: Date.now(),
    };

    this.state.reminders = [reminder, ...this.state.reminders];
    this.saveState();
    this.notify();

    // Schedule native notification confirmation
    try {
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'DAMN',
          body: `👨‍👩‍👧 "${title}" broadcast to family for ${new Date(reminder.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          sound: 'default',
        },
        trigger: null,
      });
    } catch {}

    return reminder;
  }

  public completeFamilyReminder(id: string) {
    this.state.reminders = this.state.reminders.map((r) =>
      r.id === id ? { ...r, completed: true } : r
    );
    this.saveState();
    this.notify();
  }

  public acknowledgeFamilyReminder(id: string) {
    this.state.reminders = this.state.reminders.map((r) =>
      r.id === id ? { ...r, stage1MinAcknowledged: true } : r
    );
    this.saveState();
    this.notify();
  }

  public deleteFamilyReminder(id: string) {
    this.state.reminders = this.state.reminders.filter((r) => r.id !== id);
    this.saveState();
    this.notify();
  }

  /**
   * Add items to the shared family shopping list
   */
  public addFamilyShoppingItems(itemsText: string, addedBy: string = 'You'): FamilyShoppingItem[] {
    const rawItems = itemsText.split(/,|and|\n/).map((s) => s.trim()).filter((s) => s.length > 0);
    const newItems: FamilyShoppingItem[] = rawItems.map((name) => ({
      id: `fshop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      addedBy,
      purchased: false,
      createdAt: Date.now(),
    }));

    this.state.shoppingItems = [...newItems, ...this.state.shoppingItems];
    this.saveState();
    this.notify();

    try {
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'DAMN',
          body: `🛒 Added ${newItems.map((i) => i.name).join(', ')} to family shopping radar.`,
          sound: 'default',
        },
        trigger: null,
      });
    } catch {}

    return newItems;
  }

  public toggleFamilyShoppingItem(id: string) {
    this.state.shoppingItems = this.state.shoppingItems.map((item) =>
      item.id === id ? { ...item, purchased: !item.purchased } : item
    );
    this.saveState();
    this.notify();
  }

  public deleteFamilyShoppingItem(id: string) {
    this.state.shoppingItems = this.state.shoppingItems.filter((i) => i.id !== id);
    this.saveState();
    this.notify();
  }

  public clearPurchasedShoppingItems() {
    this.state.shoppingItems = this.state.shoppingItems.filter((i) => !i.purchased);
    this.saveState();
    this.notify();
  }

  /**
   * Trigger family departure alert when leaving home (100m - 300m departure radar)
   */
  public triggerFamilyDepartureAlert(memberName: string = 'You') {
    const unbought = this.state.shoppingItems.filter((i) => !i.purchased);
    if (unbought.length === 0) return;

    const itemsSummary = unbought.slice(0, 3).map((i) => i.name).join(', ');
    const countText = unbought.length > 3 ? ` +${unbought.length - 3} more` : '';

    try {
      const isSelf = memberName === 'You' || memberName.toLowerCase() === 'you';
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'DAMN',
          body: isSelf
            ? `🛒 You just left home! Don't forget family items: ${itemsSummary}${countText}.`
            : `🛒 ${memberName} just left home! Family shopping list sent: ${itemsSummary}${countText}.`,
          sound: 'default',
        },
        trigger: null,
      });
    } catch {}

    voiceService.speak(
      `Heads up! ${memberName === 'You' ? 'You' : memberName} just left home. Don't forget the family items: ${itemsSummary}!`,
      { personality: 'hype' }
    );
  }

  /**
   * Check escalating family reminders
   */
  private startEscalationLoop() {
    if (this.checkInterval) clearInterval(this.checkInterval);

    this.checkInterval = setInterval(() => {
      const now = Date.now();
      let hasChanges = false;

      this.state.reminders.forEach((rem) => {
        if (rem.completed) return;

        const msRemaining = rem.scheduledAt - now;

        // Stage 1: 5-minute warning
        if (msRemaining <= 5 * 60 * 1000 && msRemaining > 1 * 60 * 1000 && !rem.stage5MinSent) {
          rem.stage5MinSent = true;
          hasChanges = true;
          try {
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'DAMN',
                body: `⏰ Family reminder: "${rem.title}" is due in 5 minutes!`,
                sound: 'default',
              },
              trigger: null,
            });
          } catch {}
        }

        // Stage 2: 1-minute warning
        if (msRemaining <= 60 * 1000 && msRemaining > 0 && !rem.stage1MinSent) {
          rem.stage1MinSent = true;
          hasChanges = true;
          try {
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'DAMN',
                body: `⚡ 1m alert! "${rem.title}" due in 1 minute. Tap to confirm you're on it.`,
                sound: 'default',
              },
              trigger: null,
            });
          } catch {}
        }

        // Stage 3: On-time escalation
        if (msRemaining <= 0) {
          rem.completed = true;
          hasChanges = true;

          if (!rem.stage1MinAcknowledged) {
            voiceService.speak(
              `Yo! Family Reminder for everyone: ${rem.title}! Get it done right now!`,
              { personality: 'savage' }
            );
          } else {
            try {
              Notifications.scheduleNotificationAsync({
                content: {
                  title: 'DAMN',
                  body: `✅ Family reminder: "${rem.title}" is due now!`,
                  sound: 'default',
                },
                trigger: null,
              });
            } catch {}
          }
        }
      });

      if (hasChanges) {
        this.saveState();
        this.notify();
      }
    }, 3000);
  }
}

export const familyService = new FamilyService();

