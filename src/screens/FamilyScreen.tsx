import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  Users,
  Copy,
  Check,
  Plus,
  Bell,
  ShoppingBag,
  MapPin,
  Trash2,
  Heart,
  Sparkles,
  UserCheck,
  Send,
  Clock,
} from 'lucide-react-native';

import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';
import { HeaderBar } from '../components/HeaderBar';
import {
  familyService,
  FamilyState,
  FamilyReminder,
  FamilyShoppingItem,
  FamilyMember,
} from '../services/familyService';

export const FamilyScreen: React.FC = () => {
  const { state } = useApp();
  const { user } = state;

  const [familyData, setFamilyData] = useState<FamilyState>(familyService.getState());
  const [copiedCode, setCopiedCode] = useState(false);
  const [joinInputCode, setJoinInputCode] = useState('');
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDelay, setNewReminderDelay] = useState(120); // 2 hours default
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    const unsub = familyService.subscribe((updated) => {
      setFamilyData({ ...updated });
    });
    return () => unsub();
  }, []);

  const handleCopyFamCode = async () => {
    try {
      await Clipboard.setStringAsync(familyData.famCode);
      setCopiedCode(true);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.warn('Copy FAM code error:', e);
    }
  };

  const handleJoinFamily = () => {
    if (!joinInputCode.trim()) {
      Alert.alert('Empty FAM Code', 'Please enter a family code (e.g. FAM-8K2P91).');
      return;
    }
    const res = familyService.joinFamilyByCode(joinInputCode.trim());
    if (res.success) {
      setJoinInputCode('');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Alert.alert('Connected to Family!', res.message);
    } else {
      Alert.alert('Connection Failed', res.message);
    }
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    familyService.addFamilyMember(newMemberName.trim(), 'Family Member');
    setNewMemberName('');
    setShowAddMember(false);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleAddReminder = (customDelay?: number) => {
    const title = newReminderTitle.trim();
    if (!title) {
      Alert.alert('Empty Reminder', 'What do you want to remind the family about?');
      return;
    }
    const delay = customDelay || newReminderDelay;
    familyService.addFamilyReminder(title, delay, user.name || 'You', 'All');
    setNewReminderTitle('');
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const handleAddShoppingItem = () => {
    const text = newShoppingItem.trim();
    if (!text) return;
    familyService.addFamilyShoppingItems(text, user.name || 'You');
    setNewShoppingItem('');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const activeReminders = familyData.reminders.filter((r) => !r.completed);
  const unpurchasedItems = familyData.shoppingItems.filter((i) => !i.purchased);

  return (
    <View style={styles.container}>
      <HeaderBar />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Header Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <View style={styles.heroTagPill}>
              <Heart size={12} color="#DC2626" fill="#DC2626" />
              <Text style={styles.heroTagText}>CONNECTED FAMILY CIRCLE</Text>
            </View>
            <Text style={styles.heroTitle}>{familyData.familyName}</Text>
            <Text style={styles.heroSubtitle}>
              Shared reminders, errands & departure shopping alerts
            </Text>
          </View>
        </View>

        {/* 2. FAM CODE SHARING CARD */}
        <View style={styles.famCodeCard}>
          <View style={styles.famCodeHeader}>
            <View style={styles.famCodeHeaderLeft}>
              <View style={styles.famIconCircle}>
                <Users size={16} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.famCodeTitle}>Your Family FAM CODE</Text>
                <Text style={styles.famCodeHelper}>
                  Give this code to family members to connect instantly
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.codeDisplayRow}>
            <View style={styles.codeBubble}>
              <Text style={styles.codeText}>{familyData.famCode}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyBtn, copiedCode && styles.copyBtnDone]}
              onPress={handleCopyFamCode}
              activeOpacity={0.8}
            >
              {copiedCode ? (
                <>
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  <Text style={styles.copyBtnText}>COPIED</Text>
                </>
              ) : (
                <>
                  <Copy size={14} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.copyBtnText}>COPY</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Join Another Family Input */}
          <View style={styles.joinInputRow}>
            <TextInput
              style={styles.joinInput}
              value={joinInputCode}
              onChangeText={setJoinInputCode}
              placeholder="Or enter FAM-XXXXXX to join..."
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.joinBtn}
              onPress={handleJoinFamily}
              activeOpacity={0.8}
            >
              <Text style={styles.joinBtnText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. CONNECTED FAMILY MEMBERS ROW */}
        <View style={styles.membersCard}>
          <View style={styles.membersHeader}>
            <View style={styles.membersHeaderLeft}>
              <UserCheck size={16} color="#059669" strokeWidth={2.4} />
              <Text style={styles.membersTitle}>
                Connected Members ({familyData.members.length})
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addMemberSmallBtn}
              onPress={() => setShowAddMember(!showAddMember)}
              activeOpacity={0.75}
            >
              <Plus size={12} color="#059669" strokeWidth={2.5} />
              <Text style={styles.addMemberSmallText}>Add Member</Text>
            </TouchableOpacity>
          </View>

          {showAddMember && (
            <View style={styles.addMemberForm}>
              <TextInput
                style={styles.addMemberInput}
                value={newMemberName}
                onChangeText={setNewMemberName}
                placeholder="Member name (e.g. Sister, Grandpa)..."
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity
                style={styles.confirmMemberBtn}
                onPress={handleAddMember}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmMemberText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersScroll}>
            {familyData.members.map((mem) => (
              <View key={mem.id} style={styles.memberPill}>
                <View style={[styles.avatarCircle, mem.relation === 'Self' && styles.avatarSelf]}>
                  <Text style={styles.avatarInitials}>
                    {mem.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberMeta}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {mem.name}
                  </Text>
                  <View style={styles.onlineStatusRow}>
                    <View
                      style={[styles.statusDot, mem.isOnline ? styles.dotGreen : styles.dotGrey]}
                    />
                    <Text style={styles.relationText}>{mem.relation}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 4. FAMILY SHARED REMINDERS */}
        <View style={styles.remindersCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleLeft}>
              <Bell size={18} color="#7C3AED" strokeWidth={2.4} />
              <Text style={styles.sectionTitleText}>Family Shared Reminders</Text>
            </View>
            <View style={styles.countBadgePurple}>
              <Text style={styles.countBadgeTextPurple}>{activeReminders.length} ACTIVE</Text>
            </View>
          </View>

          <Text style={styles.reminderExplainText}>
            Say <Text style={{ fontWeight: '700' }}>"Remind family: dinner at 8pm"</Text> or add
            below. DAMN alerts all family members 5m &amp; 1m before, with savage voice wake-up!
          </Text>

          {/* Quick Input Bar */}
          <View style={styles.reminderInputBar}>
            <TextInput
              style={styles.reminderInput}
              value={newReminderTitle}
              onChangeText={setNewReminderTitle}
              placeholder="e.g. Pay internet bill, Mom's doctor visit..."
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity
              style={styles.addReminderBtn}
              onPress={() => handleAddReminder()}
              activeOpacity={0.8}
            >
              <Text style={styles.addReminderBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Fast Preset Delay Chips */}
          <View style={styles.presetChipsRow}>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleAddReminder(120)}
              activeOpacity={0.75}
            >
              <Clock size={12} color="#7C3AED" />
              <Text style={styles.presetChipText}>In 2 Hours</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleAddReminder(360)}
              activeOpacity={0.75}
            >
              <Clock size={12} color="#7C3AED" />
              <Text style={styles.presetChipText}>In 6 Hours (Tonight)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleAddReminder(1440)}
              activeOpacity={0.75}
            >
              <Clock size={12} color="#7C3AED" />
              <Text style={styles.presetChipText}>Tomorrow</Text>
            </TouchableOpacity>
          </View>

          {/* Active Family Reminders List */}
          {activeReminders.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateTitle}>No Active Family Reminders</Text>
              <Text style={styles.emptyStateSub}>
                Tell DAMN "Hey DAMN, remind family..." anytime to broadcast a reminder.
              </Text>
            </View>
          ) : (
            activeReminders.map((rem) => {
              const secondsLeft = Math.max(0, Math.round((rem.scheduledAt - Date.now()) / 1000));
              const minsLeft = Math.floor(secondsLeft / 60);
              const hrsLeft = Math.floor(minsLeft / 60);
              const displayTime =
                hrsLeft > 0 ? `${hrsLeft}h ${minsLeft % 60}m` : `${minsLeft}m ${secondsLeft % 60}s`;

              return (
                <View key={rem.id} style={styles.familyReminderItem}>
                  <View style={styles.familyReminderLeft}>
                    <Text style={styles.familyReminderTitle}>{rem.title}</Text>
                    <Text style={styles.familyReminderMeta}>
                      Due in {displayTime} • By {rem.createdBy} • ⚡ 5m &amp; 1m armed
                    </Text>
                  </View>

                  <View style={styles.reminderActionsRow}>
                    {!rem.stage1MinAcknowledged ? (
                      <TouchableOpacity
                        style={styles.reactBtn}
                        onPress={() => familyService.acknowledgeFamilyReminder(rem.id)}
                        activeOpacity={0.8}
                      >
                        <Check size={12} color="#FFFFFF" strokeWidth={2.6} />
                        <Text style={styles.reactBtnText}>React</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.reactedBadge}>
                        <Text style={styles.reactedText}>Reacted ✓</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.deleteIconBtn}
                      onPress={() => familyService.deleteFamilyReminder(rem.id)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* 5. FAMILY SHARED SHOPPING LIST & RADAR */}
        <View style={styles.shoppingCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleLeft}>
              <ShoppingBag size={18} color="#059669" strokeWidth={2.4} />
              <Text style={styles.sectionTitleText}>Family Shopping List &amp; Radar</Text>
            </View>
            <View style={styles.countBadgeGreen}>
              <Text style={styles.countBadgeTextGreen}>
                {unpurchasedItems.length} NEEDED
              </Text>
            </View>
          </View>

          <Text style={styles.reminderExplainText}>
            Say <Text style={{ fontWeight: '700' }}>"Add milk and bread to family shopping"</Text>.
            When anyone in the family steps 100m to 300m away from home, DAMN pings them to grab
            these!
          </Text>

          {/* Quick Input Bar */}
          <View style={styles.reminderInputBar}>
            <TextInput
              style={styles.reminderInput}
              value={newShoppingItem}
              onChangeText={setNewShoppingItem}
              placeholder="e.g. Milk, eggs, detergent, coffee..."
              placeholderTextColor={COLORS.textMuted}
              onSubmitEditing={handleAddShoppingItem}
            />
            <TouchableOpacity
              style={styles.addShoppingBtn}
              onPress={handleAddShoppingItem}
              activeOpacity={0.8}
            >
              <Plus size={14} color="#FFFFFF" strokeWidth={3} />
              <Text style={styles.addShoppingBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Shopping Checklist Chips */}
          <View style={styles.shoppingListWrap}>
            {familyData.shoppingItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.shoppingChip, item.purchased && styles.shoppingChipPurchased]}
                onPress={() => familyService.toggleFamilyShoppingItem(item.id)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.shopCheckbox,
                    item.purchased && styles.shopCheckboxPurchased,
                  ]}
                >
                  {item.purchased && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text
                  style={[
                    styles.shoppingChipName,
                    item.purchased && styles.shoppingChipNamePurchased,
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={styles.addedByText}>({item.addedBy})</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Test Departure Radar Trigger */}
          <TouchableOpacity
            style={styles.testRadarBtn}
            onPress={() => familyService.triggerFamilyDepartureAlert()}
            activeOpacity={0.8}
          >
            <MapPin size={14} color="#065F46" strokeWidth={2.4} />
            <Text style={styles.testRadarText}>
              Test Family Departure Radar (Simulate Leaving Home)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Spacing for bottom floating dock */}
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
    paddingTop: 8,
    paddingBottom: 24,
  },
  heroBanner: {
    backgroundColor: COLORS.cardCream,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...SHADOWS.card,
  },
  heroLeft: {
    gap: 4,
  },
  heroTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  heroTagText: {
    fontFamily: FONTS.outfitBold,
    fontSize: 9,
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontFamily: FONTS.outfitBold,
    fontSize: 22,
    color: COLORS.textMain,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  heroSubtitle: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // FAM Code Card
  famCodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...SHADOWS.card,
  },
  famCodeHeader: {
    marginBottom: 12,
  },
  famCodeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  famIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  famCodeTitle: {
    fontFamily: FONTS.outfitBold,
    fontSize: 14,
    color: COLORS.textMain,
  },
  famCodeHelper: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  codeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  codeBubble: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontFamily: FONTS.outfitBold,
    fontSize: 20,
    letterSpacing: 2,
    color: '#141416',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  copyBtnDone: {
    backgroundColor: '#059669',
  },
  copyBtnText: {
    fontFamily: FONTS.outfitBold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  joinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  joinInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    color: COLORS.textMain,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  joinBtn: {
    backgroundColor: '#141416',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  joinBtnText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Connected Members Card
  membersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...SHADOWS.card,
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  membersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  membersTitle: {
    fontFamily: FONTS.outfitBold,
    fontSize: 13,
    color: COLORS.textMain,
  },
  addMemberSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  addMemberSmallText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 11,
    color: '#059669',
  },
  addMemberForm: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addMemberInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    color: COLORS.textMain,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmMemberBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmMemberText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  membersScroll: {
    flexDirection: 'row',
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelf: {
    backgroundColor: '#D1FAE5',
  },
  avatarInitials: {
    fontFamily: FONTS.outfitBold,
    fontSize: 12,
    color: '#141416',
  },
  memberMeta: {
    gap: 2,
  },
  memberName: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    color: COLORS.textMain,
  },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: '#059669',
  },
  dotGrey: {
    backgroundColor: '#9CA3AF',
  },
  relationText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 10,
    color: COLORS.textMuted,
  },

  // Reminders Card
  remindersCard: {
    backgroundColor: COLORS.cardLavender,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...SHADOWS.card,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleText: {
    fontFamily: FONTS.outfitBold,
    fontSize: 14,
    color: COLORS.textMain,
  },
  countBadgePurple: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  countBadgeTextPurple: {
    fontFamily: FONTS.outfitBold,
    fontSize: 10,
    color: '#7C3AED',
  },
  countBadgeGreen: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  countBadgeTextGreen: {
    fontFamily: FONTS.outfitBold,
    fontSize: 10,
    color: '#059669',
  },
  reminderExplainText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    color: '#5B21B6',
    lineHeight: 16,
    marginBottom: 10,
  },
  reminderInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  reminderInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    color: COLORS.textMain,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  addReminderBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
  },
  addReminderBtnText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  presetChipText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 11,
    color: '#7C3AED',
  },
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  emptyStateTitle: {
    fontFamily: FONTS.outfitBold,
    fontSize: 13,
    color: COLORS.textMain,
  },
  emptyStateSub: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  familyReminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  familyReminderLeft: {
    flex: 1,
    marginRight: 8,
  },
  familyReminderTitle: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 13,
    color: COLORS.textMain,
  },
  familyReminderMeta: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  reminderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#141416',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  reactBtnText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  reactedBadge: {
    backgroundColor: '#E2F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  reactedText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 10,
    color: '#059669',
  },
  deleteIconBtn: {
    padding: 6,
  },

  // Shopping Card
  shoppingCard: {
    backgroundColor: COLORS.cardMint,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...SHADOWS.card,
  },
  addShoppingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
  },
  addShoppingBtnText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  shoppingListWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  shoppingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  shoppingChipPurchased: {
    backgroundColor: '#E2F5E8',
    opacity: 0.6,
  },
  shopCheckbox: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopCheckboxPurchased: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  shoppingChipName: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    color: COLORS.textMain,
  },
  shoppingChipNamePurchased: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  addedByText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  testRadarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  testRadarText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 11,
    color: '#065F46',
  },
});

