import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AdminModal } from '@/components/admin-modal';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DivisionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  const [divisions, setDivisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeYearId, setActiveYearId] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      const statsRes = await fetch('/api/stats');
      const stats = await statsRes.json();
      
      if (stats.activeYearId) {
        setActiveYearId(stats.activeYearId);
      }
      
      const res = await fetch('/api/divisions');
      const data = await res.json();
      if (res.ok) {
        setDivisions(data);
      }
    } catch (error) {
      console.error('Error fetching divisions:', error);
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
  const [editingDivision, setEditingDivision] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    dept: '',
    semester: '',
  });

  const openModal = (division?: any) => {
    if (division) {
      setEditingDivision(division);
      setForm({
        name: division.name,
        dept: division.department || division.dept,
        semester: division.semester.toString(),
      });
    } else {
      setEditingDivision(null);
      setForm({ name: '', dept: '', semester: '' });
    }
    setIsModalVisible(true);
  };

  const handleSaveDivision = async () => {
    if (!form.name || !form.dept || !form.semester) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const method = editingDivision ? 'PUT' : 'POST';
      const body = {
        ...form,
        id: editingDivision?.id,
        academicYearId: activeYearId || '00000000-0000-0000-0000-000000000000',
        department: form.dept, // Ensure consistent field name
      };

      const response = await fetch('/api/divisions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchInitialData();
        setIsModalVisible(false);
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to save division');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDivision = (id: string) => {
    Alert.alert(
      'Delete Division',
      'Are you sure you want to delete this division? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`/api/divisions?id=${id}`, { method: 'DELETE' });
              if (response.ok) {
                fetchInitialData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete division');
            }
          }
        }
      ]
    );
  };

  const renderDivisionItem = ({ item }: { item: typeof divisions[0] }) => (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <TouchableOpacity 
        style={styles.cardInfo}
        onPress={() => router.push({ pathname: '/(tabs)/students', params: { divisionId: item.id, divisionName: item.name } })}
      >
        <ThemedText style={[styles.divName, { fontFamily: Fonts.bold }]}>{item.name}</ThemedText>
        <ThemedText style={[styles.deptName, { color: themeColors.secondary }]}>{item.department || item.dept}</ThemedText>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={themeColors.tertiary} />
            <ThemedText style={styles.metaText}>{item.students || 0} Students</ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="book-outline" size={14} color={themeColors.tertiary} />
            <ThemedText style={styles.metaText}>{item.subjects || 0} Subjects</ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={themeColors.tertiary} />
            <ThemedText style={styles.metaText}>Sem {item.semester}</ThemedText>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.actionColumn}>
        <TouchableOpacity style={styles.actionButton} onPress={() => openModal(item)}>
          <Ionicons name="create-outline" size={20} color={themeColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteDivision(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <ThemedText style={[styles.title, { fontFamily: Fonts.bold }]}>Division Management</ThemedText>
        <ThemedText style={[styles.subtitle, { color: themeColors.secondary }]}>Manage academic groups and enrollment</ThemedText>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <ThemedText style={styles.loadingText}>Loading divisions...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={divisions}
          renderItem={renderDivisionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: themeColors.primary }]}
        onPress={() => openModal()}
      >
        <Ionicons name="add" size={30} color={colorScheme === 'dark' ? themeColors.background : '#FFFFFF'} />
      </TouchableOpacity>

      {/* Add/Edit Division Modal */}
      <AdminModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        title={editingDivision ? "Edit Division" : "Create New Division"}
      >
        <View style={styles.formContainer}>
          <View style={styles.inputField}>
            <ThemedText style={[styles.inputLabel, { fontFamily: Fonts.semiBold }]}>Division Name *</ThemedText>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border, fontFamily: Fonts.sans }]}
              placeholder="e.g. CS-C"
              value={form.name}
              onChangeText={(text) => setForm({...form, name: text})}
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
            <ThemedText style={[styles.inputLabel, { fontFamily: Fonts.semiBold }]}>Semester *</ThemedText>
            <TextInput
              style={[styles.formInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border, fontFamily: Fonts.sans }]}
              placeholder="e.g. 4"
              keyboardType="numeric"
              value={form.semester}
              onChangeText={(text) => setForm({...form, semester: text})}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: themeColors.primary, opacity: submitting ? 0.7 : 1 }]}
            onPress={handleSaveDivision}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colorScheme === 'dark' ? themeColors.background : '#FFFFFF'} />
            ) : (
              <ThemedText style={[styles.submitButtonText, { color: colorScheme === 'dark' ? themeColors.background : '#FFFFFF', fontFamily: Fonts.bold }]}>
                {editingDivision ? "Update Division" : "Create Division"}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </AdminModal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, borderBottomWidth: 1 },
  title: { fontSize: 22, marginBottom: 4 },
  subtitle: { fontSize: 14 },
  listContent: { padding: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardInfo: { flex: 1 },
  divName: { fontSize: 18, marginBottom: 2 },
  deptName: { fontSize: 13, marginBottom: 12 },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '500' },
  actionColumn: {
    flexDirection: 'column',
    gap: 12,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
  },
  actionButton: {
    padding: 4,
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
