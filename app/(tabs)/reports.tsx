import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/constants/api';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);

  const fetchReports = async () => {
    try {
      const response = await apiClient('/api/reports');
      const data = await response.json();
      if (response.ok) {
        setReports(data.map((r: any, index: number) => ({
          name: r.name,
          percentage: r.percentage,
          color: [themeColors.tertiary, themeColors.primary, '#10B981', '#F59E0B'][index % 4]
        })));
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [])
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <ThemedText style={[styles.title, { fontFamily: Fonts.bold }]}>Administrative Reports</ThemedText>
        <TouchableOpacity style={[styles.datePicker, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
          <Ionicons name="calendar-outline" size={18} color={themeColors.secondary} />
          <ThemedText style={[styles.dateText, { fontFamily: Fonts.semiBold }]}>Last 30 Days</ThemedText>
          <Ionicons name="chevron-down" size={14} color={themeColors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Overview Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.miniStatCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <ThemedText style={[styles.miniStatValue, { fontFamily: Fonts.bold }]}>94.5%</ThemedText>
            <ThemedText style={[styles.miniStatLabel, { color: themeColors.secondary }]}>Overall Attendance</ThemedText>
          </View>
          <View style={[styles.miniStatCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <ThemedText style={[styles.miniStatValue, { fontFamily: Fonts.bold }]}>1,240</ThemedText>
            <ThemedText style={[styles.miniStatLabel, { color: themeColors.secondary }]}>Classes Held</ThemedText>
          </View>
        </View>

        {/* Division Chart */}
        <ThemedView style={[styles.chartCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <ThemedText style={[styles.chartTitle, { fontFamily: Fonts.semiBold }]}>Division-wise Enrollment</ThemedText>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="stats-chart-outline" size={40} color={themeColors.secondary} />
              <ThemedText style={styles.emptyText}>No data available</ThemedText>
            </View>
          ) : (
            <View style={styles.chartContainer}>
              {reports.map((item, index) => (
                <View key={index} style={styles.barWrapper}>
                  <View style={styles.barBackground}>
                    <View 
                      style={[
                        styles.barFill, 
                        { 
                          height: `${item.percentage}%`, 
                          backgroundColor: item.color 
                        }
                      ]} 
                    />
                  </View>
                  <ThemedText style={styles.barLabel}>{item.name}</ThemedText>
                  <ThemedText style={[styles.barPercent, { color: item.color }]}>{item.percentage}%</ThemedText>
                </View>
              ))}
            </View>
          )}
        </ThemedView>

        {/* Export Options */}
        <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts.semiBold }]}>Export Data</ThemedText>
        <View style={styles.exportGrid}>
          <TouchableOpacity style={[styles.exportButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Ionicons name="document-text-outline" size={24} color={themeColors.primary} />
            <ThemedText style={[styles.exportText, { fontFamily: Fonts.semiBold }]}>Download CSV</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Ionicons name="document-outline" size={24} color="#EF4444" />
            <ThemedText style={[styles.exportText, { fontFamily: Fonts.semiBold }]}>Download PDF</ThemedText>
          </TouchableOpacity>
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
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    marginBottom: 16,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 8,
  },
  dateText: {
    fontSize: 13,
  },
  scrollContent: {
    padding: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  miniStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  miniStatValue: {
    fontSize: 20,
    marginBottom: 4,
  },
  miniStatLabel: {
    fontSize: 12,
  },
  chartCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 32,
  },
  chartTitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 200,
    alignItems: 'flex-end',
  },
  barWrapper: {
    alignItems: 'center',
    width: 50,
  },
  barBackground: {
    width: 12,
    height: 140,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 12,
    marginTop: 12,
    fontWeight: '500',
  },
  barPercent: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  exportGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  exportButton: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  exportText: {
    fontSize: 13,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.5,
  },
});
