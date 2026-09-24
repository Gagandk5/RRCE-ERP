import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function MobileIndex() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>VTU / AICTE AFFILIATED</Text>
        </View>
        <Text style={styles.title}>RRCE ERP</Text>
        <Text style={styles.subtitle}>RajaRajeswari College of Engineering</Text>
        <Text style={styles.tagline}>Native Mobile Suite for Faculty & Students</Text>
      </View>

      <View style={styles.cardsContainer}>
        {/* Faculty Card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => router.push('/faculty/roll-call')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardRole}>FACULTY PORTAL</Text>
            <Text style={styles.cardTag}>24h Lockout</Text>
          </View>
          <Text style={styles.cardTitle}>Rapid Classroom Roll-Call</Text>
          <Text style={styles.cardDesc}>
            Quick attendance roster sorted by natural usnSequence (001, 002...), large touch targets with haptic feedback, and 'Mark All Present'.
          </Text>
          <View style={styles.actionBtn}>
            <Text style={styles.actionText}>Launch Roll-Call →</Text>
          </View>
        </TouchableOpacity>

        {/* Student Card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => router.push('/student/dashboard')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardRole}>STUDENT PORTAL</Text>
            <Text style={styles.cardTag}>Threshold: 75%</Text>
          </View>
          <Text style={styles.cardTitle}>Attendance Ring & Timetable</Text>
          <Text style={styles.cardDesc}>
            Visual attendance gauge with VTU 75% threshold warning ring, day schedule with room numbers, and study notes viewer.
          </Text>
          <View style={styles.actionBtn}>
            <Text style={styles.actionText}>View Student Dashboard →</Text>
          </View>
        </TouchableOpacity>

        {/* Login Option */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.secondaryBtnText}>Institutional USN Login & Reset Modal</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#091428',
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgeText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
  },
  tagline: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#0f2347',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e3a6a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardRole: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  cardTag: {
    fontSize: 10,
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 14,
  },
  actionBtn: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
  },
  actionText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 13,
  },
  secondaryBtn: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryBtnText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 12,
  },
});

