import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Sliders, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ArrowUp, 
  Sparkles, 
  Bell,
  ShoppingBag,
  MapPin,
  Check,
  Users
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';
import { HeaderBar } from '../components/HeaderBar';
import { MascotFace } from '../components/MascotFace';

// Voice Assistant Components & Services
import { VoiceAssistantOrb, AssistantState } from '../components/VoiceAssistantOrb';
import { VoiceCommandCard } from '../components/VoiceCommandCard';
import { VoiceActionChips } from '../components/VoiceActionChips';
import { voiceService } from '../services/voiceService';
import { processVoiceCommand, CommandResult, AssistantContext } from '../services/assistantCommands';
import { reminderService, SmartReminder } from '../services/reminderService';
import { shoppingLocationService, ShoppingItem, DepartureZone } from '../services/shoppingLocationService';
import { familyService, FamilyState } from '../services/familyService';

export const DashboardScreen: React.FC = () => {
  const { 
    state, 
    openModal, 
    addWater, 
    addSteps, 
    toggleTask, 
    addCustomTask, 
    takeSupplement, 
    setActiveTab 
  } = useApp();
  const { user } = state;

  // Voice Assistant State
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [lastCommandResult, setLastCommandResult] = useState<CommandResult | null>(null);
  const [personality, setPersonality] = useState<'hype' | 'chill' | 'savage' | 'zen'>('hype');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState<boolean>(false);
  const [textCommandInput, setTextCommandInput] = useState<string>('');

  // Smart Reminders, Shopping Geofence & Family States
  const [activeReminders, setActiveReminders] = useState<SmartReminder[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [departureZone, setDepartureZone] = useState<DepartureZone | null>(null);
  const [familyData, setFamilyData] = useState<FamilyState>(familyService.getState());

  const scrollViewRef = useRef<ScrollView>(null);

  // Subscribe to voice service events & smart services
  useEffect(() => {
    const unsubscribe = voiceService.subscribe((voiceState) => {
      if (voiceState.isListening) {
        setAssistantState('listening');
        setLiveTranscript(voiceState.transcript);
      } else if (voiceState.isSpeaking) {
        setAssistantState('speaking');
      } else {
        if (assistantState !== 'thinking') {
          setAssistantState('idle');
        }
      }
      setIsWakeWordActive(!!voiceState.isWakeWordActive);
    });

    const unsubShop = shoppingLocationService.subscribe((items, zone) => {
      setShoppingItems(items);
      setDepartureZone(zone);
    });

    const unsubFam = familyService.subscribe((f) => {
      setFamilyData({ ...f });
    });

    // Check reminders periodically
    setActiveReminders(reminderService.getActiveReminders());
    const remInterval = setInterval(() => {
      setActiveReminders(reminderService.getActiveReminders());
    }, 2000);

    return () => {
      unsubscribe();
      unsubShop();
      unsubFam();
      clearInterval(remInterval);
      voiceService.stopSpeaking();
      voiceService.stopListening();
    };
  }, []);

  // Context bundle for executing commands
  const assistantContext: AssistantContext = {
    state,
    addWater,
    addSteps,
    toggleTask,
    addCustomTask,
    takeSupplement,
    setActiveTab,
    openModal,
  };

  /**
   * Execute voice or text command through the assistant engine
   */
  const handleExecuteCommand = async (commandText: string) => {
    const query = commandText.trim();
    if (!query) return;

    Keyboard.dismiss();
    setTextCommandInput('');
    setLiveTranscript(query);
    setAssistantState('thinking');

    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      const result = await processVoiceCommand(query, assistantContext, personality);
      setLastCommandResult(result);

      // Trigger success haptic
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // Vocalize response if not muted
      if (!isAudioMuted && result.spokenResponse) {
        setAssistantState('speaking');
        await voiceService.speak(result.spokenResponse, {
          personality,
          onDone: () => {
            setAssistantState('idle');
          },
        });
      } else {
        setAssistantState('idle');
      }
    } catch (err) {
      console.warn('Error executing voice command:', err);
      setAssistantState('idle');
    }
  };

  /**
   * Toggle microphone listening state
   */
  const handleToggleMic = async () => {
    if (assistantState === 'listening') {
      await voiceService.stopListening();
      if (liveTranscript.trim()) {
        handleExecuteCommand(liveTranscript);
      } else {
        setAssistantState('idle');
      }
    } else if (assistantState === 'speaking') {
      await voiceService.stopSpeaking();
      setAssistantState('idle');
    } else {
      setLiveTranscript('');
      const started = await voiceService.startListening((transcript, isFinal) => {
        setLiveTranscript(transcript);
        if (isFinal && transcript.trim().length > 1) {
          voiceService.stopListening();
          handleExecuteCommand(transcript);
        }
      });

      if (!started) {
        setAssistantState('idle');
      }
    }
  };

  useEffect(() => {
    const initWakeWord = async () => {
      try {
        const stored = await AsyncStorage.getItem('DAMN_WAKE_WORD_ENABLED');
        if (stored !== 'false') {
          const ok = await voiceService.enableWakeWord((cmd) => {
            handleExecuteCommand(cmd);
          });
          if (ok) {
            setIsWakeWordActive(true);
          }
        }
      } catch (e) {
        console.warn('Wake word init error:', e);
      }
    };
    initWakeWord();
  }, []);

  const handleToggleWakeWord = async () => {
    if (isWakeWordActive) {
      await voiceService.disableWakeWord();
      setIsWakeWordActive(false);
      try {
        await AsyncStorage.setItem('DAMN_WAKE_WORD_ENABLED', 'false');
      } catch {}
    } else {
      const ok = await voiceService.enableWakeWord((cmd) => {
        handleExecuteCommand(cmd);
      });
      if (ok) {
        setIsWakeWordActive(true);
        try {
          await AsyncStorage.setItem('DAMN_WAKE_WORD_ENABLED', 'true');
        } catch {}
      }
    }
  };

  const personalities: Array<{ key: 'hype' | 'chill' | 'savage' | 'zen'; label: string; icon: string }> = [
    { key: 'hype', label: 'HYPE BRO', icon: '⚡' },
    { key: 'chill', label: 'CHILL', icon: '🧊' },
    { key: 'savage', label: 'SAVAGE', icon: '💀' },
    { key: 'zen', label: 'ZEN', icon: '🧘' },
  ];

  return (
    <View style={styles.container}>
      <HeaderBar />

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Welcome Banner */}
        <View style={styles.mottoBanner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.greeting}>
              Yo, <Text style={styles.greetingName}>{user.name || 'Friend'}</Text>
            </Text>
            <Text style={styles.welcomeSubtitle}>Personal &amp; Family AI Assistant</Text>
          </View>
          <TouchableOpacity
            style={styles.editBannerBtn}
            onPress={() => openModal('lockin')}
            activeOpacity={0.75}
          >
            <Sliders size={15} color={COLORS.textMain} strokeWidth={2.2} />
            <Text style={styles.editBannerText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* 2. HERO VOICE COMMAND CENTER CARD */}
        <View style={styles.voiceHeroCard}>
          {/* Top Control Bar: Wake Word Pill, Personality Pills & Mute Button */}
          <View style={styles.voiceCardHeader}>
            {/* Hands-Free Wake Word "Hey DAMN" Toggle Pill */}
            <TouchableOpacity
              style={[styles.wakeWordBtn, isWakeWordActive && styles.wakeWordBtnActive]}
              onPress={handleToggleWakeWord}
              activeOpacity={0.8}
            >
              <View style={[styles.wakeWordDot, isWakeWordActive && styles.wakeWordDotActive]} />
              <Text style={[styles.wakeWordText, isWakeWordActive && styles.wakeWordTextActive]}>
                {isWakeWordActive ? 'HEY DAMN: ON' : 'HEY DAMN'}
              </Text>
            </TouchableOpacity>

            <View style={styles.personalityScroll}>
              {personalities.map((p) => {
                const isActive = personality === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.personalityBtn, isActive && styles.personalityBtnActive]}
                    onPress={() => setPersonality(p.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.personalityIcon}>{p.icon}</Text>
                    <Text style={[styles.personalityLabel, isActive && styles.personalityLabelActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Audio Voice Output Mute Toggle */}
            <TouchableOpacity
              style={[styles.muteBtn, isAudioMuted && styles.muteBtnActive]}
              onPress={() => {
                if (!isAudioMuted && assistantState === 'speaking') {
                  voiceService.stopSpeaking();
                }
                setIsAudioMuted(!isAudioMuted);
              }}
              activeOpacity={0.75}
            >
              {isAudioMuted ? (
                <VolumeX size={16} color={COLORS.accentPink} strokeWidth={2.4} />
              ) : (
                <Volume2 size={16} color={COLORS.textMain} strokeWidth={2.2} />
              )}
            </TouchableOpacity>
          </View>

          {/* Voice Assistant Orb Visualizer */}
          <VoiceAssistantOrb
            assistantState={assistantState}
            onPressMic={handleToggleMic}
            isMuted={isAudioMuted}
            personality={personality}
            currentTranscript={liveTranscript}
          />

          {/* Quick Command Text Input Bar */}
          <View style={styles.commandInputRow}>
            <TextInput
              style={styles.commandInputField}
              value={textCommandInput}
              onChangeText={setTextCommandInput}
              placeholder={assistantState === 'listening' ? "Hearing your voice..." : "Type command or say Hey DAMN..."}
              placeholderTextColor={COLORS.textMuted}
              onSubmitEditing={() => handleExecuteCommand(textCommandInput)}
              returnKeyType="send"
            />
            {textCommandInput.trim().length > 0 && (
              <TouchableOpacity
                style={styles.commandSubmitBtn}
                onPress={() => handleExecuteCommand(textCommandInput)}
                activeOpacity={0.8}
              >
                <ArrowUp size={16} color="#FFFFFF" strokeWidth={3} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 3. Action Feedback Card (Shows executed command & spoken quote) */}
        {lastCommandResult && (
          <VoiceCommandCard
            result={lastCommandResult}
            onDismiss={() => setLastCommandResult(null)}
            onReplayVoice={(text) => {
              voiceService.speak(text, { personality });
            }}
            isSpeaking={assistantState === 'speaking'}
            onStopSpeaking={() => voiceService.stopSpeaking()}
          />
        )}

        {/* 4. Quick Voice Command Chips */}
        <VoiceActionChips onSelectCommand={(cmd) => handleExecuteCommand(cmd)} />

        {/* 4.1 SMART PERSONAL INTEL: ACTIVE ESCALATING REMINDERS */}
        {activeReminders.length > 0 && (
          <View style={styles.intelCardLavender}>
            <View style={styles.intelHeader}>
              <View style={styles.intelHeaderLeft}>
                <Bell size={16} color={COLORS.accentPurple} strokeWidth={2.4} />
                <Text style={styles.intelTitlePurple}>ACTIVE SMART REMINDERS</Text>
              </View>
              <View style={styles.intelBadgePurple}>
                <Text style={styles.intelBadgeTextPurple}>{activeReminders.length} ACTIVE</Text>
              </View>
            </View>

            {activeReminders.map((rem) => {
              const secondsLeft = Math.max(0, Math.round((rem.scheduledAt - Date.now()) / 1000));
              const minsLeft = Math.floor(secondsLeft / 60);
              const hrsLeft = Math.floor(minsLeft / 60);
              const displayTime =
                hrsLeft > 0 ? `${hrsLeft}h ${minsLeft % 60}m` : `${minsLeft}m ${secondsLeft % 60}s`;

              return (
                <View key={rem.id} style={styles.reminderRow}>
                  <View style={styles.reminderInfo}>
                    <Text style={styles.reminderTitle}>{rem.title}</Text>
                    <Text style={styles.reminderSubtitle}>
                      Due in {displayTime} • ⚡ 5m & 1m warnings armed
                    </Text>
                  </View>

                  {!rem.stage1MinAcknowledged ? (
                    <TouchableOpacity
                      style={styles.remAcknowledgeBtn}
                      onPress={() => reminderService.acknowledgeReminder(rem.id)}
                      activeOpacity={0.8}
                    >
                      <Check size={12} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.remAcknowledgeText}>React</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.remDoneBadge}>
                      <Text style={styles.remDoneText}>Reacted ✓</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 4.2 SMART PERSONAL INTEL: BUY LIST & 100M-300M GEOFENCE DEPARTURE */}
        {shoppingItems.filter((i) => !i.purchased).length > 0 && (
          <View style={styles.intelCardMint}>
            <View style={styles.intelHeader}>
              <View style={styles.intelHeaderLeft}>
                <ShoppingBag size={16} color={COLORS.accentGreen} strokeWidth={2.4} />
                <Text style={styles.intelTitleGreen}>BUY LIST & GEOFENCE ALERT</Text>
              </View>
              <View style={styles.intelBadgeGreen}>
                <Text style={styles.intelBadgeTextGreen}>100m–300m WINDOW</Text>
              </View>
            </View>

            <Text style={styles.geofenceSubtext}>
              {departureZone
                ? `📍 Present spot locked. Stepping 100m to 300m away triggers a push notification to grab these:`
                : `📍 Base spot ready. As you leave, DAMN will alert you to buy these:`}
            </Text>

            <View style={styles.shoppingItemsList}>
              {shoppingItems
                .filter((i) => !i.purchased)
                .map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.shoppingItemChip}
                    onPress={() => shoppingLocationService.togglePurchased(item.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.checkCircleSmall}>
                      <Check size={10} color="#141416" strokeWidth={3} />
                    </View>
                    <Text style={styles.shoppingItemText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            {/* Departure Simulator Test Button */}
            <TouchableOpacity
              style={styles.testDepartureBtn}
              onPress={() => {
                if (departureZone) {
                  const simLat = departureZone.baseLat + 0.0016;
                  shoppingLocationService.handleLocationUpdate(simLat, departureZone.baseLng);
                } else {
                  shoppingLocationService.captureBaseLocation();
                }
              }}
              activeOpacity={0.8}
            >
              <MapPin size={13} color="#065F46" />
              <Text style={styles.testDepartureText}>
                {departureZone?.departureAlertSent
                  ? 'Departure Alert Sent (150m Away) ✓'
                  : 'Test Departure Alert (Simulate 150m Step-Away)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 5. Assistant Quick Hub Bento Cards */}
        <View style={styles.assistantBentoRow}>
          {/* Personal Reminders & Radar Quick Card */}
          <TouchableOpacity
            style={styles.remindersQuickCard}
            onPress={() => setActiveTab('reminders')}
            activeOpacity={0.8}
          >
            <View style={styles.quickCardTop}>
              <Text style={styles.quickCardLabel}>MY REMINDERS</Text>
              <Bell size={16} color={COLORS.accentPurple} strokeWidth={2.4} />
            </View>
            <View>
              <Text style={styles.quickCardVal}>
                {activeReminders.length > 0 ? `${activeReminders.length} Active` : 'All Clear'}
              </Text>
              <Text style={styles.quickCardSub}>
                {shoppingItems.filter(i => !i.purchased).length > 0
                  ? `${shoppingItems.filter(i => !i.purchased).length} buy radar items`
                  : 'Tap to view alerts'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Family Hub & FAM Code Card */}
          <TouchableOpacity
            style={styles.familyQuickCard}
            onPress={() => setActiveTab('family')}
            activeOpacity={0.8}
          >
            <View style={styles.quickCardTop}>
              <Text style={styles.quickCardLabel}>FAMILY HUB</Text>
              <Users size={16} color="#059669" strokeWidth={2.4} />
            </View>
            <View>
              <Text style={styles.quickCardVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {familyData.famCode}
              </Text>
              <Text style={styles.quickCardStatusSub} numberOfLines={1}>
                {familyData.reminders.filter(r => !r.completed).length} Alerts • {familyData.shoppingItems.filter(i => !i.purchased).length} Shopping
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Spacing for floating dock */}
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
  mottoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardCream,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...SHADOWS.card,
  },
  bannerLeft: {
    flex: 1,
  },
  greeting: {
    fontFamily: FONTS.outfitBold,
    fontSize: 18,
    color: COLORS.textMain,
  },
  greetingName: {
    color: '#059669',
  },
  welcomeSubtitle: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  editBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  editBannerText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    color: COLORS.textMain,
  },

  // HERO VOICE CARD
  voiceHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.07)',
    ...SHADOWS.card,
  },
  voiceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 6,
  },
  wakeWordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  wakeWordBtnActive: {
    backgroundColor: '#E2F5E8',
    borderColor: '#20C997',
  },
  wakeWordDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
  },
  wakeWordDotActive: {
    backgroundColor: '#059669',
  },
  wakeWordText: {
    fontFamily: FONTS.outfitBold,
    fontSize: 9,
    color: COLORS.textSub,
    letterSpacing: 0.5,
  },
  wakeWordTextActive: {
    color: '#065F46',
  },
  personalityScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  personalityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#F3F4F6',
  },
  personalityBtnActive: {
    backgroundColor: '#141416',
  },
  personalityIcon: {
    fontSize: 11,
  },
  personalityLabel: {
    fontFamily: FONTS.outfitBold,
    fontSize: 10,
    color: COLORS.textSub,
  },
  personalityLabelActive: {
    color: '#FFFFFF',
  },
  muteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteBtnActive: {
    backgroundColor: '#FEE2E2',
  },
  commandInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF4E8',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  commandInputField: {
    flex: 1,
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.textMain,
    paddingVertical: 8,
  },
  commandSubmitBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commandMicBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  commandMicBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },

  // Assistant Quick Hub Bento Rows
  assistantBentoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  remindersQuickCard: {
    flex: 1,
    backgroundColor: COLORS.cardLavender,
    borderRadius: RADIUS.card,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 110,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...SHADOWS.card,
  },
  familyQuickCard: {
    flex: 1,
    backgroundColor: COLORS.cardMint,
    borderRadius: RADIUS.card,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 110,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...SHADOWS.card,
  },
  quickCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickCardLabel: {
    fontFamily: FONTS.outfitBold,
    fontSize: 10,
    letterSpacing: 1.1,
    color: COLORS.textSub,
  },
  quickCardVal: {
    fontFamily: FONTS.outfitBold,
    fontSize: 18,
    color: COLORS.textMain,
    letterSpacing: -0.2,
    marginTop: 6,
  },
  quickCardSub: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  quickCardStatusSub: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
  },
  floatingMascotPill: {
    position: 'absolute',
    bottom: 86,
    right: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#141416',
    zIndex: 90,
  },
  floatingMascotTextWrap: {
    alignItems: 'flex-start',
  },
  mascotPillTitle: {
    fontFamily: FONTS.outfitBold,
    fontSize: 11,
    color: '#141416',
    letterSpacing: 0.5,
  },
  mascotPillSub: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 9,
    color: COLORS.textMuted,
  },

  // Smart Personal Intel Cards
  intelCardLavender: {
    backgroundColor: COLORS.cardLavender,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...SHADOWS.card,
  },
  intelCardMint: {
    backgroundColor: COLORS.cardMint,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...SHADOWS.card,
  },
  intelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  intelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  intelTitlePurple: {
    fontFamily: FONTS.outfitBold,
    fontSize: 11,
    letterSpacing: 1.1,
    color: COLORS.accentPurple,
  },
  intelTitleGreen: {
    fontFamily: FONTS.outfitBold,
    fontSize: 11,
    letterSpacing: 1.1,
    color: '#059669',
  },
  intelBadgePurple: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  intelBadgeTextPurple: {
    fontFamily: FONTS.outfitBold,
    fontSize: 9,
    color: COLORS.accentPurple,
  },
  intelBadgeGreen: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  intelBadgeTextGreen: {
    fontFamily: FONTS.outfitBold,
    fontSize: 9,
    color: '#059669',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  reminderInfo: {
    flex: 1,
    marginRight: 8,
  },
  reminderTitle: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 13,
    color: COLORS.textMain,
  },
  reminderSubtitle: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  remAcknowledgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#141416',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  remAcknowledgeText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  remDoneBadge: {
    backgroundColor: '#E2F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  remDoneText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 10,
    color: '#059669',
  },
  geofenceSubtext: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    color: '#065F46',
    marginBottom: 8,
    lineHeight: 16,
  },
  shoppingItemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  shoppingItemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  checkCircleSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.2,
    borderColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shoppingItemText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    color: COLORS.textMain,
  },
  testDepartureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  testDepartureText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 11,
    color: '#065F46',
  },
});
