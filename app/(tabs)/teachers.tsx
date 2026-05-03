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
import { apiClient } from '@/constants/api';

export default function TeachersScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for data management
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeachers = async () => {
    try {
      const response = await apiClient('/api/teachers');
      const data = await response.json();
      if (response.ok) {
        // Map API data to UI format if needed
        const mappedTeachers = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          dept: t.department || 'General',
          idNo: t.employeeId,
          email: t.email || '',
          subjects: [] // Subjects might need another fetch or join
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

  const handleSaveTeacher = async () => {
    if (!form.name || !form.idNo || !form.dept) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
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

      const response = await apiClient('/api/teachers', {
        method,
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
              const response = await apiClient(`/api/teachers?id=${id}`, { method: 'DELETE' });
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

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <ThemedText style={[styles.title, { fontFamily: Fonts.bold }]}>Teacher Management</ThemedText>
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

