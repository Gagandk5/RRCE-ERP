import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

const DEMO_ACCOUNTS = [
  { label: 'Principal', identifier: 'principal@rrce.org', pass: 'Password@123', route: '/faculty/roll-call' },
  { label: 'Admission', identifier: 'admissions@rrce.org', pass: 'Password@123', route: '/faculty/roll-call' },
  { label: 'HOD BCA', identifier: 'hod.bca@rrce.org', pass: 'Password@123', route: '/faculty/roll-call' },
  { label: 'Faculty (Math)', identifier: 'faculty.math@rrce.org', pass: 'Password@123', route: '/faculty/roll-call' },
  { label: 'Student (Gagan)', identifier: '1RR25BC007', pass: 'GAG141207', route: '/student/dashboard' },
];

export default function MobileLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('1RR25BC007');
  const [password, setPassword] = useState('GAG141207');
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = (idVal?: string, passVal?: string) => {
    const targetId = idVal || identifier;
    const targetPass = passVal || password;

    // Check if default student password used
    if (targetId.toUpperCase() === '1RR25BC007' && targetPass === 'GAG141207') {
      setIsResetModalVisible(true);
      return;
    }

    if (targetId.startsWith('1RR')) {
      router.push('/student/dashboard');
    } else {
      router.push('/faculty/roll-call');
    }
  };

  const handleDemoClick = (demo: (typeof DEMO_ACCOUNTS)[0]) => {
    setIdentifier(demo.identifier);
    setPassword(demo.pass);
    handleLogin(demo.identifier, demo.pass);
  };

  const handleCompleteReset = () => {
    if (newPassword.length < 6) {
      Alert.alert('Invalid Password', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setIsResetModalVisible(false);
    Alert.alert('Password Updated', 'Mandatory reset cleared. Redirecting to student portal...', [
      { text: 'OK', onPress: () => router.push('/student/dashboard') },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Institutional Login</Text>
        <Text style={styles.subtitle}>Enter your USN or Faculty Employee Code</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>USN / Username</Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="e.g. 1RR25BC007"
            placeholderTextColor="#64748b"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password..."
            placeholderTextColor="#64748b"
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.loginBtn} activeOpacity={0.8} onPress={() => handleLogin()}>
          <Text style={styles.loginBtnText}>Log In to RRCE ERP</Text>
        </TouchableOpacity>

        {/* 5 One-Click Demo Buttons */}
        <View style={styles.demoSection}>
          <Text style={styles.demoSectionTitle}>One-Click Demo Accounts</Text>
          <View style={styles.demoList}>
            {DEMO_ACCOUNTS.map((acc, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.demoBtn}
                onPress={() => handleDemoClick(acc)}
              >
                <Text style={styles.demoBtnLabel}>{acc.label}</Text>
                <Text style={styles.demoBtnDetail}>{acc.identifier}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Mandatory Password Reset Interceptor Modal */}
      <Modal visible={isResetModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mandatory Password Reset</Text>
            <Text style={styles.modalAlert}>HTTP 403: PASSWORD_CHANGE_REQUIRED</Text>
            <Text style={styles.modalDesc}>
              VTU Security Mandate: First-time student login requires setting a custom private password before accessing academic records.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password (min 6 chars)</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#64748b"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                placeholderTextColor="#64748b"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.resetBtn} onPress={handleCompleteReset}>
              <Text style={styles.resetBtnText}>Update Password &amp; Unlock</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  card: {
    backgroundColor: '#0f2347',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e3a6a',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#cbd5e1',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#091428',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  loginBtn: {
    backgroundColor: '#f59e0b',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#091428',
    fontWeight: 'bold',
    fontSize: 14,
  },
  demoSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  demoSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f59e0b',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  demoList: {
    gap: 8,
  },
  demoBtn: {
    backgroundColor: '#091428',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  demoBtnLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  demoBtnDetail: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0f2347',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalAlert: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginTop: 2,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: '#f59e0b',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetBtnText: {
    color: '#091428',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
