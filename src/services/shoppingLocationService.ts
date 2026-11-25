import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { voiceService } from './voiceService';

let Location: any = null;
try {
  Location = require('expo-location');
} catch (err) {
  console.warn('ExpoLocation module not linked in current APK:', err);
}

const SHOPPING_STORAGE_KEY = '@damn_shopping_items_v1';
const DEPARTURE_ZONE_KEY = '@damn_departure_zone_v1';

export interface ShoppingItem {
  id: string;
  name: string;
  addedAt: number;
  purchased: boolean;
}

export interface DepartureZone {
  baseLat: number;
  baseLng: number;
  baseName?: string;
  departureThresholdMeters: number; // 100m - 300m departure window
  maxRangeMeters: number;
  departureAlertSent: boolean;
  activatedAt: number;
  lastCheckedDistance?: number;
  dwellMinutes?: number;
}

// Calculate Haversine distance in meters between two GPS coordinates
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

class ShoppingLocationService {
  private items: ShoppingItem[] = [];
  private departureZone: DepartureZone | null = null;
  private locationWatcher: any = null;
  private listeners: Set<(items: ShoppingItem[], zone: DepartureZone | null) => void> = new Set();

  constructor() {
    this.init();
  }

  public async init() {
    await this.loadState();
    if (this.departureZone && !this.departureZone.departureAlertSent) {
      this.startLocationWatch();
    }
  }

  private async loadState() {
    try {
      const itemsData = await AsyncStorage.getItem(SHOPPING_STORAGE_KEY);
      if (itemsData) {
        this.items = JSON.parse(itemsData);
      }
      const zoneData = await AsyncStorage.getItem(DEPARTURE_ZONE_KEY);
      if (zoneData) {
        this.departureZone = JSON.parse(zoneData);
      }
    } catch (e) {
      console.warn('Failed to load shopping state:', e);
    }
    this.notify();
  }

