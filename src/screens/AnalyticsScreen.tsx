import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LogOut, Calendar, Bell, ShoppingBag, Users, Heart } from 'lucide-react-native';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';
import { HeaderBar } from '../components/HeaderBar';
import { reminderService } from '../services/reminderService';
import { shoppingLocationService } from '../services/shoppingLocationService';
import { familyService } from '../services/familyService';

export const AnalyticsScreen: React.FC = () => {
  const { handleLogout, setActiveTab } = useApp();

  const reminders = reminderService.getReminders();
  const activeRemindersCount = reminders.filter(r => !r.completed).length;
  const shoppingItems = shoppingLocationService.getItems();
  const pendingItemsCount = shoppingItems.filter(i => !i.purchased).length;

  const familyState = familyService.getState();
  const familyRemindersCount = familyState.reminders.filter(r => !r.completed).length;
  const familyShoppingCount = familyState.shoppingItems.filter(i => !i.purchased).length;

  return (
    <View style={styles.container}>
      <HeaderBar />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Assistant &amp; Family Overview</Text>
            <Text style={styles.pageSub}>Personal reminders, shared family errands &amp; radar</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <LogOut size={13} color="#DC2626" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* 2x2 Bento Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Row 1: Reminders & Radar */}
          <View style={styles.metricsRow}>
            {/* Reminders Card */}
            <TouchableOpacity 
              style={[styles.metricCard, { backgroundColor: '#F0EDFF', borderColor: '#DDD3FE' }]}
              onPress={() => setActiveTab('reminders')}
              activeOpacity={0.8}
            >
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#EDE9FE' }]}>
                  <Bell size={13} color="#7C3AED" />
                </View>
                <Text style={[styles.metricLabel, { color: '#5B21B6' }]}>MY REMINDERS</Text>
              </View>
              <Text style={[styles.metricVal, { color: '#7C3AED' }]}>{activeRemindersCount}</Text>
              <Text style={[styles.metricSub, { color: '#6D28D9' }]}>
                {activeRemindersCount === 1 ? '1 active alert' : `${activeRemindersCount} active alerts`}
              </Text>
            </TouchableOpacity>

            {/* Radar / Shopping Card */}
            <TouchableOpacity 
              style={[styles.metricCard, { backgroundColor: '#E8F7EE', borderColor: '#C3E8D0' }]}
              onPress={() => setActiveTab('reminders')}
              activeOpacity={0.8}
            >
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#D1FAE5' }]}>
                  <ShoppingBag size={13} color="#059669" />
                </View>
                <Text style={[styles.metricLabel, { color: '#065F46' }]}>BUY RADAR</Text>
              </View>
              <Text style={[styles.metricVal, { color: '#059669' }]}>{pendingItemsCount}</Text>
              <Text style={[styles.metricSub, { color: '#047857' }]}>
                {pendingItemsCount === 1 ? '1 item on buy list' : `${pendingItemsCount} items on buy list`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Family Circle & Family Shopping */}
          <View style={styles.metricsRow}>
            {/* Family Circle Card */}
            <TouchableOpacity 
              style={[styles.metricCard, { backgroundColor: '#FFF4E5', borderColor: '#FDE68A' }]}
              onPress={() => setActiveTab('family')}
              activeOpacity={0.8}
            >
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Users size={13} color="#D97706" />
                </View>
                <Text style={[styles.metricLabel, { color: '#92400E' }]}>FAMILY CIRCLE</Text>
              </View>
              <Text style={[styles.metricVal, { color: '#D97706' }]}>{familyState.members.length}</Text>
              <Text style={[styles.metricSub, { color: '#B45309' }]}>
                {familyState.famCode}
              </Text>
            </TouchableOpacity>

            {/* Family Shopping Card */}
            <TouchableOpacity 
              style={[styles.metricCard, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]}
              onPress={() => setActiveTab('family')}
              activeOpacity={0.8}
            >
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#BAE6FD' }]}>
                  <Heart size={13} color="#0284C7" />
                </View>
                <Text style={[styles.metricLabel, { color: '#075985' }]}>FAMILY ERRANDS</Text>
              </View>
              <Text style={[styles.metricVal, { color: '#0284C7' }]}>{familyShoppingCount}</Text>
              <Text style={[styles.metricSub, { color: '#0369A1' }]}>
                {familyShoppingCount === 1 ? '1 item needed' : `${familyShoppingCount} items needed`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reminders & Errands Overview Card */}
        <View style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.iconCircle}>
                <Calendar size={14} color="#059669" />
              </View>
              <Text style={styles.cardTitle}>Recent Reminders Log</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{reminders.length} Total</Text>
            </View>
          </View>

          {reminders.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>
                No reminders created yet. Use voice command "Remind me in 2 hours to..." or open the Reminders tab to add your first reminder!
              </Text>
            </View>
          ) : (
            reminders.slice(0, 5).map((rem) => {
              const dateStr = new Date(rem.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <View key={rem.id} style={styles.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={[styles.tdText, { fontWeight: '700' }]} numberOfLines={1}>
                      {rem.title}
                    </Text>
                    <Text style={styles.tdSubText}>Scheduled: {dateStr}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View style={[styles.statusBadge, rem.completed ? styles.statusDone : styles.statusPending]}>
                      <Text style={[styles.statusBadgeText, rem.completed ? styles.statusDoneText : styles.statusPendingText]}>
                        {rem.completed ? 'Completed' : 'Armed'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  logoutText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  metricsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metricVal: {
    fontFamily: FONTS.monoNumbers,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  metricSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECECE8',
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
  cardTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    fontWeight: '800',
    color: '#141416',
  },
  pill: {
    backgroundColor: '#F0F0EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0EB',
    marginBottom: 4,
  },
  thText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    color: '#787A82',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F6',
  },
  tdText: {
    fontFamily: FONTS.monoNumbers,
    fontSize: 12,
    color: '#141416',
  },
  tdSubText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: '#6B7280',
  },
  tdBadge: {
    fontFamily: FONTS.monoNumbers,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyHistory: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDone: {
    backgroundColor: '#E8F7EE',
  },
  statusPending: {
    backgroundColor: '#F0EDFF',
  },
  statusBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
  },
  statusDoneText: {
    color: '#059669',
  },
  statusPendingText: {
    color: '#7C3AED',
  },
});
