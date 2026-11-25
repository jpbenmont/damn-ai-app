import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { COLORS, RADIUS } from '../theme/colors';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';

export const HeaderBar: React.FC = () => {
  const { openModal } = useApp();

  return (
    <View style={styles.container}>
      {/* Brand Left: Rounded-square logo and big DAMN text with VOICE AI pill */}
      <View style={styles.brandRow}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/Damn_App_Icon.png')}
            style={styles.logoImg}
            resizeMode="cover"
          />
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.brandTitle}>DAMN</Text>
          <View style={styles.onlinePill}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.onlinePillText}>ONLINE</Text>
          </View>
        </View>
      </View>

      {/* Action Right: Clean AI Assistant Status Pill */}
      <TouchableOpacity
        style={styles.assistantBadge}
        onPress={() => openModal('ai_chat')}
        activeOpacity={0.8}
      >
        <Sparkles size={14} color="#6D28D9" />
        <Text style={styles.assistantBadgeText}>AI ACTIVE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bgMain,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(20, 20, 22, 0.08)',
    backgroundColor: '#40A7FE',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  titleCol: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: FONTS.headingBlack,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: COLORS.textMain,
    lineHeight: 24,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  greenPulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#059669',
  },
  onlinePillText: {
    fontFamily: FONTS.outfitBold,
    fontSize: 8,
    color: '#065F46',
    letterSpacing: 0.8,
  },
  assistantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(109, 40, 217, 0.2)',
  },
  assistantBadgeText: {
    fontFamily: FONTS.outfitBold,
    fontSize: 11,
    color: '#6D28D9',
    letterSpacing: 0.8,
  },
});
