import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AdminModal } from '@/components/admin-modal';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { API_BASE_URL } from '@/constants/Config';

export default function TeachersScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');

  // State for data management
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teachers`);
      const data = await response.json();
      if (response.ok) {
        // Map API data to UI format if needed
        const mappedTeachers = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          dept: t.department || 'General',
          idNo: t.employee_id || t.employeeId,
          email: t.email || '',
          subjects: t.subjects || []
        }));
        setTeachers(mappedTeachers);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTeachers();
    }, [])
  );

  // State for Add/Edit Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    idNo: '',
    email: '',
    dept: '',
    subjects: ''
  });

  const openModal = (teacher?: any) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setForm({
        name: teacher.name,
        idNo: teacher.idNo,
        email: teacher.email,
        dept: teacher.dept,
        subjects: teacher.subjects.join(', ')
      });
    } else {
      setEditingTeacher(null);
      setForm({ name: '', idNo: '', email: '', dept: '', subjects: '' });
    }
    setIsModalVisible(true);
  };

  // State for Bulk CSV Modal
  const [isBulkModalVisible, setIsBulkModalVisible] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const handleBulkImportTeachers = async () => {
    if (!bulkCsvText.trim()) {
      Alert.alert('Empty Input', 'Please paste teacher list before uploading.');
      return;
    }

    const lines = bulkCsvText.trim().split('\n');
    const teachersList: any[] = [];

    lines.forEach((line, idx) => {
      const delimiter = line.includes('\t') ? '\t' : ',';
      const parts = line.split(delimiter).map(p => p.trim());
      if (parts.length >= 1 && parts[0] !== '') {
        // Skip header line
        if (parts[0].toLowerCase().includes('employee') || parts[0].toLowerCase().includes('name')) {
          return;
        }
        let empId = parts.length >= 2 ? parts[0] : `EMP${String(idx + 1).padStart(3, '0')}`;
        let name = parts.length >= 2 ? parts[1] : parts[0];
        let email = parts[2] || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@git.edu`;
        let dept = parts[3] || 'Computer Science & Engineering';

        teachersList.push({ employeeId: empId, name, email, department: dept });
      }
    });

    if (teachersList.length === 0) {
      Alert.alert('Invalid Format', 'No valid teacher rows found.');
      return;
    }

    setBulkSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teachersList }),
      });

      const resData = await response.json();
      if (response.ok) {
        Alert.alert('Success', `Successfully imported ${resData.insertedCount} out of ${resData.totalCount} teachers.`);
        setBulkCsvText('');
        setIsBulkModalVisible(false);
        fetchTeachers();
      } else {
        Alert.alert('Error', resData.error || 'Failed to bulk import teachers.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to process bulk import.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleSaveTeacher = async () => {
    if (!form.name || !form.idNo || !form.dept) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const method = editingTeacher ? 'PUT' : 'POST';
      const body = {
        id: editingTeacher?.id,
        name: form.name,
        employeeId: form.idNo,
        email: form.email,
        department: form.dept
      };

      const response = await fetch(`${API_BASE_URL}/teachers`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchTeachers();
        setIsModalVisible(false);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to save teacher');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = (id: string) => {
    Alert.alert(
      'Delete Teacher',
      'Are you sure you want to delete this faculty member?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/teachers?id=${id}`, { method: 'DELETE' });
              if (response.ok) {
                fetchTeachers();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete teacher');
            }
          }
        }
      ]
    );
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.idNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDeptFilter !== 'All' ? t.dept.toLowerCase().includes(selectedDeptFilter.toLowerCase()) : true;
    return matchesSearch && matchesDept;
  });

  const renderTeacherCard = ({ item }: { item: typeof teachers[0] }) => (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: themeColors.background }]}>
          <ThemedText style={[styles.avatarText, { color: themeColors.primary, fontFamily: Fonts.bold }]}>
            {item.name.split(' ').map((n: string) => n[0]).join('')}
          </ThemedText>
        </View>
        <View style={styles.headerInfo}>
          <ThemedText style={[styles.teacherName, { fontFamily: Fonts.bold }]}>{item.name}</ThemedText>
          <ThemedText style={[styles.teacherDept, { color: themeColors.tertiary, fontFamily: Fonts.semiBold }]}>{item.dept}</ThemedText>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionIcon} onPress={() => openModal(item)}>
            <Ionicons name="create-outline" size={20} color={themeColors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => handleDeleteTeacher(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="card-outline" size={14} color={themeColors.secondary} />
          <ThemedText style={[styles.infoText, { color: themeColors.secondary }]}>ID: {item.idNo}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={14} color={themeColors.secondary} />
          <ThemedText style={[styles.infoText, { color: themeColors.secondary }]}>{item.email}</ThemedText>
        </View>
        <View style={styles.subjectsContainer}>
          {item.subjects.map((sub: string, i: number) => (
            <View key={i} style={[styles.subjectBadge, { backgroundColor: themeColors.background }]}>
              <ThemedText style={[styles.subjectText, { color: themeColors.text }]}>{sub}</ThemedText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <ThemedText style={[styles.title, { fontFamily: Fonts.bold, marginBottom: 0 }]}>Teacher Management</ThemedText>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: themeColors.tertiary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
            onPress={() => setIsBulkModalVisible(true)}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={themeColors.tertiary} />
            <ThemedText style={{ color: themeColors.tertiary, fontFamily: Fonts.semiBold, fontSize: 13 }}>Bulk Import</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={[styles.searchContainer, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
          <Ionicons name="search" size={18} color={themeColors.secondary} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text, fontFamily: Fonts.sans }]}
            placeholder="Search teachers or departments..."
            placeholderTextColor={themeColors.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Department Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {['All', 'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'General'].map(dept => (
            <TouchableOpacity
              key={dept}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                borderWidth: 1,
                backgroundColor: selectedDeptFilter === dept ? themeColors.primary : themeColors.background,
                borderColor: selectedDeptFilter === dept ? themeColors.primary : themeColors.border,
              }}
              onPress={() => setSelectedDeptFilter(dept)}
            >
              <ThemedText style={{ 
                fontSize: 12, 
                fontFamily: Fonts.semiBold, 
                color: selectedDeptFilter === dept ? (colorScheme === 'dark' ? themeColors.background : '#FFFFFF') : themeColors.text 
              }}>
                {dept}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <ThemedText style={styles.loadingText}>Loading faculty...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredTeachers}
          renderItem={renderTeacherCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={themeColors.secondary} />
              <ThemedText style={styles.emptyText}>No teachers found</ThemedText>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: themeColors.primary }]}
        activeOpacity={0.9}
        onPress={() => openModal()}
      >
        <Ionicons name="add" size={30} color={colorScheme === 'dark' ? themeColors.background : '#FFFFFF'} />
      </TouchableOpacity>

      {/* Add/Edit Teacher Modal */}
      <AdminModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        title={editingTeacher ? "Edit Faculty Member" : "Add New Teacher"}
      >
        <View style={styles.formContainer}>
          <View style={styles.inputField}>
            <ThemedText style={[styles.inputLabel, { fontFamily: Fonts.semiBold }]}>Full Name *</ThemedText>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border, fontFamily: Fonts.sans }]}
              placeholder="e.g. Dr. John Doe"
              value={form.name}
              onChangeText={(text) => setForm({...form, name: text})}
            />
          </View>

          <View style={styles.inputField}>
            <ThemedText style={[styles.inputLabel, { fontFamily: Fonts.semiBold }]}>Employee ID *</ThemedText>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border, fontFamily: Fonts.sans }]}
              placeholder="e.g. T-5001"
              value={form.idNo}
              onChangeText={(text) => setForm({...form, idNo: text})}
            />
          </View>

          <View style={styles.inputField}>
            <ThemedText style={[styles.inputLabel, { fontFamily: Fonts.semiBold }]}>Department *</ThemedText>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border, fontFamily: Fonts.sans }]}
              placeholder="e.g. Computer Science"
              value={form.dept}
              onChangeText={(text) => setForm({...form, dept: text})}
            />
          </View>

          <View style={styles.inputField}>
            <ThemedText style={[styles.inputLabel, { fontFamily: Fonts.semiBold }]}>Email Address</ThemedText>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border, fontFamily: Fonts.sans }]}
              placeholder="e.g. john.doe@example.com"
              value={form.email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(text) => setForm({...form, email: text})}
            />
          </View>

          <View style={styles.inputField}>
            <ThemedText style={[styles.inputLabel, { fontFamily: Fonts.semiBold }]}>Subjects (comma separated)</ThemedText>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border, fontFamily: Fonts.sans }]}
              placeholder="e.g. Python, SQL, Networks"
              value={form.subjects}
              onChangeText={(text) => setForm({...form, subjects: text})}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: themeColors.primary, opacity: submitting ? 0.7 : 1 }]}
            onPress={handleSaveTeacher}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colorScheme === 'dark' ? themeColors.background : '#FFFFFF'} />
            ) : (
              <ThemedText style={[styles.submitButtonText, { color: colorScheme === 'dark' ? themeColors.background : '#FFFFFF', fontFamily: Fonts.bold }]}>
                {editingTeacher ? "Update Faculty Member" : "Add Faculty Member"}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </AdminModal>

      {/* Bulk Teachers Import Modal */}
      <AdminModal
        visible={isBulkModalVisible}
        onClose={() => setIsBulkModalVisible(false)}
        title="Bulk Import Faculty (CSV / Tab)"
      >
        <View style={styles.formContainer}>
          <ThemedText style={{ fontSize: 12, color: themeColors.secondary }}>
            Paste Tab-separated or CSV list of professors (e.g. Employee ID, Name, Email, Dept).
          </ThemedText>
          
          <TextInput
            style={[
              styles.formInput, 
              { 
                height: 140, 
                backgroundColor: themeColors.background, 
                color: themeColors.text, 
                borderColor: themeColors.border, 
                fontFamily: Fonts.mono,
                textAlignVertical: 'top',
                paddingTop: 10
              }
            ]}
            placeholder={`e.g.\nEMP001\tDr. Rudragoud S.Patil\nEMP002\tDr. Vijay S. Rajpurohit`}
            placeholderTextColor={themeColors.secondary}
            value={bulkCsvText}
            onChangeText={setBulkCsvText}
            multiline
          />

          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: themeColors.primary, opacity: bulkSubmitting ? 0.7 : 1 }]}
            onPress={handleBulkImportTeachers}
            disabled={bulkSubmitting}
          >
            {bulkSubmitting ? (
              <ActivityIndicator color={colorScheme === 'dark' ? themeColors.background : '#FFFFFF'} />
            ) : (
              <ThemedText style={[styles.submitButtonText, { color: colorScheme === 'dark' ? themeColors.background : '#FFFFFF', fontFamily: Fonts.bold }]}>
                Upload & Import Faculty
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </AdminModal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    marginBottom: 16,
  },
  searchContainer: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teacherName: {
    fontSize: 16,
    marginBottom: 2,
  },
  teacherDept: {
    fontSize: 13,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    opacity: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
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
});

