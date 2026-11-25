import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Flame, Zap, Shield, Target } from 'lucide-react-native';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';
import { SquadMember } from '../types';

export const MemberProfileModal: React.FC = () => {
  const { activeModal, modalPayload, closeModal } = useApp();
  const isOpen = activeModal === 'member_profile';

  if (!isOpen || !modalPayload) return null;

  const member: SquadMember = modalPayload;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={closeModal}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Warrior Profile</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <X size={18} color="#787A82" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Avatar & Name */}
            <View style={styles.profileHero}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.avatarText || member.name.charAt(0)}</Text>
              </View>
              <Text style={styles.memberName}>{member.name}</Text>
              <View style={styles.rankPill}>
                <Text style={styles.rankText}>{member.rank}</Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: '#FFF8E1' }]}>
                <Flame size={16} color="#D97706" />
                <Text style={[styles.statVal, { color: '#D97706' }]}>{member.streak}d</Text>
                <Text style={styles.statLabel}>STREAK</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#E2F5E8' }]}>
                <Zap size={16} color="#059669" />
                <Text style={[styles.statVal, { color: '#059669' }]}>{member.executionPct}%</Text>
                <Text style={styles.statLabel}>EXECUTION</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#EDE7F6' }]}>
                <Shield size={16} color="#7C3AED" />
                <Text style={[styles.statVal, { color: '#7C3AED' }]}>{member.xp || 0}</Text>
                <Text style={styles.statLabel}>TOTAL XP</Text>
              </View>
            </View>

            {/* Protocol Details */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Target size={14} color="#059669" />
                <Text style={styles.cardRowTitle}>Goal Protocol</Text>
              </View>
              <Text style={styles.cardRowVal}>{member.fitnessGoal || 'Discipline & Hypertrophy Lock-In'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardRowTitle}>Protocol Duration</Text>
              <Text style={styles.cardRowVal}>{member.lockInDays || 60} Days Challenge</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '75%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#ECECE8',
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  profileHero: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontFamily: FONTS.headingBlack,
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  memberName: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
    fontWeight: '800',
    color: '#141416',
    marginBottom: 4,
  },
  rankPill: {
    backgroundColor: '#F0EDFF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rankText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 3,
  },
  statVal: {
    fontFamily: FONTS.monoNumbers,
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8,
    fontWeight: '800',
    color: '#787A82',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FAF9F6',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEFEA',
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardRowTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
    color: '#787A82',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardRowVal: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: '#141416',
    marginTop: 2,
  },
});
