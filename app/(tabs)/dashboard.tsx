import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Image, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { clearAuthState } from '@/utils/auth-storage';

import { AdminModal } from '@/components/admin-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { API_BASE_URL } from '@/constants/Config';
import { addLog, exportLogs } from '@/utils/logger';

const LOGO = require('@/assets/images/GIT_Connect_admin_logo.png');

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    students: '0',
    teachers: '0',
    divisions: '0',
    activeYear: 'None',
    attendanceToday: '0%',
    activities: []
  });

  const [isAyModalVisible, setIsAyModalVisible] = useState(false);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [newAyYear, setNewAyYear] = useState('');
  const [aySubmitting, setAySubmitting] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      { 
        text: 'Logout', 
        onPress: async () => {
          await clearAuthState();
          router.replace('/login');
        } 
      }
    ]);
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/academic-years`);
      if (res.ok) {
        const list = await res.json();
        setAcademicYears(list);
      }
    } catch (e) {
      console.error('Error fetching AY:', e);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      const stats = await response.json();
      addLog(`[Dashboard] Stats response: ${JSON.stringify(stats)}`);
      if (response.ok) {
        setData({
          students: stats.students.toString(),
          teachers: stats.teachers.toString(),
          divisions: stats.divisions.toString(),
          activeYear: stats.activeYear || 'None Set',
          attendanceToday: stats.attendanceToday,
          activities: stats.activities || []
        });
      } else {
        addLog(`[Dashboard] Failed to fetch stats. Status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      addLog(`[Dashboard] Fetch error: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAY = async () => {
    if (!newAyYear.trim()) {
      Alert.alert('Required', 'Please enter Academic Year format (e.g. 2024-25)');
      return;
    }
    setAySubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/academic-years`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: newAyYear, isActive: true }),
      });
      if (res.ok) {
        setNewAyYear('');
        fetchAcademicYears();
        fetchStats();
      } else {
        Alert.alert('Error', 'Failed to create academic year.');
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred while creating academic year.');
    } finally {
      setAySubmitting(false);
    }
  };

  const handleSetActiveAY = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/academic-years`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: true }),
      });
      if (res.ok) {
        fetchAcademicYears();
        fetchStats();
      }
    } catch (e) {
      console.error('Error setting active AY:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
      fetchAcademicYears();
    }, [])
  );

  const stats = [
    { label: 'Total Students', value: data.students, icon: 'people', color: themeColors.tertiary },
    { label: 'Total Teachers', value: data.teachers, icon: 'school', color: '#10B981' },
    { label: 'Active Divisions', value: data.divisions, icon: 'layers', color: '#F59E0B' },
    { label: 'Academic Year', value: data.activeYear, icon: 'calendar', color: themeColors.primary },
  ];

  const recentActivities = data.activities.length > 0 ? data.activities : [
    { title: 'System Initialized', time: 'Just now', type: 'system' },
    { title: 'No recent activity found', time: '', type: 'info' },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <View style={styles.headerInfo}>
          <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />
          <View>
            <ThemedText style={[styles.greeting, { color: themeColors.secondary }]}>Welcome back,</ThemedText>
            <ThemedText style={[styles.adminName, { fontFamily: Fonts.bold }]}>Administrator</ThemedText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
          ) : (
            stats.map((stat, index) => (
              <View 
                key={index} 
                style={[
                  styles.statCard, 
                  { backgroundColor: themeColors.surface, borderColor: themeColors.border }
                ]}
              >
                <View style={[styles.statIconContainer, { backgroundColor: stat.color + '15' }]}>
                  <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                </View>
                <ThemedText style={[styles.statValue, { fontFamily: Fonts.bold }]}>{stat.value}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: themeColors.secondary }]}>{stat.label}</ThemedText>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts.semiBold }]}>Quick Actions</ThemedText>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
            onPress={() => setIsAyModalVisible(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colorScheme === 'dark' ? themeColors.background : '#FFFFFF'} />
            <ThemedText style={[styles.actionButtonText, { color: colorScheme === 'dark' ? themeColors.background : '#FFFFFF', fontFamily: Fonts.semiBold }]}>
              Academic Years
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButtonSecondary, { borderColor: themeColors.primary }]} onPress={exportLogs}>
            <Ionicons name="download-outline" size={20} color={themeColors.primary} />
            <ThemedText style={[styles.actionButtonTextSecondary, { color: themeColors.primary, fontFamily: Fonts.semiBold, marginLeft: 8 }]}>
              Export Logs
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts.semiBold }]}>Recent Activity</ThemedText>
          <TouchableOpacity>
            <ThemedText style={[styles.seeAll, { color: themeColors.tertiary }]}>See All</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.activityList, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          {recentActivities.map((activity: any, index: number) => {
            let iconName: any = 'flash-outline';
            let iconColor = themeColors.tertiary;

            if (activity.type === 'student') { iconName = 'person-add-outline'; iconColor = themeColors.tertiary; }
            else if (activity.type === 'teacher') { iconName = 'school-outline'; iconColor = '#10B981'; }
            else if (activity.type === 'subject') { iconName = 'book-outline'; iconColor = '#F59E0B'; }
            else if (activity.type === 'system') { iconName = 'settings-outline'; iconColor = themeColors.primary; }

            return (
              <View 
                key={index} 
                style={[
                  styles.activityItem, 
                  { borderBottomColor: index === recentActivities.length - 1 ? 'transparent' : themeColors.border }
                ]}
              >
                <View style={[styles.activityIconSmall, { backgroundColor: iconColor + '15' }]}>
                  <Ionicons name={iconName} size={14} color={iconColor} />
                </View>
                <View style={styles.activityInfo}>
                  <ThemedText style={[styles.activityTitle, { fontFamily: Fonts.semiBold }]}>{activity.title}</ThemedText>
                  <ThemedText style={[styles.activityTime, { color: themeColors.secondary }]}>{activity.time}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={themeColors.secondary} />
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Academic Year Management Modal */}
      <AdminModal
        visible={isAyModalVisible}
        onClose={() => setIsAyModalVisible(false)}
        title="Manage Academic Years"
      >
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              style={{
                flex: 1,
                height: 48,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text,
                paddingHorizontal: 12,
                fontFamily: Fonts.sans
              }}
              placeholder="e.g. 2024-25"
              placeholderTextColor={themeColors.secondary}
              value={newAyYear}
              onChangeText={setNewAyYear}
            />
            <TouchableOpacity
              style={{
                height: 48,
                paddingHorizontal: 16,
                backgroundColor: themeColors.primary,
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={handleCreateAY}
              disabled={aySubmitting}
            >
              <ThemedText style={{ color: colorScheme === 'dark' ? themeColors.background : '#FFFFFF', fontFamily: Fonts.bold }}>Add & Set Active</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={{ fontFamily: Fonts.semiBold, marginTop: 8 }}>Existing Academic Years:</ThemedText>
          {academicYears.length === 0 ? (
            <ThemedText style={{ color: themeColors.secondary, fontStyle: 'italic' }}>No academic years defined yet.</ThemedText>
          ) : (
            academicYears.map((ay) => (
              <TouchableOpacity
                key={ay.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: ay.isActive ? themeColors.primary : themeColors.border,
                  backgroundColor: ay.isActive ? themeColors.primary + '10' : themeColors.surface
                }}
                onPress={() => handleSetActiveAY(ay.id)}
              >
                <ThemedText style={{ fontFamily: Fonts.semiBold }}>{ay.year}</ThemedText>
                {ay.isActive ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={18} color={themeColors.primary} />
                    <ThemedText style={{ color: themeColors.primary, fontFamily: Fonts.semiBold, fontSize: 12 }}>Active</ThemedText>
                  </View>
                ) : (
                  <ThemedText style={{ color: themeColors.secondary, fontSize: 12 }}>Set Active</ThemedText>
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
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 14,
  },
  adminName: {
    fontSize: 18,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: (width - 64) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonSecondary: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
  },
  actionButtonTextSecondary: {
    fontSize: 14,
  },
  activityList: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
  },
  loadingContainer: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
