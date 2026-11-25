import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Clock, 
  Zap, 
  Droplet, 
  Footprints, 
  Sparkles, 
  Flame, 
  Smile, 
  Compass, 
  X,
  Play,
  Pause,
  RotateCcw,
  Bell,
  ShoppingBag,
  MapPin,
  Check
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { CommandResult } from '../services/assistantCommands';
import { reminderService } from '../services/reminderService';
import { shoppingLocationService } from '../services/shoppingLocationService';

interface VoiceCommandCardProps {
  result: CommandResult;
  onDismiss: () => void;
  onReplayVoice: (text: string) => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export const VoiceCommandCard: React.FC<VoiceCommandCardProps> = ({
  result,
  onDismiss,
  onReplayVoice,
  isSpeaking,
  onStopSpeaking,
}) => {
  // Timer state if command set a timer
  const [timerLeft, setTimerLeft] = useState<number | null>(result.timerSeconds || null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [reminderAcknowledged, setReminderAcknowledged] = useState<boolean>(false);
  const [simulatedDepartureTriggered, setSimulatedDepartureTriggered] = useState<boolean>(false);

  useEffect(() => {
    if (result.timerSeconds) {
      setTimerLeft(result.timerSeconds);
      setIsTimerRunning(true);
    }
  }, [result.timerSeconds]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerLeft !== null && timerLeft > 0) {
      interval = setInterval(() => {
        setTimerLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerLeft]);

  // Pick card styling based on actionType
  let cardBg = COLORS.cardCream;
  let accentColor = COLORS.textMain;
  let IconComponent = CheckCircle2;

  switch (result.actionType) {
    case 'smart_reminder':
      cardBg = COLORS.cardLavender;
      accentColor = COLORS.accentPurple;
      IconComponent = Bell;
      break;
    case 'shopping_list':
      cardBg = COLORS.cardMint;
      accentColor = COLORS.accentGreen;
      IconComponent = ShoppingBag;
      break;
    case 'task_add':
    case 'task_complete':
    case 'task_query':
      cardBg = COLORS.cardYellowLight;
      accentColor = COLORS.accentYellow;
      IconComponent = CheckCircle2;
      break;
    case 'timer':
      cardBg = COLORS.cardLavender;
      accentColor = COLORS.accentPurple;
      IconComponent = Clock;
      break;
    case 'hype':
      cardBg = '#FEF3C7';
      accentColor = '#D97706';
      IconComponent = Flame;
      break;
    case 'roast':
      cardBg = '#FEE2E2';
      accentColor = '#DC2626';
      IconComponent = Flame;
      break;
    case 'joke':
      cardBg = COLORS.cardPeach;
      accentColor = COLORS.accentOrange;
      IconComponent = Smile;
      break;
    case 'navigation':
      cardBg = COLORS.cardMint;
      accentColor = COLORS.accentGreen;
      IconComponent = Compass;
      break;
    default:
      cardBg = COLORS.cardWhite;
      accentColor = COLORS.textMain;
      IconComponent = Sparkles;
      break;
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.titleWithIcon}>
          <View style={[styles.iconBadge, { backgroundColor: '#FFFFFF' }]}>
            <IconComponent size={16} color={accentColor} strokeWidth={2.4} />
          </View>
          <Text style={styles.titleText}>{result.title}</Text>
        </View>

        <View style={styles.actionBtns}>
          <TouchableOpacity
            style={styles.speakerBtn}
            onPress={() => {
              if (isSpeaking) {
                onStopSpeaking();
              } else {
                onReplayVoice(result.spokenResponse);
              }
            }}
            activeOpacity={0.7}
          >
            {isSpeaking ? (
              <VolumeX size={16} color={COLORS.accentPink} strokeWidth={2.4} />
            ) : (
              <Volume2 size={16} color={COLORS.textMain} strokeWidth={2.2} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onDismiss} activeOpacity={0.7}>
            <X size={15} color={COLORS.textMuted} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Detail Text */}
      {result.detail ? <Text style={styles.detailText}>{result.detail}</Text> : null}

      {/* Spoken Response Quote */}
      <View style={styles.spokenQuoteBox}>
        <Text style={styles.spokenQuoteText}>"{result.spokenResponse}"</Text>
      </View>

      {/* SMART ESCALATING REMINDER WIDGET */}
      {result.actionType === 'smart_reminder' && (
        <View style={styles.escalatingWidget}>
          <View style={styles.escalationStagesRow}>
            <View style={styles.stageCapsule}>
              <Text style={styles.stageNumber}>1</Text>
              <Text style={styles.stageLabel}>5m Heads-Up</Text>
            </View>
            <Text style={styles.stageArrow}>→</Text>
            <View style={[styles.stageCapsule, reminderAcknowledged && styles.stageCapsuleSuccess]}>
              <Text style={styles.stageNumber}>2</Text>
              <Text style={styles.stageLabel}>
                {reminderAcknowledged ? '1m Reacted ✓' : '1m Reaction'}
              </Text>
            </View>
            <Text style={styles.stageArrow}>→</Text>
            <View style={styles.stageCapsule}>
              <Text style={styles.stageNumber}>3</Text>
              <Text style={styles.stageLabel}>
                {reminderAcknowledged ? 'On-Time Ping' : 'Voice Wake-Up'}
              </Text>
            </View>
          </View>

          {/* Reaction Simulator Button */}
          {!reminderAcknowledged ? (
            <TouchableOpacity
              style={styles.acknowledgeBtn}
              onPress={() => {
                setReminderAcknowledged(true);
                if (result.data?.id) {
                  reminderService.acknowledgeReminder(result.data.id);
                }
              }}
              activeOpacity={0.8}
            >
              <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.acknowledgeBtnText}>Acknowledge 1-Min Warning Now</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.acknowledgedBanner}>
              <Check size={14} color="#059669" strokeWidth={2.5} />
              <Text style={styles.acknowledgedText}>
                Warning acknowledged! On-time ping will arrive at exact time.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* SMART SHOPPING LIST & 100M-300M GEOFENCE WIDGET */}
      {result.actionType === 'shopping_list' && (
        <View style={styles.shoppingWidget}>
          <View style={styles.geofenceRow}>
            <MapPin size={16} color={COLORS.accentGreen} strokeWidth={2.4} />
            <Text style={styles.geofenceText}>
              Departure Radius: 100m – 300m from present spot
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.simulateDepartureBtn,
              simulatedDepartureTriggered && styles.simulateDepartureBtnActive,
            ]}
            onPress={() => {
              setSimulatedDepartureTriggered(true);
              const zone = shoppingLocationService.getDepartureZone();
              if (zone) {
                // Simulate moving 180 meters away from base location (within 100-300m window)
                const simLat = zone.baseLat + 0.0016; // approx 180m north
                const simLng = zone.baseLng;
                shoppingLocationService.handleLocationUpdate(simLat, simLng);
              }
            }}
            activeOpacity={0.8}
          >
            <MapPin size={14} color={simulatedDepartureTriggered ? '#059669' : '#141416'} />
            <Text
              style={[
                styles.simulateDepartureText,
                simulatedDepartureTriggered && styles.simulateDepartureTextActive,
              ]}
            >
              {simulatedDepartureTriggered
                ? 'Departure Alert Fired (180m Away) ✓'
                : 'Simulate Stepping 150m Away (Test Alert)'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Interactive Timer Widget if active */}
      {timerLeft !== null && (
        <View style={styles.timerWidget}>
          <View style={styles.timerDisplayRow}>
            <Clock size={18} color={COLORS.accentPurple} strokeWidth={2.2} />
            <Text style={styles.timerDigits}>
              {timerLeft === 0 ? 'TIME EXPIRED! 🔥' : formatTimer(timerLeft)}
            </Text>
          </View>

          <View style={styles.timerControls}>
            {timerLeft > 0 ? (
              <TouchableOpacity
                style={styles.timerControlBtn}
                onPress={() => setIsTimerRunning(!isTimerRunning)}
                activeOpacity={0.75}
              >
                {isTimerRunning ? (
                  <Pause size={14} color="#141416" />
                ) : (
                  <Play size={14} color="#141416" />
                )}
                <Text style={styles.timerControlText}>{isTimerRunning ? 'Pause' : 'Resume'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.timerControlBtn}
                onPress={() => {
                  setTimerLeft(result.timerSeconds || 300);
                  setIsTimerRunning(true);
                }}
                activeOpacity={0.75}
              >
                <RotateCcw size={14} color="#141416" />
                <Text style={styles.timerControlText}>Restart</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.card,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  titleText: {
    fontFamily: FONTS.outfitBold,
    fontSize: 14,
    color: COLORS.textMain,
    letterSpacing: 0.3,
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speakerBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: RADIUS.pill,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: RADIUS.pill,
  },
  detailText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 13,
    color: COLORS.textSub,
    marginBottom: 8,
  },
  spokenQuoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.textMain,
  },
  spokenQuoteText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    color: COLORS.textMain,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  escalatingWidget: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  escalationStagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stageCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  stageCapsuleSuccess: {
    backgroundColor: '#E2F5E8',
  },
  stageNumber: {
    fontFamily: FONTS.outfitBold,
    fontSize: 10,
    color: COLORS.textMain,
  },
  stageLabel: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 10,
    color: COLORS.textSub,
  },
  stageArrow: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  acknowledgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#141416',
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
  },
  acknowledgeBtnText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  acknowledgedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
  },
  acknowledgedText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    color: '#059669',
  },
  shoppingWidget: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  geofenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  geofenceText: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 11,
    color: '#065F46',
  },
  simulateDepartureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FAF4E8',
    borderRadius: RADIUS.pill,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  simulateDepartureBtnActive: {
    backgroundColor: '#E2F5E8',
    borderColor: '#20C997',
  },
  simulateDepartureText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 11,
    color: COLORS.textMain,
  },
  simulateDepartureTextActive: {
    color: '#065F46',
  },
  timerWidget: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  timerDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerDigits: {
    fontFamily: FONTS.outfitBold,
    fontSize: 16,
    color: COLORS.accentPurple,
    letterSpacing: 1,
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  timerControlText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 11,
    color: '#141416',
  },
});
