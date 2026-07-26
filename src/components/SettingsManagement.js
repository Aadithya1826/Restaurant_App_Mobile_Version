import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function SettingsManagement() {
  const { logout, user } = useAuth();
  const navigation = useNavigation();

  // Mock states for toggles
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isAutoPrintEnabled, setIsAutoPrintEnabled] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>AS</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.name || 'Anand Sharma'}</Text>
            <Text style={styles.profileRole}>Manager - Data Udipi</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* RESTAURANT INFO */}
      <Text style={styles.sectionTitle}>RESTAURANT INFO</Text>
      <View style={styles.listCard}>
        <View style={styles.listItem}>
          <Text style={styles.listLabel}>Phone Number</Text>
          <Text style={styles.listValue}>+91 79043 46359</Text>
        </View>
        <View style={[styles.listItem, styles.borderTop]}>
          <Text style={styles.listLabel}>Email</Text>
          <Text style={styles.listValue}>contact@dataudipi.com</Text>
        </View>
        <View style={[styles.listItem, styles.borderTop]}>
          <Text style={styles.listLabel}>Address</Text>
          <Text style={styles.listValue}>51, Anna Main Road, MGR Nagar, Chennai 600 078</Text>
        </View>
      </View>

      {/* PREFERENCES */}
      <Text style={styles.sectionTitle}>PREFERENCES</Text>
      <View style={styles.listCard}>
        <View style={styles.listItemRow}>
          <Text style={styles.listTitle}>Dark Mode</Text>
          <Switch 
            value={isDarkMode} 
            onValueChange={setIsDarkMode} 
            trackColor={{ false: '#e2e8f0', true: '#ff5722' }}
            thumbColor={'#ffffff'}
          />
        </View>
        <View style={[styles.listItemRow, styles.borderTop]}>
          <Text style={styles.listTitle}>Notifications</Text>
          <Switch 
            value={isNotificationsEnabled} 
            onValueChange={setIsNotificationsEnabled} 
            trackColor={{ false: '#e2e8f0', true: '#ff5722' }}
            thumbColor={'#ffffff'}
          />
        </View>
        <View style={[styles.listItemRow, styles.borderTop]}>
          <Text style={styles.listTitle}>Auto-print Bills</Text>
          <Switch 
            value={isAutoPrintEnabled} 
            onValueChange={setIsAutoPrintEnabled} 
            trackColor={{ false: '#e2e8f0', true: '#ff5722' }}
            thumbColor={'#ffffff'}
          />
        </View>
      </View>

      {/* APP SETTINGS */}
      <Text style={styles.sectionTitle}>APP SETTINGS</Text>
      <View style={styles.listCard}>
        <View style={styles.listItemRow}>
          <Text style={styles.listTitle}>Language</Text>
          <Text style={styles.listValueRight}>English</Text>
        </View>
        <View style={[styles.listItemRow, styles.borderTop]}>
          <Text style={styles.listTitle}>Currency</Text>
          <Text style={styles.listValueRight}>INR (₹)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 35,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: '#94a3b8',
  },
  signOutBtn: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signOutText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 10,
    marginLeft: 5,
    letterSpacing: 0.5,
  },
  listCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 30,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  listItem: {
    padding: 20,
  },
  listItemRow: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  listLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  listValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  listTitle: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  listValueRight: {
    fontSize: 15,
    color: '#64748b',
  },
});
