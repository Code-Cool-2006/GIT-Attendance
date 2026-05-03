import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AdminModal } from '@/components/admin-modal';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/constants/api';

export default function StudentsScreen() {
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<{ id: string, name: string } | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const fetchAssignedSubjects = async (divisionId: string) => {
    setSubjectsLoading(true);
    try {
      const res = await apiClient(`/api/subjects?divisionId=${divisionId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignedSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching assigned subjects:', error);
    } finally {
      setSubjectsLoading(false);
    }
  };

  // Handle incoming division filter from navigation
  useEffect(() => {
    if (params.divisionId && params.divisionName) {
      const filter = { 
        id: params.divisionId as string, 
        name: params.divisionName as string 
      };
      setActiveFilter(filter);
      fetchAssignedSubjects(filter.id);
    } else {
      setActiveFilter(null);
      setAssignedSubjects([]);
    }
  }, [params.divisionId, params.divisionName]);

  // State for Selection Modal (Dropdown)
  const [isDivisionPickerVisible, setIsDivisionPickerVisible] = useState(false);

  const fetchInitialData = async () => {
    try {
      const [studentsRes, divisionsRes] = await Promise.all([
        apiClient('/api/students'),
        apiClient('/api/divisions')
      ]);
      
      const studentsData = await studentsRes.json();
      const divisionsData = await divisionsRes.json();
      
      if (studentsRes.ok) {
        setStudents(studentsData.map((s: any) => ({
          id: s.id,
          name: s.name,
          roll: s.rollNumber,
          div: s.divisionName || 'Unassigned',
          divisionId: s.divisionId,
          status: 'Active'
        })));
      }
      
      if (divisionsRes.ok) {
        setDivisions(divisionsData);
      }
    } catch (error) {
      console.error('Error fetching students data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [])
  );

  const fetchStudents = fetchInitialData; // Alias for backward compatibility

  // State for Add/Edit Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    roll: '',
    email: '',
    phone: '',
    div: '',
    divisionId: '',
  });

  const openModal = (student?: any) => {
    if (student) {
      setEditingStudent(student);
      setForm({
        name: student.name,
        roll: student.roll,
        email: student.email || '',
        phone: student.phone || '',
        div: student.div,
        divisionId: student.divisionId || '',
      });
    } else {
      setEditingStudent(null);
      setForm({ name: '', roll: '', email: '', phone: '', div: '', divisionId: '' });
    }
    setIsModalVisible(true);
  };

  const handleSaveStudent = async () => {
    if (!form.name || !form.roll) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const method = editingStudent ? 'PUT' : 'POST';
      const body = {
        id: editingStudent?.id,
        name: form.name,
        rollNumber: form.roll,
        email: form.email,
        phone: form.phone,
        divisionId: form.divisionId,
      };

      const response = await apiClient('/api/students', {
        method,
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchStudents();
        setIsModalVisible(false);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to save student');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = (id: string) => {
    Alert.alert(
      'Delete Student',
      'Are you sure you want to remove this student record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient(`/api/students?id=${id}`, { method: 'DELETE' });
              if (response.ok) {
                fetchStudents();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete student');
            }
          }
        }
      ]
    );
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                         s.roll.toLowerCase().includes(search.toLowerCase());
    const matchesDivision = activeFilter ? s.divisionId === activeFilter.id : true;
    return matchesSearch && matchesDivision;
  });

  const renderStudentItem = ({ item }: { item: typeof students[0] }) => (
    <View style={[styles.item, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.avatar}>
        <ThemedText style={{ fontFamily: Fonts.bold, color: themeColors.primary }}>{item.name[0]}</ThemedText>
      </View>
      <View style={styles.info}>
        <ThemedText style={{ fontFamily: Fonts.semiBold }}>{item.name}</ThemedText>
        <ThemedText style={{ fontSize: 12, color: themeColors.secondary }}>{item.roll} • {item.div}</ThemedText>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => openModal(item)}>
          <Ionicons name="create-outline" size={18} color={themeColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteStudent(item.id)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <View style={styles.headerTop}>
          <ThemedText style={[styles.title, { fontFamily: Fonts.bold }]}>Student Directory</ThemedText>
          <TouchableOpacity 
            style={[styles.bulkButton, { borderColor: themeColors.tertiary }]}
            onPress={() => Alert.alert('Bulk Assign', 'Feature coming soon: CSV upload and batch division assignment.')}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={themeColors.tertiary} />
            <ThemedText style={[styles.bulkText, { color: themeColors.tertiary, fontFamily: Fonts.semiBold }]}>Bulk</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={[styles.searchBar, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
          <Ionicons name="search" size={18} color={themeColors.secondary} />
          <TextInput 
            placeholder="Search students or roll numbers..." 
            style={{ flex: 1, marginLeft: 8, fontFamily: Fonts.sans, color: themeColors.text }} 
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={themeColors.secondary}
          />
        </View>

        {activeFilter && (
          <View style={styles.filterContainer}>
            <View style={[styles.filterChip, { backgroundColor: themeColors.primary + '15', borderColor: themeColors.primary }]}>
              <ThemedText style={[styles.filterText, { color: themeColors.primary, fontFamily: Fonts.semiBold }]}>
                Division: {activeFilter.name}
              </ThemedText>
              <TouchableOpacity onPress={() => { setActiveFilter(null); setAssignedSubjects([]); }} style={styles.filterClose}>
                <Ionicons name="close-circle" size={16} color={themeColors.primary} />
              </TouchableOpacity>
            </View>
            <ThemedText style={[styles.resultsText, { color: themeColors.secondary }]}>
              {filteredStudents.length} results
            </ThemedText>
          </View>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <ThemedText style={styles.loadingText}>Loading directory...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={renderStudentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <>
              {activeFilter && (
                <View style={styles.assignedSection}>
                  <ThemedText style={[styles.assignedTitle, { fontFamily: Fonts.bold, color: themeColors.primary }]}>
                    Academic Faculty
                  </ThemedText>
                  {subjectsLoading ? (
                    <ActivityIndicator size="small" color={themeColors.primary} style={{ marginVertical: 10 }} />
                  ) : assignedSubjects.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectsScroll}>
                      {assignedSubjects.map((sub: any) => (
                        <View key={sub.id} style={[styles.subjectChip, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                          <View style={[styles.subjectIcon, { backgroundColor: themeColors.tertiary + '15' }]}>
                            <Ionicons name="book" size={14} color={themeColors.tertiary} />
                          </View>
                          <View>
                            <ThemedText style={[styles.subjectNameText, { fontFamily: Fonts.semiBold }]}>{sub.name}</ThemedText>
                            <ThemedText style={[styles.teacherNameText, { color: themeColors.secondary }]}>{sub.teacherName || 'Not Assigned'}</ThemedText>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <ThemedText style={[styles.emptySubjects, { color: themeColors.secondary }]}>No subjects assigned to this division yet.</ThemedText>
                  )}
                  <ThemedText style={[styles.assignedTitle, { fontFamily: Fonts.bold, marginTop: 24, marginBottom: 12 }]}>
                    Students ({filteredStudents.length})
                  </ThemedText>
                </View>
              )}
            </>
          )}
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: themeColors.primary }]}
        onPress={() => openModal()}
      >
        <Ionicons name="add" size={30} color={colorScheme === 'dark' ? themeColors.background : '#FFFFFF'} />
      </TouchableOpacity>

      {/* Add/Edit Student Modal */}
      <AdminModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        title={editingStudent ? "Edit Student Record" : "Register New Student"}
      >
        <View style={styles.formContainer}>
          <View style={styles.inputField}>
            <ThemedText style={[styles.inputLabel, { fontFamily: Fonts.semiBold }]}>Full Name *</ThemedText>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border, fontFamily: Fonts.sans }]}
              placeholder="e.g. Alex Johnson"
              value={form.name}
              onChangeText={(text) => setForm({...form, name: text})}
            />
          </View>

          <View style={styles.inputField}>
            <ThemedText style={[styles.inputLabel, { fontFamily: Fonts.semiBold }]}>Roll Number *</ThemedText>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border, fontFamily: Fonts.sans }]}
              placeholder="e.g. CS024"
              value={form.roll}
              onChangeText={(text) => setForm({...form, roll: text})}
            />
          </View>

          <View style={styles.inputField}>
            <ThemedText style={[styles.inputLabel, { fontFamily: Fonts.semiBold }]}>Email Address</ThemedText>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border, fontFamily: Fonts.sans }]}
              placeholder="e.g. alex@example.com"
              value={form.email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(text) => setForm({...form, email: text})}
            />
          </View>

          <View style={styles.inputField}>
            <ThemedText style={[styles.inputLabel, { fontFamily: Fonts.semiBold }]}>Phone Number</ThemedText>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border, fontFamily: Fonts.sans }]}
              placeholder="e.g. +91 9876543210"
              value={form.phone}
              keyboardType="phone-pad"
              onChangeText={(text) => setForm({...form, phone: text})}
            />
          </View>

          <View style={styles.inputField}>
            <ThemedText style={[styles.inputLabel, { fontFamily: Fonts.semiBold }]}>Division *</ThemedText>
            <TouchableOpacity 
              style={[styles.formInput, { backgroundColor: themeColors.background, borderColor: themeColors.border, justifyContent: 'center' }]}
              onPress={() => setIsDivisionPickerVisible(true)}
            >
              <ThemedText style={{ color: form.div ? themeColors.text : themeColors.secondary, fontFamily: Fonts.sans }}>
                {form.div || 'Select Division'}
              </ThemedText>
              <Ionicons name="chevron-down" size={18} color={themeColors.secondary} style={{ position: 'absolute', right: 12 }} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: themeColors.primary, opacity: submitting ? 0.7 : 1 }]}
            onPress={handleSaveStudent}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colorScheme === 'dark' ? themeColors.background : '#FFFFFF'} />
            ) : (
              <ThemedText style={[styles.submitButtonText, { color: colorScheme === 'dark' ? themeColors.background : '#FFFFFF', fontFamily: Fonts.bold }]}>
                {editingStudent ? "Update Student" : "Register Student"}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </AdminModal>

      {/* Division Picker Modal */}
      <AdminModal
        visible={isDivisionPickerVisible}
        onClose={() => setIsDivisionPickerVisible(false)}
        title="Select Division"
      >
        <View style={styles.pickerContainer}>
          {divisions.length === 0 ? (
            <ThemedText style={styles.emptyPickerText}>No divisions created yet</ThemedText>
          ) : (
            divisions.map((div) => (
              <TouchableOpacity 
                key={div.id} 
                style={[styles.pickerItem, { borderBottomColor: themeColors.border }]}
                onPress={() => {
                  setForm({...form, div: div.name, divisionId: div.id});
                  setIsDivisionPickerVisible(false);
                }}
              >
                <ThemedText style={{ fontFamily: Fonts.semiBold }}>{div.name}</ThemedText>
                <ThemedText style={{ fontSize: 12, color: themeColors.secondary }}>{div.department}</ThemedText>
                {form.divisionId === div.id && (
                  <Ionicons name="checkmark-circle" size={20} color={themeColors.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </AdminModal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22 },
  bulkButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  bulkText: { fontSize: 13 },
  searchBar: { height: 44, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  filterContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12 },
  filterClose: { marginLeft: 2 },
  resultsText: { fontSize: 12 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 12 },
  actions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  formContainer: {
    gap: 16,
  },
  inputField: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
  },
  formInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.6,
  },
  pickerContainer: {
    maxHeight: 400,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    position: 'relative',
  },
  emptyPickerText: {
    textAlign: 'center',
    paddingVertical: 20,
    opacity: 0.5,
  },
  checkIcon: {
    position: 'absolute',
    right: 4,
    top: 16,
  },
  assignedSection: {
    marginBottom: 8,
  },
  assignedTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  subjectsScroll: {
    paddingRight: 24,
    gap: 12,
    paddingVertical: 4,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    minWidth: 160,
  },
  subjectIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectNameText: {
    fontSize: 13,
  },
  teacherNameText: {
    fontSize: 11,
    marginTop: 2,
  },
  emptySubjects: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
});
