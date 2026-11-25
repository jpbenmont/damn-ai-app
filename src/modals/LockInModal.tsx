import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { X, Target } from 'lucide-react-native';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';

export const LockInModal: React.FC = () => {
  const { activeModal, closeModal, state, updateLockInDays } = useApp();
  const isOpen = activeModal === 'lockin';

  const [days, setDays] = useState(String(state.user.dayTotal || 60));
  const [name, setName] = useState(state.user.name || '');

  const presets = [30, 45, 60, 75, 90, 100];

  const handleSave = () => {
    const num = parseInt(days, 10) || 60;
    updateLockInDays(num, name.trim() || undefined);
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
                <Target size={16} color="#059669" />
              </View>
              <Text style={styles.title}>Edit Protocol Goal</Text>
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <X size={18} color="#787A82" />
            </TouchableOpacity>
          </View>

          {/* Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>WARRIOR NAME</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Days Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PROTOCOL DURATION (DAYS)</Text>
            <TextInput
              style={styles.input}
              value={days}
              onChangeText={setDays}
              keyboardType="number-pad"
              placeholder="60"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Presets */}
          <Text style={styles.label}>QUICK PRESETS</Text>
          <View style={styles.presetGrid}>
            {presets.map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.presetBtn,
                  days === String(p) && styles.presetBtnActive,
                ]}
                onPress={() => setDays(String(p))}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetText,
                    days === String(p) && styles.presetTextActive,
                  ]}
                >
                  {p} Days
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save CTA (Solid Black) */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save Protocol</Text>
          </TouchableOpacity>
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
    maxWidth: 360,
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
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
    color: '#787A82',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  input: {
    fontFamily: FONTS.bodySemiBold,
    backgroundColor: '#F4F4F0',
    borderWidth: 1,
    borderColor: '#E5E5DF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#141416',
    fontSize: 14,
    fontWeight: '600',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  presetBtn: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: '#F4F4F0',
    borderWidth: 1,
    borderColor: '#E5E5DF',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnActive: {
    backgroundColor: '#141416',
    borderColor: '#141416',
  },
  presetText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
    color: '#4B4D54',
  },
  presetTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  saveBtn: {
    backgroundColor: '#141416',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
