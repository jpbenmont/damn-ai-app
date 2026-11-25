import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Mic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';

// Rounded-edge icons
const HomeIcon = ({ color, strokeWidth = 2.2, size = 19 }: { color: string; strokeWidth?: number; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.5 10.5L12 3.5L20.5 10.5V19.5C20.5 20.3 19.8 21 19 21H5C4.2 21 3.5 20.3 3.5 19.5V10.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.5 21V15C9.5 14.4 10 14 10.6 14H13.4C14 14 14.5 14.4 14.5 15V21"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RemindersIcon = ({ color, strokeWidth = 2.0, size = 19 }: { color: string; strokeWidth?: number; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FamilyIcon = ({ color, strokeWidth = 2.0, size = 19 }: { color: string; strokeWidth?: number; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="7" r="3.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M3 19C3 15.8 5.7 13.2 9 13.2C12.3 13.2 15 15.8 15 19"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="17.5" cy="9.5" r="2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M17.5 14.5C19.5 14.8 21 16.5 21 19"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AnalyticsIcon = ({ color, strokeWidth = 2.4, size = 19 }: { color: string; strokeWidth?: number; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 19V15.5"
      stroke={color}
      strokeWidth={strokeWidth + 0.4}
      strokeLinecap="round"
    />
    <Path
      d="M12 19V11.5"
      stroke={color}
      strokeWidth={strokeWidth + 0.4}
      strokeLinecap="round"
    />
    <Path
      d="M18 19V6.5"
      stroke={color}
      strokeWidth={strokeWidth + 0.4}
      strokeLinecap="round"
    />
  </Svg>
);

export const LiquidDockNav: React.FC = () => {
  const { state, setActiveTab, openModal } = useApp();
  const activeTab = state.activeTab;

  const leftTabs: { key: TabType; renderIcon: (props: { color: string; strokeWidth: number; size: number }) => React.ReactNode }[] = [
    { key: 'dashboard', renderIcon: (p) => <HomeIcon {...p} /> },
    { key: 'reminders', renderIcon: (p) => <RemindersIcon {...p} /> },
  ];

  const rightTabs: { key: TabType; renderIcon: (props: { color: string; strokeWidth: number; size: number }) => React.ReactNode }[] = [
    { key: 'family', renderIcon: (p) => <FamilyIcon {...p} /> },
    { key: 'analytics', renderIcon: (p) => <AnalyticsIcon {...p} /> },
  ];

  const handleVoicePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    openModal('ai_chat');
  };

  return (
    <View style={styles.dockWrapper} pointerEvents="box-none">
      <View style={styles.capsule}>
        {/* Left Tabs */}
        {leftTabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.activeTabItem]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              {tab.renderIcon({
                color: isActive ? '#141416' : '#9CA3AF',
                strokeWidth: isActive ? 2.4 : 2.0,
                size: 19,
              })}
            </TouchableOpacity>
          );
        })}

        {/* Center Omnipresent Voice Assistant Orb Button */}
        <TouchableOpacity
          style={styles.centerVoiceOrb}
          onPress={handleVoicePress}
          activeOpacity={0.85}
        >
          <View style={styles.voiceOrbInner}>
            <Mic size={18} color="#20C997" strokeWidth={2.6} />
          </View>
        </TouchableOpacity>

        {/* Right Tabs */}
        {rightTabs.map(tab => {
          const isActive = activeTab === tab.key || (tab.key === 'family' && activeTab === 'squad');
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.activeTabItem]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              {tab.renderIcon({
                color: isActive ? '#141416' : '#9CA3AF',
                strokeWidth: isActive ? 2.4 : 2.0,
                size: 19,
              })}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141416',
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: '92%',
    maxWidth: 380,
    height: 56,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  activeTabItem: {
    backgroundColor: '#FFFFFF',
  },
  centerVoiceOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#20C997',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: '#20C997',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  voiceOrbInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
