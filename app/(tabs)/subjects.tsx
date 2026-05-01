import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AdminModal } from '@/components/admin-modal';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SubjectsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  
  const [search, setSearch] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    try {
      const [subsRes, divsRes, teachRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/divisions'),
        fetch('/api/teachers')
      ]);
      
      const subsData = await subsRes.json();
      const divsData = await divsRes.json();
      const teachData = await teachRes.json();
      
      if (subsRes.ok) setSubjects(subsData);
      if (divsRes.ok) setDivisions(divsData);
      if (teachRes.ok) setTeachers(teachData);
    } catch (error) {
      console.error('Error fetching subjects initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [])
  );

  // State for Add/Edit Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    divisionId: '',
    teacherId: '',
    divisionName: '',
    teacherName: '',
  });

  // Pickers state
  const [isDivPickerVisible, setIsDivPickerVisible] = useState(false);
  const [isTeachPickerVisible, setIsTeachPickerVisible] = useState(false);

  const openModal = (subject?: any) => {
    if (subject) {
      setEditingSubject(subject);
      setForm({
        name: subject.name,
        code: subject.code,
        divisionId: subject.divisionId,
        teacherId: subject.teacherId || '',
        divisionName: subject.divisionName,
        teacherName: subject.teacherName || '',
      });
    } else {
      setEditingSubject(null);
      setForm({ name: '', code: '', divisionId: '', teacherId: '', divisionName: '', teacherName: '' });
    }
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.divisionId) {
      Alert.alert('Missing Fields', 'Please fill in Name, Code and Division.');
      return;
    }

    setSubmitting(true);
    try {
      const method = editingSubject ? 'PUT' : 'POST';
      const body = {
        id: editingSubject?.id,
        name: form.name,
        code: form.code,
        divisionId: form.divisionId,
        teacherId: form.teacherId || null,
      };

      const response = await fetch('/api/subjects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchInitialData();
        setIsModalVisible(false);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to save subject');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Subject', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          await fetch(`/api/subjects?id=${id}`, { method: 'DELETE' });
          fetchInitialData();
      }}
    ]);
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.cardInfo}>
        <ThemedText style={[styles.subName, { fontFamily: Fonts.bold }]}>{item.name}</ThemedText>
        <ThemedText style={[styles.subCode, { color: themeColors.tertiary, fontFamily: Fonts.semiBold }]}>{item.code}</ThemedText>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="layers-outline" size={14} color={themeColors.secondary} />
            <ThemedText style={[styles.metaText, { color: themeColors.secondary }]}>{item.divisionName}</ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="school-outline" size={14} color={themeColors.secondary} />
            <ThemedText style={[styles.metaText, { color: themeColors.secondary }]}>{item.teacherName || 'Not Assigned'}</ThemedText>
          </View>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openScheduleModal(item)}>
          <Ionicons name="calendar-outline" size={20} color={themeColors.tertiary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(item)}>
          <Ionicons name="create-outline" size={20} color={themeColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Schedule Management
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [currentSubjectSchedules, setCurrentSubjectSchedules] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: '',
  });

  const fetchSchedules = async (subjectId: string) => {
    try {
      const res = await fetch(`/api/schedules?subjectId=${subjectId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentSubjectSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const openScheduleModal = (subject: any) => {
    setSelectedSubject(subject);
    fetchSchedules(subject.id);
    setIsScheduleModalVisible(true);
  };

  const handleAddSchedule = async () => {
    if (!scheduleForm.startTime || !scheduleForm.endTime) return;
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: selectedSubject.id,
          ...scheduleForm
        })
      });
      if (res.ok) {
        fetchSchedules(selectedSubject.id);
        setIsAddingSchedule(false);
        setScheduleForm({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', room: '' });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add schedule');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await fetch(`/api/schedules?id=${id}`, { method: 'DELETE' });
      fetchSchedules(selectedSubject.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete schedule');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <ThemedText style={[styles.title, { fontFamily: Fonts.bold }]}>Academic Subjects</ThemedText>
        <View style={[styles.searchBar, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
          <Ionicons name="search" size={18} color={themeColors.secondary} />
          <TextInput 
            placeholder="Search subjects..." 
            style={[styles.searchInput, { color: themeColors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={themeColors.secondary}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredSubjects}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={{ opacity: 0.5 }}>No subjects found</ThemedText>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: themeColors.primary }]}
        onPress={() => openModal()}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <AdminModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        title={editingSubject ? "Edit Subject" : "Create New Subject"}
      >
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Subject Name *</ThemedText>
            <TextInput 
              style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }]}
              value={form.name}
              onChangeText={t => setForm({...form, name: t})}
              placeholder="e.g. Advanced Mathematics"
            />
          </View>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Subject Code *</ThemedText>
            <TextInput 
              style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }]}
              value={form.code}
              onChangeText={t => setForm({...form, code: t})}
              placeholder="e.g. MATH301"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Division *</ThemedText>
            <TouchableOpacity 
              style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.border, justifyContent: 'center' }]}
              onPress={() => setIsDivPickerVisible(true)}
            >
              <ThemedText style={{ color: form.divisionName ? themeColors.text : themeColors.secondary }}>
                {form.divisionName || 'Select Division'}
              </ThemedText>
              <Ionicons name="chevron-down" size={16} color={themeColors.secondary} style={styles.pickerIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Assigned Teacher</ThemedText>
            <TouchableOpacity 
              style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.border, justifyContent: 'center' }]}
              onPress={() => setIsTeachPickerVisible(true)}
            >
              <ThemedText style={{ color: form.teacherName ? themeColors.text : themeColors.secondary }}>
                {form.teacherName || 'Select Teacher'}
              </ThemedText>
              <Ionicons name="chevron-down" size={16} color={themeColors.secondary} style={styles.pickerIcon} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.btn, { backgroundColor: themeColors.primary }]} onPress={handleSave}>
            {submitting ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.btnText}>Save Subject</ThemedText>}
          </TouchableOpacity>
        </View>
      </AdminModal>

      {/* Schedule Management Modal */}
      <AdminModal
        visible={isScheduleModalVisible}
        onClose={() => { setIsScheduleModalVisible(false); setIsAddingSchedule(false); }}
        title={`Schedules: ${selectedSubject?.name}`}
      >
        <View style={styles.scheduleList}>
          {currentSubjectSchedules.map(sch => (
            <View key={sch.id} style={[styles.scheduleItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontFamily: Fonts.bold }}>{sch.dayOfWeek}</ThemedText>
                <ThemedText style={{ fontSize: 13, color: themeColors.secondary }}>{sch.startTime} - {sch.endTime}</ThemedText>
                {sch.room && <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>Room: {sch.room}</ThemedText>}
              </View>
              <TouchableOpacity onPress={() => handleDeleteSchedule(sch.id)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          {isAddingSchedule ? (
            <View style={[styles.addScheduleForm, { borderColor: themeColors.primary }]}>
              <View style={styles.row}>
                <TouchableOpacity 
                  style={[styles.miniInput, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                  onPress={() => {
                    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const currentIdx = days.indexOf(scheduleForm.dayOfWeek);
                    setScheduleForm({...scheduleForm, dayOfWeek: days[(currentIdx + 1) % days.length]});
                  }}
                >
                  <ThemedText style={{ fontSize: 13 }}>{scheduleForm.dayOfWeek}</ThemedText>
                </TouchableOpacity>
                <TextInput 
                  style={[styles.miniInput, { flex: 1, backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }]}
                  value={scheduleForm.startTime}
                  onChangeText={t => setScheduleForm({...scheduleForm, startTime: t})}
                  placeholder="Start (09:00)"
                />
                <TextInput 
                  style={[styles.miniInput, { flex: 1, backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }]}
                  value={scheduleForm.endTime}
                  onChangeText={t => setScheduleForm({...scheduleForm, endTime: t})}
                  placeholder="End (10:00)"
                />
              </View>
              <TextInput 
                style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text, marginTop: 8 }]}
                value={scheduleForm.room}
                onChangeText={t => setScheduleForm({...scheduleForm, room: t})}
                placeholder="Room No (optional)"
              />
              <View style={[styles.row, { marginTop: 12 }]}>
                <TouchableOpacity style={[styles.smallBtn, { backgroundColor: themeColors.primary }]} onPress={handleAddSchedule}>
                  <ThemedText style={styles.smallBtnText}>Add</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#94A3B8' }]} onPress={() => setIsAddingSchedule(false)}>
                  <ThemedText style={styles.smallBtnText}>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.addMoreBtn, { borderColor: themeColors.primary }]}
              onPress={() => setIsAddingSchedule(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={themeColors.primary} />
              <ThemedText style={{ color: themeColors.primary, fontFamily: Fonts.semiBold }}>Add Session</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </AdminModal>

      {/* Division Picker */}
      <AdminModal visible={isDivPickerVisible} onClose={() => setIsDivPickerVisible(false)} title="Select Division">
        <ScrollView style={styles.pickerScroll}>
          {divisions.map(d => (
            <TouchableOpacity 
              key={d.id} 
              style={[styles.pickerItem, { borderBottomColor: themeColors.border }]}
              onPress={() => {
                setForm({...form, divisionId: d.id, divisionName: d.name});
                setIsDivPickerVisible(false);
              }}
            >
              <ThemedText>{d.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </AdminModal>

      {/* Teacher Picker */}
      <AdminModal visible={isTeachPickerVisible} onClose={() => setIsTeachPickerVisible(false)} title="Select Teacher">
        <ScrollView style={styles.pickerScroll}>
          {teachers.map(t => (
            <TouchableOpacity 
              key={t.id} 
              style={[styles.pickerItem, { borderBottomColor: themeColors.border }]}
              onPress={() => {
                setForm({...form, teacherId: t.id, teacherName: t.name});
                setIsTeachPickerVisible(false);
              }}
            >
              <ThemedText>{t.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </AdminModal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, borderBottomWidth: 1 },
  title: { fontSize: 22, marginBottom: 16 },
  searchBar: { height: 44, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, fontFamily: Fonts.sans },
  listContent: { padding: 24, paddingBottom: 100 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1 },
  subName: { fontSize: 16, marginBottom: 2 },
  subCode: { fontSize: 13, marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  form: { gap: 16 },
  scheduleList: { gap: 12 },
  scheduleItem: { padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  addScheduleForm: { padding: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginTop: 8 },
  row: { flexDirection: 'row', gap: 8 },
  miniInput: { height: 40, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  smallBtn: { flex: 1, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  smallBtnText: { color: '#FFF', fontSize: 13, fontFamily: Fonts.bold },
  addMoreBtn: { height: 50, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontFamily: Fonts.semiBold },
  input: { height: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  pickerIcon: { position: 'absolute', right: 12 },
  btn: { height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  btnText: { color: '#FFF', fontSize: 16, fontFamily: Fonts.bold },
  pickerScroll: { maxHeight: 300 },
  pickerItem: { paddingVertical: 14, borderBottomWidth: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
});
