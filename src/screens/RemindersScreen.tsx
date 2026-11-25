import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import {
  Bell,
  BellRing,
  ShoppingBag,
  MapPin,
  Clock,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Volume2,
  AlertTriangle,
  Radio,
  Compass,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { HeaderBar } from '../components/HeaderBar';
import { reminderService, SmartReminder } from '../services/reminderService';
import {
  shoppingLocationService,
  ShoppingItem,
  DepartureZone,
} from '../services/shoppingLocationService';
import { voiceService } from '../services/voiceService';

export const RemindersScreen: React.FC = () => {
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [zone, setZone] = useState<DepartureZone | null>(null);
  const [newReminderText, setNewReminderText] = useState('');
  const [newReminderHours, setNewReminderHours] = useState('2');
  const [newShopItemText, setNewShopItemText] = useState('');

  useEffect(() => {
    // Initial fetch
    setReminders(reminderService.getActiveReminders());
    setShoppingItems(shoppingLocationService.getItems());
    setZone(shoppingLocationService.getZone());

    // Subscribe to reminders updates
    const unsubReminders = reminderService.subscribe((active: SmartReminder[]) => {
      setReminders([...active]);
    });

    // Subscribe to shopping location updates
    const unsubShopping = shoppingLocationService.subscribe(
      (items: ShoppingItem[], currentZone: DepartureZone | null) => {
        setShoppingItems([...items]);
        setZone(currentZone);
      }
    );

    // Interval to refresh time counters every 5 seconds
    const timer = setInterval(() => {
      setReminders(reminderService.getActiveReminders());
    }, 5000);

    return () => {
      unsubReminders();
      unsubShopping();
      clearInterval(timer);
    };
  }, []);

  const handleAddReminder = async (hours: number = 2) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const text = newReminderText.trim() || 'Important priority task';
    const durationSeconds = Math.max(30, Math.round(hours * 3600));

    await reminderService.scheduleSmartReminder(text, durationSeconds);
    setNewReminderText('');
    await voiceService.speak(
      `Locked in! I'll ping you 5 minutes before, 1 minute before, and on time for "${text}".`
    );
  };

  const handleTestShortReminder = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    // Fast-forward test reminder: 70 seconds total (1-minute warning fires in 10 seconds!)
    await reminderService.scheduleSmartReminder('Review priority documents', 70);
    await voiceService.speak(
      'Test reminder scheduled for 70 seconds! Watch for the 1-minute reaction alert!'
    );
  };

  const handleReactReminder = async (id: string) => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    await reminderService.reactToWarning(id);
    await voiceService.speak("Acknowledged! You're locked in. I will ping you on time.");
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await reminderService.cancelReminder(id);
  };

  const handleAddShopItem = async () => {
    const text = newShopItemText.trim();
    if (!text) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    await shoppingLocationService.addItem(text);
    setNewShopItemText('');
    await voiceService.speak(`Added ${text} to your buy list. I'll alert you when leaving this location.`);
  };

  const handleToggleShopItem = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await shoppingLocationService.toggleItem(id);
  };

  const handleDeleteShopItem = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await shoppingLocationService.removeItem(id);
  };

  const handleTestDeparture = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    await shoppingLocationService.simulateDeparture(150);
  };

  const formatRemaining = (scheduledAt: number) => {
    const diff = scheduledAt - Date.now();
    if (diff <= 0) return 'Due now';
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) return `${hours}h ${remMins}m remaining`;
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s remaining`;
  };

  const remainingShopCount = shoppingItems.filter((i) => !i.purchased).length;

  return (
    <View style={styles.container}>
      <HeaderBar />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <View style={styles.titleSection}>
          <View style={styles.titleBadge}>
            <Sparkles size={13} color="#6D28D9" />
            <Text style={styles.titleBadgeText}>AI PERSONAL ASSISTANT</Text>
          </View>
          <Text style={styles.pageTitle}>Reminders & Errands</Text>
          <Text style={styles.pageSub}>
            Voice-first escalating reminders & GPS departure shopping radar
          </Text>
        </View>

        {/* 1. Escalating Smart Reminders Card */}
        <View style={styles.bentoCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#EDE7F6' }]}>
              <BellRing size={20} color="#6D28D9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Smart Escalating Reminders</Text>
              <Text style={styles.cardSubtitle}>
                3-stage alerts: 5m heads-up • 1m reaction • Savage voice wake-up
              </Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{reminders.length}</Text>
            </View>
          </View>

          {/* Explanation banner */}
          <View style={styles.infoBanner}>
            <Zap size={14} color="#6D28D9" style={{ marginTop: 2 }} />
            <Text style={styles.infoBannerText}>
              Say <Text style={styles.boldText}>"Remind me this after 2 hr"</Text>. If you don't react to the 1-minute alert, DAMN voice wakes up and shouts your reminder!
            </Text>
          </View>

          {/* Quick Create Input */}
          <View style={styles.createRow}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Call client, take laundry, finish report..."
              placeholderTextColor="#9CA3AF"
              value={newReminderText}
              onChangeText={setNewReminderText}
            />
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleAddReminder(parseFloat(newReminderHours) || 2)}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFF" />
              <Text style={styles.actionBtnText}>Add +2h</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Preset Buttons */}
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={[styles.presetChip, { backgroundColor: '#EDE7F6' }]}
              onPress={() => handleAddReminder(2)}
              activeOpacity={0.7}
            >
              <Clock size={13} color="#6D28D9" />
              <Text style={[styles.presetChipText, { color: '#6D28D9' }]}>+ 2 Hours (Standard)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetChip, { backgroundColor: '#E1F5FE' }]}
              onPress={() => handleAddReminder(0.5)}
              activeOpacity={0.7}
            >
              <Clock size={13} color="#0284C7" />
              <Text style={[styles.presetChipText, { color: '#0284C7' }]}>+ 30 Mins</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetChip, { backgroundColor: '#FFF0E6', borderColor: '#EA580C', borderWidth: 1 }]}
              onPress={handleTestShortReminder}
              activeOpacity={0.7}
            >
              <Zap size={13} color="#EA580C" />
              <Text style={[styles.presetChipText, { color: '#EA580C', fontWeight: '700' }]}>
                ⚡ Test 70s Escalation
              </Text>
            </TouchableOpacity>
          </View>

          {/* Active Reminders List */}
          {reminders.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={28} color="#D1D5DB" />
              <Text style={styles.emptyText}>No active reminders right now</Text>
              <Text style={styles.emptySubText}>
                Say "Hey DAMN, remind me this after 2 hours" to set one hands-free.
              </Text>
            </View>
          ) : (
            <View style={styles.reminderList}>
              {reminders.map((rem) => (
                <View key={rem.id} style={styles.reminderItem}>
                  <View style={styles.reminderHeader}>
                    <View style={styles.reminderMain}>
                      <Text style={styles.reminderLabel}>{rem.title}</Text>
                      <View style={styles.countdownRow}>
                        <Clock size={12} color="#6B7280" />
                        <Text style={styles.countdownText}>
                          {formatRemaining(rem.scheduledAt)}
                        </Text>
                        <Text style={styles.timeTarget}>
                          • At{' '}
                          {new Date(rem.scheduledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteReminder(rem.id)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  {/* Stage Progress Pills */}
                  <View style={styles.stagePillsRow}>
                    <View
                      style={[
                        styles.stagePill,
                        rem.stage5MinSent && styles.stagePillDone,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stagePillText,
                          rem.stage5MinSent && styles.stagePillTextDone,
                        ]}
                      >
                        1. 5m Heads-Up {rem.stage5MinSent ? '✓' : '⏳'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.stagePill,
                        rem.stage1MinSent && styles.stagePillDone,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stagePillText,
                          rem.stage1MinSent && styles.stagePillTextDone,
                        ]}
                      >
                        2. 1m Alert {rem.stage1MinSent ? '✓' : '⏳'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.stagePill,
                        rem.stage1MinAcknowledged && styles.stagePillReacted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stagePillText,
                          rem.stage1MinAcknowledged && styles.stagePillTextReacted,
                        ]}
                      >
                        {rem.stage1MinAcknowledged ? 'Reacted ✓' : 'Awaiting Reaction'}
                      </Text>
                    </View>
                  </View>

                  {/* React / Acknowledge Button */}
                  {!rem.stage1MinAcknowledged && (
                    <TouchableOpacity
                      style={styles.reactButton}
                      onPress={() => handleReactReminder(rem.id)}
                      activeOpacity={0.8}
                    >
                      <Check size={14} color="#059669" strokeWidth={3} />
                      <Text style={styles.reactButtonText}>
                        React / Acknowledge (Prevent Savage Voice Shout)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 2. Location Departure Shopping Radar Card */}
        <View style={[styles.bentoCard, { backgroundColor: '#F0FDF4' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <ShoppingBag size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Shopping & Errands Radar</Text>
              <Text style={styles.cardSubtitle}>
                GPS departure alert when leaving 100m – 300m radius
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.countBadgeText, { color: '#059669' }]}>
                {remainingShopCount} left
              </Text>
            </View>
          </View>

          {/* Location Status Pill */}
          <View style={styles.locationRadarBox}>
            <View style={styles.radarHeader}>
              <Compass size={15} color="#059669" />
              <Text style={styles.radarTitle}>
                {zone ? 'Origin Geofence Locked' : 'GPS Radar Active'}
              </Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>GPS LOCKED</Text>
              </View>
            </View>

            <View style={styles.radarStats}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {zone?.lastCheckedDistance !== undefined
                    ? `${zone.lastCheckedDistance}m`
                    : '0m'}
                </Text>
                <Text style={styles.statLabel}>Distance from Origin</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {zone?.departureThresholdMeters
                    ? `${zone.departureThresholdMeters}m`
                    : '100m - 300m'}
                </Text>
                <Text style={styles.statLabel}>Departure Trigger</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{remainingShopCount}</Text>
                <Text style={styles.statLabel}>Items to Buy</Text>
              </View>
            </View>

            <View style={styles.departureTestRow}>
              <TouchableOpacity
                style={styles.simulateDepBtn}
                onPress={handleTestDeparture}
                activeOpacity={0.8}
              >
                <Radio size={14} color="#FFF" />
                <Text style={styles.simulateDepBtnText}>
                  🧪 Test 150m Departure Alert
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add Shopping Item Input */}
          <View style={styles.createRow}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Milk, bread, batteries, iced coffee..."
              placeholderTextColor="#9CA3AF"
              value={newShopItemText}
              onChangeText={setNewShopItemText}
              onSubmitEditing={handleAddShopItem}
            />
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#059669' }]}
              onPress={handleAddShopItem}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFF" />
              <Text style={styles.actionBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Shopping Checklist Items */}
          {shoppingItems.length === 0 ? (
            <View style={styles.emptyState}>
              <ShoppingBag size={28} color="#D1D5DB" />
              <Text style={styles.emptyText}>Shopping list is empty</Text>
              <Text style={styles.emptySubText}>
                Say "Hey DAMN, I need to buy milk, bread, and coffee" to add items.
              </Text>
            </View>
          ) : (
            <View style={styles.shoppingList}>
              {shoppingItems.map((item) => (
                <View key={item.id} style={styles.shopRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, item.purchased && styles.checkboxChecked]}
                    onPress={() => handleToggleShopItem(item.id)}
                    activeOpacity={0.7}
                  >
                    {item.purchased && <Check size={14} color="#FFF" strokeWidth={3} />}
                  </TouchableOpacity>
                  <Text
                    style={[styles.shopItemText, item.purchased && styles.shopItemTextPurchased]}
                  >
                    {item.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteShopItem(item.id)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={15} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Space for bottom dock */}
        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: 5,
    marginBottom: 8,
  },
  titleBadgeText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 10,
    color: '#6D28D9',
    letterSpacing: 0.8,
  },
  pageTitle: {
    fontFamily: FONTS.outfitBold,
    fontSize: 26,
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  pageSub: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 13,
    color: COLORS.textSub,
    marginTop: 2,
  },
  bentoCard: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#141416',
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontFamily: FONTS.outfitBold,
    fontSize: 16,
    color: COLORS.textMain,
  },
  cardSubtitle: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 11,
    color: COLORS.textSub,
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  countBadgeText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    color: '#6D28D9',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: FONTS.jakartaRegular,
    fontSize: 11.5,
    color: '#4C1D95',
    lineHeight: 16,
  },
  boldText: {
    fontFamily: FONTS.jakartaBold,
    color: '#6D28D9',
  },
  createRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: FONTS.jakartaRegular,
    fontSize: 13,
    color: COLORS.textMain,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6D28D9',
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  actionBtnText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    color: '#FFF',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  presetChipText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 13,
    color: COLORS.textSub,
  },
  emptySubText: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 260,
  },
  reminderList: {
    gap: 10,
  },
  reminderItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 8,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  reminderMain: {
    flex: 1,
  },
  reminderLabel: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 14,
    color: COLORS.textMain,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  countdownText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 11.5,
    color: '#6D28D9',
  },
  timeTarget: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 11,
    color: '#6B7280',
  },
  deleteBtn: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stagePillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stagePill: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    paddingVertical: 4,
    alignItems: 'center',
  },
  stagePillDone: {
    backgroundColor: '#DCFCE7',
  },
  stagePillReacted: {
    backgroundColor: '#DCFCE7',
  },
  stagePillText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 9.5,
    color: '#4B5563',
  },
  stagePillTextDone: {
    color: '#059669',
    fontFamily: FONTS.jakartaBold,
  },
  stagePillTextReacted: {
    color: '#059669',
    fontFamily: FONTS.jakartaBold,
  },
  reactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2F5E8',
    borderRadius: RADIUS.sm,
    borderWidth: 1.2,
    borderColor: '#059669',
    paddingVertical: 8,
    gap: 6,
    marginTop: 4,
  },
  reactButtonText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 11.5,
    color: '#059669',
  },
  locationRadarBox: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    marginBottom: 12,
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  radarTitle: {
    flex: 1,
    fontFamily: FONTS.jakartaBold,
    fontSize: 12.5,
    color: '#065F46',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  liveText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 9,
    color: '#059669',
    letterSpacing: 0.5,
  },
  radarStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
    marginBottom: 8,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontFamily: FONTS.outfitBold,
    fontSize: 16,
    color: '#065F46',
  },
  statLabel: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 10,
    color: '#047857',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#D1FAE5',
  },
  departureTestRow: {
    marginTop: 4,
  },
  simulateDepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    gap: 6,
  },
  simulateDepBtnText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 11.5,
    color: '#FFF',
  },
  shoppingList: {
    gap: 6,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  shopItemText: {
    flex: 1,
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.textMain,
  },
  shopItemTextPurchased: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
});
