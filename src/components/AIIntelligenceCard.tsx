import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, ArrowRight, BrainCircuit, ShieldAlert, CheckCircle2 } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';
import { calculateExecutionPct } from '../services/storage';

export const AIIntelligenceCard: React.FC = () => {
  const { state, openModal } = useApp();
  const { user, dailyTasks } = state;

  const todayPct = calculateExecutionPct(dailyTasks);
  const now = new Date();
  const hour = now.getHours();

  // Smart Context-Aware Perception Engine
  let headline = "ALL SYSTEMS GO";
  let insight = "Your protocol execution is on track. Keep your momentum high.";
  let badgeText = "OPTIMAL";
  let badgeBg = "#ECFDF5";
  let badgeColor = "#059669";
  let IconComponent = Sparkles;

  const waterDeficit = Math.max(0, user.waterGoalMl - user.waterCurrentMl);
  const waterPct = user.waterGoalMl > 0 ? Math.round((user.waterCurrentMl / user.waterGoalMl) * 100) : 0;

  if (hour < 12) {
    if (user.waterCurrentMl < 500) {
      headline = "HYDRATION DEFICIT DETECTED";
      insight = `You only drank ${user.waterCurrentMl}ml this morning. Chug 500ml now to ignite metabolic rate.`;
      badgeText = "ACTION NEEDED";
      badgeBg = "#FFFBEB";
      badgeColor = "#D97706";
      IconComponent = ShieldAlert;
    } else {
      headline = "MORNING DISCIPLINE LOCKED";
      insight = `${user.name || 'Friend'}, great start! Move to your key daily priorities and stay hydrated.`;
      badgeText = "HIGH VELOCITY";
    }
  } else if (hour >= 12 && hour < 18) {
    if (todayPct < 40) {
      headline = "MIDDAY PROTOCOL SLOWDOWN";
      insight = `Execution is at ${todayPct}%. Knock out your key afternoon tasks and check your smart reminders.`;
      badgeText = "ATTENTION";
      badgeBg = "#FFFBEB";
      badgeColor = "#D97706";
      IconComponent = ShieldAlert;
    } else {
      headline = "PEAK FOCUS WINDOW";
      insight = `You're at ${todayPct}% completion with ${user.currentStreak}-day streak active. Keep dominating.`;
      badgeText = "STRONG";
    }
  } else {
    if (todayPct >= 90) {
      headline = "PROTOCOL CONQUERED";
      insight = `Sensational execution today! Day ${user.dayCurrent} locked in with full recovery readiness.`;
      badgeText = "ELITE";
      badgeBg = "#F5F3FF";
      badgeColor = "#7C3AED";
      IconComponent = CheckCircle2;
    } else {
      headline = "EVENING ROLLOVER WARNING";
      insight = `Day closes at 11:59 PM. Finish remaining checklist items to protect your streak and claim XP.`;
      badgeText = "LOCK IN NOW";
      badgeBg = "#FEF2F2";
      badgeColor = "#EF4444";
      IconComponent = ShieldAlert;
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.aiTagRow}>
          <BrainCircuit size={16} color="#059669" strokeWidth={2.2} />
          <Text style={styles.aiTag}>DAMN INTEL</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.statusText, { color: badgeColor }]}>{badgeText}</Text>
        </View>
      </View>

      <Text style={styles.headlineText}>{headline}</Text>
      <Text style={styles.insightText}>{insight}</Text>

      {/* Interactive Action Row */}
      <TouchableOpacity 
        style={styles.actionBtn}
        onPress={() => openModal('ai_chat')}
        activeOpacity={0.8}
      >
        <Text style={styles.actionBtnText}>Consult AI Coach</Text>
        <ArrowRight size={14} color="#141416" strokeWidth={2.4} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.07)',
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTag: {
    fontFamily: FONTS.headingBold,
    fontSize: 11,
    color: '#059669',
    letterSpacing: 0.8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: FONTS.headingBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  headlineText: {
    fontFamily: FONTS.headingBlack,
    fontSize: 15,
    color: '#141416',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  insightText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: '#52525B',
    lineHeight: 19,
    marginBottom: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: 12,
    color: '#141416',
    letterSpacing: 0.3,
  },
});
