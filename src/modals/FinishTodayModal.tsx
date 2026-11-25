import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { X, Lock, Flame } from 'lucide-react-native';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';
import { calculateExecutionPct, calculateRecoveryScore } from '../services/storage';

export const FinishTodayModal: React.FC = () => {
  const { activeModal, closeModal, state, advanceDay } = useApp();
  const isOpen = activeModal === 'finish';

  const { dailyTasks, user } = state;
  const execPct = calculateExecutionPct(dailyTasks);
  const recScore = calculateRecoveryScore(execPct, user.waterCurrentMl, user.waterGoalMl);

  const isDayWon = execPct >= 70;

  const handleConfirm = () => {
    advanceDay();
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closeModal}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Lock size={15} color="#059669" strokeWidth={2.5} />
              </View>
              <Text style={styles.title}>Lock In Day {user.dayCurrent}</Text>
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <X size={18} color="#787A82" />
            </TouchableOpacity>
          </View>

          {/* Performance Summary Cards */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: '#E8F7EE', borderColor: '#C3E8D0' }]}>
              <Text style={[styles.statLabel, { color: '#065F46' }]}>EXECUTION</Text>
              <Text style={[styles.statVal, { color: '#059669' }]}>{execPct}%</Text>
              <Text style={[styles.statNote, { color: '#047857' }]}>
                {isDayWon ? 'Streak Preserved 🔥' : 'Streak Broken ⚠️'}
              </Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: '#F0EDFF', borderColor: '#DDD3FE' }]}>
              <Text style={[styles.statLabel, { color: '#5B21B6' }]}>RECOVERY</Text>
              <Text style={[styles.statVal, { color: '#7C3AED' }]}>{recScore}</Text>
              <Text style={[styles.statNote, { color: '#6D28D9' }]}>Optimal state</Text>
            </View>
          </View>

          {/* Streak Status Pill */}
          <View style={styles.streakStatus}>
            <Flame size={18} color="#D97706" />
            <Text style={styles.streakStatusText}>
              {isDayWon 
                ? `Day ${user.dayCurrent} Won! Advancing streak to ${user.currentStreak + 1} days`
                : `Execution under 70%. Streak resets to 0. Tomorrow we bounce back!`}
            </Text>
          </View>

          <Text style={styles.confirmSub}>
            Completing today will log your results to your permanent history and reset daily tasks for Day {user.dayCurrent + 1}.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.confirmText}>Advance to Day {user.dayCurrent + 1}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: '#ECECE8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#E8F7EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    fontWeight: '800',
    color: '#141416',
  },
  closeBtn: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  statVal: {
    fontFamily: FONTS.monoNumbers,
    fontSize: 24,
    fontWeight: '900',
  },
  statNote: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  streakStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8,
    marginBottom: 14,
  },
  streakStatusText: {
    flex: 1,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    lineHeight: 16,
  },
  confirmSub: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 11,
    color: '#787A82',
    lineHeight: 16,
    marginBottom: 18,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F4F4F0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '700',
    color: '#4B4D54',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#141416',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
