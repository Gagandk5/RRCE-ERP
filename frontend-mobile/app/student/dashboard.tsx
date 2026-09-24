import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default function StudentDashboardScreen() {
  const [percentage, setPercentage] = useState(100.0);
  const isEligible = percentage >= 75.0;

  const schedule = [
    { time: '09:00 - 10:00', code: '25BC101', name: 'Discrete Mathematics', room: 'LH-204', faculty: 'Prof. Ananya' },
    { time: '10:00 - 11:00', code: '25BC102', name: 'Data Structures', room: 'LH-204', faculty: 'Prof. Chethan' },
    { time: '11:15 - 12:15', code: '25BC103', name: 'Web Programming Lab', room: 'Lab-3', faculty: 'Prof. Chethan' },
  ];

  const materials = [
    { title: 'Unit 1: Propositional Logic Notes', course: 'Discrete Mathematics', size: '2.4 MB PDF' },
    { title: 'Unit 2: Linear Data Structures', course: 'Data Structures', size: '4.1 MB PDF' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Student Badge Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>GR</Text>
        </View>
        <View style={styles.profileDetails}>
          <Text style={styles.studentName}>Gagan R</Text>
          <Text style={styles.studentUsn}>1RR25BC007</Text>
          <Text style={styles.studentMeta}>BCA Semester 1 • Sec A • CET Quota</Text>
        </View>
      </View>

      {/* Visual Circular Attendance Gauge */}
      <View style={styles.gaugeCard}>
        <View style={styles.gaugeHeader}>
          <Text style={styles.gaugeTitle}>VTU ATTENDANCE STATUS</Text>
          <TouchableOpacity onPress={() => setPercentage((prev) => (prev >= 75 ? 64.0 : 100.0))}>
            <Text style={styles.toggleTestText}>
              Simulate {percentage >= 75 ? '<75% Warning' : '100% Eligible'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.ringContainer, isEligible ? styles.ringEligible : styles.ringShortage]}>
          <Text style={styles.percentageText}>{percentage.toFixed(1)}%</Text>
          <Text style={[styles.statusBadge, isEligible ? styles.statusEligible : styles.statusShortage]}>
            {isEligible ? 'EXAM ELIGIBLE' : 'SHORTAGE ALERT'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Conducted</Text>
            <Text style={styles.statVal}>24</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Attended</Text>
            <Text style={[styles.statVal, { color: '#10b981' }]}>
              {percentage >= 75 ? '24' : '15'}
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Excused (OD)</Text>
            <Text style={[styles.statVal, { color: '#38bdf8' }]}>2</Text>
          </View>
        </View>
        <Text style={styles.gaugeFooter}>Statutory VTU Rule: 75% minimum mandatory</Text>
      </View>

      {/* Today's Schedule */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        <View style={styles.scheduleList}>
          {schedule.map((item, idx) => (
            <View key={idx} style={styles.scheduleItem}>
              <View>
                <Text style={styles.itemTime}>{item.time}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemFaculty}>{item.faculty}</Text>
              </View>
              <View style={styles.roomBadge}>
                <Text style={styles.roomText}>{item.room}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Course Materials */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Course Study Materials</Text>
        <View style={styles.scheduleList}>
          {materials.map((m, idx) => (
            <View key={idx} style={styles.materialItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.materialCourse}>{m.course}</Text>
                <Text style={styles.materialTitle}>{m.title}</Text>
              </View>
              <Text style={styles.materialSize}>{m.size}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#091428',
    flexGrow: 1,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#0f2347',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#1e3a6a',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#091428',
  },
  profileDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  studentUsn: {
    fontFamily: 'monospace',
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 1,
  },
  studentMeta: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  gaugeCard: {
    backgroundColor: '#0f2347',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e3a6a',
    alignItems: 'center',
  },
  gaugeHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gaugeTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  toggleTestText: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  ringContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  ringEligible: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  ringShortage: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  percentageText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusEligible: {
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusShortage: {
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#091428',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  gaugeFooter: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 10,
  },
  sectionCard: {
    backgroundColor: '#0f2347',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e3a6a',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  scheduleList: {
    gap: 10,
  },
  scheduleItem: {
    backgroundColor: '#091428',
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  itemTime: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  itemName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 1,
  },
  itemFaculty: {
    fontSize: 11,
    color: '#94a3b8',
  },
  roomBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roomText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#38bdf8',
    fontFamily: 'monospace',
  },
  materialItem: {
    backgroundColor: '#091428',
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  materialCourse: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  materialTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 1,
  },
  materialSize: {
    fontSize: 10,
    color: '#64748b',
  },
});

