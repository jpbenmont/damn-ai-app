import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS } from '../theme/colors';
import { FONTS } from '../theme/fonts';

interface VoiceActionChipsProps {
  onSelectCommand: (command: string) => void;
}

const CHIPS = [
  { label: '👨‍👩‍👧 Remind family: Dinner at 8', command: 'Remind family dinner at 8pm', color: '#EDE7F6', textColor: '#6D28D9' },
  { label: '🛒 Add to family list: Milk & bread', command: 'Add milk and bread to family shopping list', color: '#E2F5E8', textColor: '#059669' },
  { label: '⏰ Remind me in 2 hours', command: 'Remind me this after 2 hr', color: '#EDE7F6', textColor: '#6D28D9' },
  { label: '🛍️ I wanna buy: groceries & coffee', command: 'I wanna buy groceries and coffee', color: '#E2F5E8', textColor: '#059669' },
  { label: '📍 Show buy list', command: 'Show my buy list', color: '#FFF8E1', textColor: '#D97706' },
  { label: '👨‍👩‍👧 Open Family Hub', command: 'Open family hub', color: '#FFEBF0', textColor: '#E11D48' },
  { label: '✨ What should I focus on today?', command: 'What should I focus on right now?', color: '#FFEBF0', textColor: '#E11D48' },
  { label: '⏱️ Set a 15 min timer', command: 'Set timer for 15 minutes', color: '#EDE7F6', textColor: '#7C3AED' },
  { label: '📝 Note: Call office tomorrow', command: 'Add note Call office tomorrow morning', color: '#FAF4E8', textColor: '#374151' },
  { label: '⚡ Daily briefing', command: 'Give me my daily briefing', color: '#FFF0E6', textColor: '#EA580C' },
  { label: '🪙 Flip a coin', command: 'Flip a coin', color: '#F3F4F6', textColor: '#1F2937' },
  { label: '😄 Tell me a joke', command: 'Tell me a joke', color: '#FAF4E8', textColor: '#4B5563' },
];

export const VoiceActionChips: React.FC<VoiceActionChipsProps> = ({ onSelectCommand }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>QUICK VOICE COMMANDS</Text>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CHIPS.map((chip, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.chip, { backgroundColor: chip.color }]}
            onPress={() => onSelectCommand(chip.command)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, { color: chip.textColor }]}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  sectionTitle: {
    fontFamily: FONTS.outfitBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: COLORS.textMuted,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  scrollContent: {
    paddingHorizontal: 2,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  chipText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
  },
});

