import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export default function FacultyRollCallScreen() {
  const [selectedClass, setSelectedClass] = useState('25BC101');
  const [students, setStudents] = useState([
    { id: '1', seq: 1, usn: '1RR25BC001', name: 'Aarav Patel', status: 'PRESENT' },
    { id: '2', seq: 2, usn: '1RR25BC002', name: 'Ananya Iyer', status: 'PRESENT' },
    { id: '3', seq: 3, usn: '1RR25BC003', name: 'Bhavya Rao', status: 'PRESENT' },
    { id: '4', seq: 4, usn: '1RR25BC004', name: 'Chetan Verma', status: 'PRESENT' },
    { id: '5', seq: 5, usn: '1RR25BC005', name: 'Deepak Nair', status: 'PRESENT' },
    { id: '6', seq: 6, usn: '1RR25BC006', name: 'Esha Deshmukh', status: 'PRESENT' },
    { id: '7', seq: 7, usn: '1RR25BC007', name: 'Gagan R', status: 'PRESENT' },
    { id: '8', seq: 8, usn: '1RR25BC008', name: 'Rahul Sharma', status: 'ABSENT' },
    { id: '9', seq: 9, usn: '1RR25BC009', name: 'Priya Kumar', status: 'EXCUSED' },
  ]);

  const [isLocked, setIsLocked] = useState(false);

  const triggerHaptic = async (style: Haptics.ImpactFeedbackStyle) => {
    try {
      await Haptics.impactAsync(style);
    } catch (e) {
      // Haptics optional fallback
    }
  };

  const handleToggleStatus = (id: string, newStatus: string) => {
    if (isLocked) {
      Alert.alert('Session Locked', '24-hour edit lockout has expired.');
      return;
    }
    const hapticStyle =
      newStatus === 'PRESENT'
        ? Haptics.ImpactFeedbackStyle.Light
        : newStatus === 'ABSENT'
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium;
    triggerHaptic(hapticStyle);

    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  const handleMarkAllPresent = () => {
    if (isLocked) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'PRESENT' })));
    Alert.alert('Rapid Roll-Call', 'All 9 students marked PRESENT.');
  };

  const handleSave = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Success', 'Attendance roll-call saved to institutional database.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Class Selector Bar */}
      <View style={styles.selectorBar}>
        <TouchableOpacity
          style={[styles.classTab, selectedClass === '25BC101' && styles.classTabActive]}
          onPress={() => setSelectedClass('25BC101')}
        >
          <Text style={[styles.classTabText, selectedClass === '25BC101' && styles.classTabTextActive]}>
            25BC101 • Discrete Math (09:00)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.classTab, selectedClass === '25CS101' && styles.classTabActive]}
          onPress={() => setSelectedClass('25CS101')}
        >
          <Text style={[styles.classTabText, selectedClass === '25CS101' && styles.classTabTextActive]}>
            25CS101 • Engg Math (11:00)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Roster Header */}
      <View style={styles.rosterCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.headerTitle}>BCA Semester 1 • Sec A</Text>
            <Text style={styles.headerSub}>
              Ordered by usnSequence ASC (001, 002...)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.allPresentBtn}
            onPress={handleMarkAllPresent}
          >
            <Text style={styles.allPresentText}>All Present</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.lockoutBadge}>
          <Text style={styles.lockoutText}>
            ● 24h Edit Window: Active (22 hours remaining)
          </Text>
        </View>

        {/* Student Rows */}
        <View style={styles.list}>
          {students.map((student) => (
            <View key={student.id} style={styles.row}>
              <View style={styles.studentInfo}>
                <Text style={styles.seqText}>{String(student.seq).padStart(3, '0')}</Text>
                <View>
                  <Text style={styles.usnText}>{student.usn}</Text>
                  <Text style={styles.nameText}>{student.name}</Text>
                </View>
              </View>

              {/* Large Touch Targets */}
              <View style={styles.btnGroup}>
                <TouchableOpacity
                  style={[
                    styles.touchTarget,
                    student.status === 'PRESENT' ? styles.presentActive : styles.btnInactive,
                  ]}
                  onPress={() => handleToggleStatus(student.id, 'PRESENT')}
                >
                  <Text style={styles.btnLabel}>P</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.touchTarget,
                    student.status === 'ABSENT' ? styles.absentActive : styles.btnInactive,
                  ]}
                  onPress={() => handleToggleStatus(student.id, 'ABSENT')}
                >
                  <Text style={styles.btnLabel}>A</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.touchTarget,
                    student.status === 'LATE' ? styles.lateActive : styles.btnInactive,
                  ]}
                  onPress={() => handleToggleStatus(student.id, 'LATE')}
                >
                  <Text style={styles.btnLabel}>L</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
          <Text style={styles.submitBtnText}>Submit Roll-Call</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#091428',
    flexGrow: 1,
  },
  selectorBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  classTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#0f2347',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e3a6a',
    alignItems: 'center',
  },
  classTabActive: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  classTabText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  classTabTextActive: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  rosterCard: {
    backgroundColor: '#0f2347',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e3a6a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 11,
    color: '#f59e0b',
    marginTop: 2,
  },
  allPresentBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  allPresentText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  lockoutBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 8,
    padding: 6,
    marginBottom: 14,
  },
  lockoutText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  seqText: {
    fontFamily: 'monospace',
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: 'bold',
    width: 30,
  },
  usnText: {
    fontFamily: 'monospace',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  nameText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  touchTarget: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  presentActive: {
    backgroundColor: '#10b981',
  },
  absentActive: {
    backgroundColor: '#ef4444',
  },
  lateActive: {
    backgroundColor: '#f59e0b',
  },
  btnInactive: {
    backgroundColor: '#1e293b',
  },
  submitBtn: {
    backgroundColor: '#f59e0b',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnText: {
    color: '#091428',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