  private async saveState() {
    try {
      await AsyncStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(this.items));
      if (this.departureZone) {
        await AsyncStorage.setItem(DEPARTURE_ZONE_KEY, JSON.stringify(this.departureZone));
      } else {
        await AsyncStorage.removeItem(DEPARTURE_ZONE_KEY);
      }
    } catch (e) {
      console.warn('Failed to save shopping state:', e);
    }
    this.notify();
  }

  public subscribe(
    listener: (items: ShoppingItem[], zone: DepartureZone | null) => void
  ): () => void {
    this.listeners.add(listener);
    listener(this.items, this.departureZone);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.items, this.departureZone));
  }

  public getItems(): ShoppingItem[] {
    return [...this.items];
  }

  public getUnpurchasedItems(): ShoppingItem[] {
    return this.items.filter((i) => !i.purchased);
  }

  public getDepartureZone(): DepartureZone | null {
    return this.departureZone;
  }

  /**
   * Request Location Permissions (Foreground + Background)
   */
  public async requestLocationPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return true;
      }
      return false;
    }

    if (!Location?.requestForegroundPermissionsAsync) {
      return false;
    }

    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        console.warn('Foreground location permission denied');
        return false;
      }

      // Try background permission for departure geofence
      try {
        if (Location.requestBackgroundPermissionsAsync) {
          await Location.requestBackgroundPermissionsAsync();
        }
      } catch {}

      return true;
    } catch (e) {
      console.warn('Error requesting location permissions:', e);
      return false;
    }
  }

  /**
   * Capture user's present location as Base Departure Location
   */
  public async captureBaseLocation(): Promise<any | null> {
    try {
      const hasPerm = await this.requestLocationPermissions();
      if (!hasPerm || !Location?.getCurrentPositionAsync) return null;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy?.High || 4,
      });

      this.departureZone = {
        baseLat: position.coords.latitude,
        baseLng: position.coords.longitude,
        departureThresholdMeters: 120, // starts notifying between 100m and 300m
        maxRangeMeters: 350,
        departureAlertSent: false,
        activatedAt: Date.now(),
        lastCheckedDistance: 0,
      };

      await this.saveState();
      this.startLocationWatch();

      return position;
    } catch (e) {
      console.warn('Failed to capture base location:', e);
      return null;
    }
  }

  /**
   * Add items user wants to buy, save them, and lock in departure geofence (100 - 300 meters)
   */
  public async addItemsToBuy(
    newItems: string[]
  ): Promise<{ added: string[]; message: string; locationLocked: boolean }> {
    const cleanList = newItems
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (cleanList.length === 0) {
      return { added: [], message: 'No items provided', locationLocked: false };
    }

    const created: ShoppingItem[] = cleanList.map((name) => ({
      id: `shop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      addedAt: Date.now(),
      purchased: false,
    }));

    this.items = [...created, ...this.items];
    await this.saveState();

    // Lock in current location as departure reference
    const location = await this.captureBaseLocation();
    const locationLocked = !!location;

    let spoken = `Noted down ${cleanList.join(', ')} in your buy list! `;
    if (locationLocked) {
      spoken += `I locked in your present location. As soon as you step 100 to 300 meters away, I'll send you a priority alert so you don't forget to buy them!`;
    } else {
      spoken += `Saved to your buy list, bro!`;
    }

    return {
      added: cleanList,
      message: spoken,
      locationLocked,
    };
  }

  /**
   * Start listening to location updates to detect departure (100m to 300m)
   */
  public async startLocationWatch() {
    if (this.locationWatcher) {
      this.locationWatcher.remove();
      this.locationWatcher = null;
    }

    if (Platform.OS === 'web') return;

    try {
      const hasPerm = await this.requestLocationPermissions();
      if (!hasPerm || !Location?.watchPositionAsync) return;

      this.locationWatcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 15, // update every 15 meters
          timeInterval: 5000,   // or every 5 seconds
        },
        (location: any) => {
          this.handleLocationUpdate(location.coords.latitude, location.coords.longitude);
        }
      );
    } catch (e) {
      console.warn('Error starting location watch:', e);
    }
  }

  /**
   * Evaluates current position against base location.
   * If user moves between 100m and 300m away, fire departure push notification & voice alert!
   */
  public async handleLocationUpdate(currentLat: number, currentLng: number) {
    if (!this.departureZone || this.departureZone.departureAlertSent) return;

    const unpurchased = this.getUnpurchasedItems();
    if (unpurchased.length === 0) return;

    const distance = calculateDistanceMeters(
      this.departureZone.baseLat,
      this.departureZone.baseLng,
      currentLat,
      currentLng
    );

    this.departureZone.lastCheckedDistance = Math.round(distance);
    this.notify();

    // Return home reset: if user returns within 50m of home, reset alert state for next trip
    if (distance < 50 && this.departureZone.departureAlertSent) {
      this.departureZone.departureAlertSent = false;
      await this.saveState();
      return;
    }

    if (this.departureZone.departureAlertSent) return;

    // DEPARTURE TRIGGER: When user leaves home place between 100m and 350m
    if (distance >= 100 && distance <= 350) {
      this.departureZone.departureAlertSent = true;
      await this.saveState();

      const itemsList = unpurchased.map((i) => i.name).join(', ');

      // Trigger High-Priority Push Notification with clean DAMN branding
      if (Platform.OS !== 'web') {
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'DAMN',
            body: `🛒 You left home (${Math.round(distance)}m away)! Buy list items needed: ${itemsList}!`,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            color: '#141416',
            vibrate: [0, 400, 200, 400],
          },
          trigger: null,
        }).catch(() => {});
      }

      // Trigger Haptic & Vocal Callout
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}

      voiceService.speak(
        `Heads up! You just left home. Don't forget your buy list: ${itemsList}!`,
        { personality: 'hype' }
      );
    }
  }

  public async togglePurchased(id: string) {
    this.items = this.items.map((item) =>
      item.id === id ? { ...item, purchased: !item.purchased } : item
    );
    await this.saveState();
  }

  public async deleteItem(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
    await this.saveState();
  }

  public async clearPurchased() {
    this.items = this.items.filter((item) => !item.purchased);
    await this.saveState();
  }

  public getZone(): DepartureZone | null {
    return this.departureZone;
  }

  public async addItem(name: string) {
    return this.addItemsToBuy([name]);
  }

  public async toggleItem(id: string) {
    return this.togglePurchased(id);
  }

  public async removeItem(id: string) {
    return this.deleteItem(id);
  }

  public async simulateDeparture(distanceMeters: number = 150) {
    if (!this.departureZone) {
      // Create mock zone if not locked
      this.departureZone = {
        baseLat: 37.7749,
        baseLng: -122.4194,
        departureThresholdMeters: 120,
        maxRangeMeters: 350,
        departureAlertSent: false,
        activatedAt: Date.now(),
        lastCheckedDistance: 0,
      };
    }

    // Offset coordinates roughly by distanceMeters (1 deg lat ~ 111,000m)
    const latOffset = distanceMeters / 111000;
    this.departureZone.departureAlertSent = false;
    await this.handleLocationUpdate(
      this.departureZone.baseLat + latOffset,
      this.departureZone.baseLng
    );
  }

  public async resetDepartureZone() {
    if (this.departureZone) {
      this.departureZone.departureAlertSent = false;
      await this.captureBaseLocation();
    }
  }
}

export const shoppingLocationService = new ShoppingLocationService();

