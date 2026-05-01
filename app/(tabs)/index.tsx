import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    students: '0',
    teachers: '0',
    divisions: '0',
    attendanceToday: '0%',
    activities: []
  });

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const stats = await response.json();
      if (response.ok) {
        setData({
          students: stats.students.toString(),
          teachers: stats.teachers.toString(),
          divisions: stats.divisions.toString(),
          attendanceToday: stats.attendanceToday,
          activities: stats.activities || []
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const stats = [
    { label: 'Total Students', value: data.students, icon: 'people', color: themeColors.tertiary },
    { label: 'Total Teachers', value: data.teachers, icon: 'school', color: '#10B981' },
    { label: 'Active Divisions', value: data.divisions, icon: 'layers', color: '#F59E0B' },
    { label: 'Today\'s Attendance', value: data.attendanceToday, icon: 'checkmark-circle', color: themeColors.primary },
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
        <View>
          <ThemedText style={[styles.greeting, { color: themeColors.secondary }]}>Welcome back,</ThemedText>
          <ThemedText style={[styles.adminName, { fontFamily: Fonts.bold }]}>Administrator</ThemedText>
        </View>
        <TouchableOpacity style={[styles.profileButton, { backgroundColor: themeColors.background }]}>
          <Ionicons name="notifications-outline" size={24} color={themeColors.text} />
        </TouchableOpacity>
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
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: themeColors.primary }]}>
            <Ionicons name="add-circle" size={20} color={colorScheme === 'dark' ? themeColors.background : '#FFFFFF'} />
            <ThemedText style={[styles.actionButtonText, { color: colorScheme === 'dark' ? themeColors.background : '#FFFFFF', fontFamily: Fonts.semiBold }]}>
              Mark Attendance
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButtonSecondary, { borderColor: themeColors.primary }]}>
            <ThemedText style={[styles.actionButtonTextSecondary, { color: themeColors.primary, fontFamily: Fonts.semiBold }]}>
              Generate Report
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
          {recentActivities.map((activity, index) => {
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
    fontSize: 20,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
