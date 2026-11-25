import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Users, Key, UserPlus, Copy, Flame, ChevronRight, LogOut, ShieldCheck, Trophy, Check } from 'lucide-react-native';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';
import { HeaderBar } from '../components/HeaderBar';

export const SquadScreen: React.FC = () => {
  const { state, joinSquad, leaveSquad, setActiveSquad, openModal } = useApp();
  const { user, squadMembers } = state;

  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const myCode = user.mySquadCode || user.squadCode || 'DAMN-8K2P91';
  const joinedSquads = user.joinedSquads && user.joinedSquads.length > 0 ? user.joinedSquads : [myCode];
  const activeSquad = user.squadCode || myCode;
  const isOwnerOfActive = activeSquad === myCode;

  const handleCopyCode = async (codeToCopy: string) => {
    try {
      await Clipboard.setStringAsync(codeToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const handleJoin = async () => {
    if (!inputCode.trim()) {
      Alert.alert('Empty Code', 'Please enter a squad code to join (e.g. DAMN-XXXXXX).');
      return;
    }

    setIsJoining(true);
    try {
      const res = await joinSquad(inputCode.trim());
      if (res.success) {
        Alert.alert('Squad Joined!', res.message);
        setInputCode('');
      } else {
        Alert.alert('Unable to Join Squad', res.message);
      }
    } catch (err: any) {
      Alert.alert('Join Error', err?.message || 'Something went wrong joining squad.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = (codeToLeave: string) => {
    Alert.alert(
      'Leave Squad?',
      `Are you sure you want to leave squad ${codeToLeave}? You can rejoin anytime if the squad is not full (Max 20 members).`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave Squad', 
          style: 'destructive',
          onPress: async () => {
            const res = await leaveSquad(codeToLeave);
            Alert.alert('Squad Left', res.message);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Squad Hub</Text>
          <Text style={styles.pageSub}>Connect with your gym bros & track discipline progress together (Max 20/squad)</Text>
        </View>

        {/* Card 1: User's Unique Personal Squad ID */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.iconCirclePurple}>
                <Key size={16} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Your Unique Squad ID</Text>
                <Text style={styles.cardHelper}>Share with up to 20 gym bros</Text>
              </View>
            </View>
            <View style={styles.yourCodePill}>
              <ShieldCheck size={12} color="#059669" />
              <Text style={styles.yourCodeText}>Owner</Text>
            </View>
          </View>

          <View style={styles.codeBox}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.codeLabel}>PRIMARY SQUAD CODE</Text>
              <Text style={styles.codeText} numberOfLines={1} adjustsFontSizeToFit>{myCode}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.copyBtn, copied && styles.copyBtnSuccess]} 
              onPress={() => handleCopyCode(myCode)} 
              activeOpacity={0.8}
            >
              {copied ? (
                <>
                  <Check size={13} color="#FFFFFF" strokeWidth={3} />
                  <Text style={styles.copyBtnText}>Copied!</Text>
                </>
              ) : (
                <>
                  <Copy size={13} color="#FFFFFF" />
                  <Text style={styles.copyBtnText}>Copy Code</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 2: Your Joined Squads (Max 5) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.iconCircleBlue}>
                <Users size={16} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Joined Squads</Text>
                <Text style={styles.cardHelper}>Active squad switcher</Text>
              </View>
            </View>
            <View style={[styles.countPill, joinedSquads.length >= 5 && styles.countPillMax]}>
              <Text style={[styles.countText, joinedSquads.length >= 5 && styles.countTextMax]}>
                {joinedSquads.length} / 5 Max
              </Text>
            </View>
          </View>

          {/* Squad Pill Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.squadTabsScroll}>
            {joinedSquads.map((sqCode) => {
              const isActive = sqCode === activeSquad;
              const isOwner = sqCode === myCode;

              return (
                <TouchableOpacity
                  key={sqCode}
                  style={[styles.squadTabItem, isActive && styles.squadTabItemActive]}
                  onPress={() => setActiveSquad(sqCode)}
                  activeOpacity={0.8}
                >
                  <View style={styles.squadTabTop}>
                    <Text style={[styles.squadTabCode, isActive && styles.squadTabCodeActive]}>
                      {sqCode}
                    </Text>
                    {isOwner ? (
                      <View style={styles.ownerTinyPill}>
                        <Text style={styles.ownerTinyText}>Owner</Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => handleLeave(sqCode)} 
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <LogOut size={12} color={isActive ? "#EF4444" : "#9CA3AF"} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={[styles.squadTabStatus, isActive && styles.squadTabStatusActive]}>
                    {isActive ? '● Active' : 'Tap to View'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Card 3: Join a Friend's Squad */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.iconCircleGreen}>
                <UserPlus size={16} color="#059669" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Join a Friend's Squad</Text>
                <Text style={styles.cardHelper}>Enter code (Max 20 members/squad)</Text>
              </View>
            </View>
          </View>

          <View style={styles.joinRow}>
            <TextInput
              style={styles.joinInput}
              value={inputCode}
              onChangeText={setInputCode}
              placeholder="e.g. DAMN-7X91K2"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              editable={!isJoining && joinedSquads.length < 5}
            />
            <TouchableOpacity 
              style={[styles.joinBtn, (isJoining || joinedSquads.length >= 5) && styles.joinBtnDisabled]} 
              onPress={handleJoin} 
              activeOpacity={0.8}
              disabled={isJoining || joinedSquads.length >= 5}
            >
              <Text style={styles.joinBtnText}>{isJoining ? 'Joining...' : 'Join Squad'}</Text>
            </TouchableOpacity>
          </View>
          {joinedSquads.length >= 5 && (
            <Text style={styles.limitWarningText}>
              ⚠️ You have joined the maximum of 5 squads. Leave a squad above to join a new one.
            </Text>
          )}
        </View>

        {/* Card 4: Active Squad Leaderboard */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.iconCircleAmber}>
                <Trophy size={16} color="#D97706" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Squad Leaderboard</Text>
                <Text style={styles.cardHelper}>{squadMembers.length} / 20 Members</Text>
              </View>
            </View>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>Live Sync</Text>
            </View>
          </View>

          {/* Empty State vs Member List */}
          {squadMembers.length === 0 ? (
            <View style={styles.emptySquadBox}>
              <View style={styles.emptyIconCircle}>
                <Users size={26} color="#7C3AED" />
              </View>
              <Text style={styles.emptySquadTitle}>Squad is Currently Empty</Text>
              <Text style={styles.emptySquadDesc}>
                {isOwnerOfActive
                  ? `No friends have joined your squad yet! Share your code ${myCode} with your gym bros to compete together (Max 20 members).`
                  : `No other members have synced in squad ${activeSquad} yet. Complete your daily tasks to claim #1 rank!`}
              </Text>

              {isOwnerOfActive && (
                <TouchableOpacity 
                  style={[styles.emptyCopyBtn, copied && styles.emptyCopyBtnSuccess]} 
                  onPress={() => handleCopyCode(myCode)} 
                  activeOpacity={0.85}
                >
                  {copied ? (
                    <>
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      <Text style={styles.emptyCopyBtnTextSuccess}>Copied to Clipboard!</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={14} color="#FFFFFF" />
                      <Text style={styles.emptyCopyBtnText}>Copy Squad Code</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.membersList}>
              {squadMembers.map((member, idx) => (
                <TouchableOpacity
                  key={member.uid || idx}
                  style={styles.memberRow}
                  onPress={() => openModal('member_profile', member)}
                  activeOpacity={0.7}
                >
                  <View style={styles.memberLeft}>
                    <View style={[styles.rankBadge, idx === 0 && styles.rankBadgeTop]}>
                      <Text style={[styles.rankNum, idx === 0 && styles.rankNumTop]}>#{idx + 1}</Text>
                    </View>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{member.avatarText || member.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                      <Text style={styles.memberRankTitle}>{member.rank}</Text>
                    </View>
                  </View>

                  <View style={styles.memberRight}>
                    <View style={styles.streakBadge}>
                      <Flame size={12} color="#D97706" />
                      <Text style={styles.streakVal}>{member.streak || 0}d</Text>
                    </View>
                    <View style={styles.execBadge}>
                      <Text style={styles.execVal}>{member.executionPct || 0}%</Text>
                    </View>
                    <ChevronRight size={15} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Extra spacing for dock */}
        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F5',
  },
  scrollContent: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 14,
  },
  pageTitle: {
    fontFamily: FONTS.headingBlack,
    fontSize: 22,
    fontWeight: '900',
    color: '#141416',
  },
  pageSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECECE8',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconCirclePurple: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleBlue: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleGreen: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleAmber: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    fontWeight: '800',
    color: '#141416',
  },
  cardHelper: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#141416',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  copyBtnSuccess: {
    backgroundColor: '#059669',
  },
  copyBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  codeBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ECECE8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  codeLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  codeText: {
    fontFamily: FONTS.headingBlack,
    fontSize: 19,
    fontWeight: '900',
    color: '#141416',
    letterSpacing: 1.2,
  },
  yourCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
  },
  yourCodeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  countPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
  },
  countPillMax: {
    backgroundColor: '#FEE2E2',
  },
  countText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0284C7',
  },
  countTextMax: {
    color: '#DC2626',
  },
  squadTabsScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  squadTabItem: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#ECECE8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 135,
  },
  squadTabItemActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#141416',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  squadTabTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  squadTabCode: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    fontWeight: '800',
    color: '#4B5563',
  },
  squadTabCodeActive: {
    color: '#141416',
  },
  ownerTinyPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ownerTinyText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  squadTabStatus: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10.5,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  squadTabStatusActive: {
    color: '#059669',
    fontWeight: '700',
  },
  joinRow: {
    flexDirection: 'row',
    gap: 10,
  },
  joinInput: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    fontWeight: '700',
    color: '#141416',
    borderWidth: 1,
    borderColor: '#ECECE8',
  },
  joinBtn: {
    backgroundColor: '#141416',
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnDisabled: {
    opacity: 0.5,
  },
  joinBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  limitWarningText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 8,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  livePillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  emptySquadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
    backgroundColor: '#FAF8F5',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECECE8',
  },
  emptyIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptySquadTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 15.5,
    fontWeight: '800',
    color: '#141416',
    marginBottom: 5,
  },
  emptySquadDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 290,
    marginBottom: 14,
  },
  emptyCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#141416',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCopyBtnSuccess: {
    backgroundColor: '#059669',
  },
  emptyCopyBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyCopyBtnTextSuccess: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  membersList: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECECE8',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: {
    backgroundColor: '#FEF3C7',
  },
  rankNum: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
  },
  rankNumTop: {
    color: '#D97706',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '700',
    color: '#141416',
  },
  memberRankTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  streakVal: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  execBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  execVal: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
});
