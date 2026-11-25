import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Pill, Check, AlertCircle, Plus, Trash2, X, Sparkles } from 'lucide-react-native';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';
import { HeaderBar } from '../components/HeaderBar';

export const SupplementsScreen: React.FC = () => {
  const { state, takeSupplement, addSupplement, deleteSupplement } = useApp();
  const { supplements, user } = state;

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [timing, setTiming] = useState('With Breakfast');
  const [stock, setStock] = useState('30');
  const [purpose, setPurpose] = useState('');

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a supplement name (e.g. Whey Protein, Creatine).');
      return;
    }

    addSupplement({
      name: name.trim(),
      dose: dose.trim() || '1 Serving',
      timing: timing.trim() || 'Daily',
      stock: parseInt(stock, 10) || 30,
      targetStock: parseInt(stock, 10) || 30,
      purpose: purpose.trim() || 'Protocol Fuel',
    });

    setName('');
    setDose('');
    setPurpose('');
    setModalVisible(false);
  };

  const handleDelete = (id: string, supName: string) => {
    Alert.alert(
      'Remove Supplement?',
      `Are you sure you want to remove ${supName} from your protocol?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteSupplement(id) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title & Add Button */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.pageTitle}>Supplements Fuel</Text>
              <Text style={styles.pageSub}>
                {supplements.length === 0 ? 'Natural Whole-Food Protocol' : 'Track daily protocol doses, timing & stock inventory'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.addSupBtn} 
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Plus size={14} color="#FFFFFF" strokeWidth={2.8} />
              <Text style={styles.addSupBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty State vs Supplements Grid */}
        {supplements.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Sparkles size={28} color="#059669" />
            </View>
            <Text style={styles.emptyTitle}>100% Whole-Food Protocol</Text>
            <Text style={styles.emptyDesc}>
              {user.supplementsPreference && user.supplementsPreference !== 'None'
                ? `Preference logged: ${user.supplementsPreference}. Tap '+ Add' to track specific supplement doses!`
                : "You chose to fuel naturally with zero artificial supplements. Your energy and protein goals are met purely through clean whole foods!"}
            </Text>

            <TouchableOpacity 
              style={styles.emptyActionBtn} 
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.6} />
              <Text style={styles.emptyActionBtnText}>Add Custom Supplement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {supplements.map(sup => {
              const isTaken = !!sup.takenToday;
              const isLowStock = sup.stock <= 7;

              return (
                <View
                  key={sup.id}
                  style={[
                    styles.card,
                    isTaken && styles.cardTaken,
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.pillIconWrapper}>
                      <Pill size={15} color="#7C3AED" />
                    </View>
                    <View style={styles.cardTopRight}>
                      <View
                        style={[
                          styles.stockBadge,
                          isLowStock && styles.stockBadgeLow,
                        ]}
                      >
                        {isLowStock && <AlertCircle size={10} color="#DC2626" />}
                        <Text
                          style={[
                            styles.stockText,
                            isLowStock && { color: "#DC2626" },
                          ]}
                        >
                          {sup.stock} left
                        </Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => handleDelete(sup.id, sup.name)} 
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.supName}>{sup.name}</Text>
                  <Text style={styles.supDose}>{sup.dose}</Text>

                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>Timing: </Text>
                    <Text style={styles.metaVal}>{sup.timing}</Text>
                  </View>

                  {sup.purpose && (
                    <View style={styles.purposePill}>
                      <Text style={styles.purposeText}>{sup.purpose}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.takeBtn,
                      isTaken && styles.takeBtnDone,
                    ]}
                    onPress={() => takeSupplement(sup.id)}
                    activeOpacity={0.8}
                  >
                    {isTaken ? (
                      <View style={styles.takeBtnContent}>
                        <Check size={14} color="#FFFFFF" strokeWidth={3.5} />
                        <Text style={styles.takeBtnTextDone}>Taken Today</Text>
                      </View>
                    ) : (
                      <Text style={styles.takeBtnText}>Take Dose</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Extra spacing for dock */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Add Supplement Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Supplement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#141416" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>SUPPLEMENT NAME</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Creatine Monohydrate, Whey Protein"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>DOSE / SERVING</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 5g (1 Scoop), 30g Scoop"
                placeholderTextColor="#9CA3AF"
                value={dose}
                onChangeText={setDose}
              />

              <Text style={styles.inputLabel}>TIMING</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Post-Workout, With Breakfast"
                placeholderTextColor="#9CA3AF"
                value={timing}
                onChangeText={setTiming}
              />

              <Text style={styles.inputLabel}>CURRENT STOCK / SERVINGS</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="30"
                placeholderTextColor="#9CA3AF"
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>PURPOSE (OPTIONAL)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. ATP & Strength, Recovery"
                placeholderTextColor="#9CA3AF"
                value={purpose}
                onChangeText={setPurpose}
              />

              <TouchableOpacity style={styles.saveSupBtn} onPress={handleAdd} activeOpacity={0.85}>
                <Text style={styles.saveSupBtnText}>Save Supplement</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    maxWidth: 260,
  },
  addSupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#141416',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  addSupBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECECE8',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 17,
    fontWeight: '800',
    color: '#141416',
    marginBottom: 6,
  },
  emptyDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12.5,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
    marginBottom: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#141416',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyActionBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECECE8',
  },
  cardTaken: {
    backgroundColor: '#F4FBF6',
    borderColor: '#C3E8D0',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pillIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stockBadgeLow: {
    backgroundColor: '#FEE2E2',
  },
  stockText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },
  supName: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    fontWeight: '800',
    color: '#141416',
    marginBottom: 2,
  },
  supDose: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 8,
  },
  metaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 8,
  },
  metaLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  metaVal: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    fontWeight: '600',
    color: '#141416',
  },
  purposePill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  purposeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  takeBtn: {
    backgroundColor: '#141416',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeBtnDone: {
    backgroundColor: '#059669',
  },
  takeBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  takeBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  takeBtnTextDone: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ECECE8',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 17,
    fontWeight: '800',
    color: '#141416',
  },
  modalBody: {
    gap: 10,
  },
  inputLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: '#141416',
    borderWidth: 1,
    borderColor: '#ECECE8',
  },
  saveSupBtn: {
    backgroundColor: '#141416',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveSupBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
