import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { X, Plus, Trash2, Edit3 } from 'lucide-react-native';
import { FONTS } from '../theme/fonts';
import { useApp } from '../context/AppContext';
import { TaskItem } from '../types';

export const RoutineEditorModal: React.FC = () => {
  const { activeModal, modalPayload, closeModal, addCustomTask, deleteTask, state } = useApp();
  const isOpen = activeModal === 'routine_editor';

  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [xpVal, setXpVal] = useState('50');

  if (!isOpen || !modalPayload) return null;

  const { sectionKey, title } = modalPayload;
  const currentTasks: TaskItem[] = state.dailyTasks[sectionKey] || [];

  const handleAdd = () => {
    if (!newTaskLabel.trim()) return;
    const xp = parseInt(xpVal, 10) || 50;
    addCustomTask(sectionKey, newTaskLabel.trim(), xp);
    setNewTaskLabel('');
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={closeModal}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Edit3 size={15} color="#059669" />
              </View>
              <Text style={styles.title}>Edit {title}</Text>
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <X size={18} color="#787A82" />
            </TouchableOpacity>
          </View>

          {/* Current Tasks List */}
          <Text style={styles.sectionLabel}>CURRENT PROTOCOL TASKS</Text>
          <ScrollView style={styles.taskList} contentContainerStyle={styles.taskListContent}>
            {currentTasks.length === 0 ? (
              <Text style={styles.emptyText}>No tasks in this section yet. Add one below!</Text>
            ) : (
              currentTasks.map(task => (
                <View key={task.id} style={styles.taskRow}>
                  <Text style={styles.taskLabel}>{task.label}</Text>
                  <View style={styles.taskRight}>
                    <View style={styles.xpPill}>
                      <Text style={styles.xpText}>+{task.xp || 50} XP</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteTask(sectionKey, task.id)}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Add New Task */}
          <View style={styles.addSection}>
            <Text style={styles.sectionLabel}>ADD NEW CUSTOM TASK</Text>
            <TextInput
              style={styles.input}
              value={newTaskLabel}
              onChangeText={setNewTaskLabel}
              placeholder="e.g. 10min cold shower, read 10 pages..."
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.addRow}>
              <View style={styles.xpInputWrapper}>
                <Text style={styles.xpInputLabel}>XP: </Text>
                <TextInput
                  style={styles.xpInput}
                  value={xpVal}
                  onChangeText={setXpVal}
                  keyboardType="number-pad"
                  placeholder="50"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity
                style={[styles.addBtn, !newTaskLabel.trim() && { opacity: 0.5 }]}
                onPress={handleAdd}
                disabled={!newTaskLabel.trim()}
                activeOpacity={0.8}
              >
                <Plus size={15} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add Task</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'flex-end',
  },
  container: {
    height: '75%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#ECECE8',
    padding: 20,
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
  sectionLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
    color: '#787A82',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  taskList: {
    flex: 1,
    marginBottom: 14,
  },
  taskListContent: {
    gap: 8,
  },
  emptyText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: '#787A82',
    textAlign: 'center',
    paddingVertical: 20,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF9F6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#EFEFEA',
  },
  taskLabel: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: '#141416',
    marginRight: 10,
  },
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpPill: {
    backgroundColor: '#F0EDFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  xpText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
  deleteBtn: {
    padding: 6,
  },
  addSection: {
    borderTopWidth: 1,
    borderTopColor: '#ECECE8',
    paddingTop: 14,
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
    fontSize: 13,
    marginBottom: 10,
  },
  addRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  xpInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F0',
    borderWidth: 1,
    borderColor: '#E5E5DF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 80,
  },
  xpInputLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: '#787A82',
    fontWeight: '700',
  },
  xpInput: {
    fontFamily: FONTS.monoNumbers,
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '900',
    padding: 0,
    flex: 1,
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141416',
    borderRadius: 12,
    paddingVertical: 11,
    gap: 6,
  },
  addBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
