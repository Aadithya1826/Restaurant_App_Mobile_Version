import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ImageBackground, Image, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { restaurantService } from '../services/api';
import { ChevronRight, AlertCircle, Eye, EyeOff, User, Utensils, Banknote } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

const RestaurantBG = require('../assets/restaurant_bg.png');
const UdupiBanner = require('../assets/udupi-banner.png');
const DataudipiTitle = require('../assets/Dataudupi-Title.png');
const ChefMascot = require('../assets/chef_mascot.png');

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const { user, isAuthenticated, login, signup } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'SUPER_ADMIN') {
        navigation.replace('AdminDashboard');
      } else if (user.role === 'CASHIER') {
        navigation.replace('CashierDashboard');
      } else {
        navigation.replace('ManagerDashboard');
      }
    }
  }, [isAuthenticated, user, navigation]);

  const [step, setStep] = useState('role'); 
  const [selectedRole, setSelectedRole] = useState(null);
  const [authMode, setAuthMode] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    restaurant_id: '',
  });
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantLoading, setRestaurantLoading] = useState(false);

  const roles = [
    {
      id: 'super_admin',
      label: 'Super Admin',
      abbreviation: 'SA',
      description: 'Manage hotels, venues & managers',
      color: '#f97316'
    },
    {
      id: 'hotel_manager',
      label: 'Hotel Manager',
      abbreviation: 'HM',
      description: 'Manage daily restaurant operations',
      color: '#22c55e'
    },
    {
      id: 'cashier',
      label: 'Cashier',
      abbreviation: 'CA',
      description: 'Manage cash payments and bill generation',
      color: '#f97316'
    },
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError('');
    setSuccessMessage('');
    setFormData({ name: '', email: '', password: '', confirmPassword: '', restaurant_id: '' });
    setAuthMode('login');
    setStep('auth');
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      if ((selectedRole !== 'hotel_manager' && selectedRole !== 'cashier') || step !== 'auth') {
        return;
      }
      setRestaurantLoading(true);
      try {
        const data = await restaurantService.getPublicRestaurants();
        setRestaurants(data);
      } catch (err) {
        setError('Unable to load restaurant list.');
      } finally {
        setRestaurantLoading(false);
      }
    };
    fetchRestaurants();
  }, [selectedRole, step]);

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleAuthSubmit = async () => {
    setError('');
    if (authMode === 'login') {
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        return;
      }
      let roleParam = 'HOTEL_ADMIN';
      if (selectedRole === 'super_admin') roleParam = 'SUPER_ADMIN';
      else if (selectedRole === 'cashier') roleParam = 'CASHIER';
      
      setLoading(true);
      try {
        await login(formData.email, formData.password, roleParam);
      } catch (err) {
        setError(err.response?.data?.detail || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      let roleParam = 'HOTEL_ADMIN';
      if (selectedRole === 'super_admin') roleParam = 'SUPER_ADMIN';
      else if (selectedRole === 'cashier') roleParam = 'CASHIER';

      if ((roleParam === 'HOTEL_ADMIN' || roleParam === 'CASHIER') && !formData.restaurant_id) {
        setError(`Please select a restaurant.`);
        return;
      }
      setLoading(true);
      try {
        await signup(
          formData.name,
          formData.email,
          formData.password,
          roleParam,
          (roleParam === 'HOTEL_ADMIN' || roleParam === 'CASHIER') ? formData.restaurant_id : null
        );
        setSuccessMessage('Signup done successfully. Please sign in to login.');
        setAuthMode('login');
      } catch (err) {
        setError(err.response?.data?.detail || 'Signup failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const renderAccountHeader = () => {
    let Icon = User;
    let title = 'Super Admin Account';
    if (selectedRole === 'hotel_manager') { Icon = Utensils; title = 'Hotel Manager Account'; }
    if (selectedRole === 'cashier') { Icon = Banknote; title = 'Cashier Account'; }
    
    return (
      <View style={styles.accountHeaderBtn}>
        <Icon color="#f97316" size={16} style={{marginRight: 8}} />
        <Text style={styles.accountHeaderText}>{title}</Text>
      </View>
    );
  };

  if (step === 'role') {
    return (
      <ImageBackground source={RestaurantBG} style={styles.container} resizeMode="cover" blurRadius={10}>
        <View style={styles.overlay}>
          <Image source={UdupiBanner} style={styles.topFixedBanner} resizeMode="contain" />
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerImagesContainer}>
              <Image source={DataudipiTitle} style={styles.titleImage} resizeMode="contain" />
              <Text style={styles.subtitle}>RESTAURANT MANAGEMENT SYSTEM</Text>
            </View>

            <Text style={styles.title}>Choose Your Role</Text>

            <View style={styles.roleOptions}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={styles.roleButton}
                  onPress={() => handleRoleSelect(role.id)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: role.color }]}>
                    <Text style={styles.iconText}>{role.abbreviation}</Text>
                  </View>
                  <View style={styles.roleContent}>
                    <Text style={styles.roleLabel}>{role.label}</Text>
                    <Text style={styles.roleDesc}>{role.description}</Text>
                  </View>
                  <ChevronRight color="#6b7280" size={20} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Image source={ChefMascot} style={styles.bottomFixedMascot} resizeMode="contain" />
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={RestaurantBG} style={styles.container} resizeMode="cover" blurRadius={10}>
      <View style={styles.overlay}>
        <Image source={UdupiBanner} style={styles.topFixedBanner} resizeMode="contain" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Image source={DataudipiTitle} style={[styles.titleImage, { marginTop: 15, width: 180, height: 50 }]} resizeMode="contain" />
          <Text style={[styles.subtitle, { marginBottom: 30 }]}>RESTAURANT MANAGEMENT SYSTEM</Text>
          
          <View style={styles.formContainer}>
            {renderAccountHeader()}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

            {selectedRole !== 'hotel_manager' && (
              <View style={styles.tabsContainer}>
                <TouchableOpacity onPress={() => setAuthMode('login')} style={[styles.tab, authMode === 'login' && styles.activeTab]}>
                  <Text style={[styles.tabText, authMode === 'login' && styles.activeTabText]}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAuthMode('signup')} style={[styles.tab, authMode === 'signup' && styles.activeTab]}>
                  <Text style={[styles.tabText, authMode === 'signup' && styles.activeTabText]}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.formBox}>
              {authMode === 'signup' && (
                <View>
                  <Text style={styles.inputLabel}>FULL NAME</Text>
                  <TextInput style={styles.input} placeholder="Enter your full name" placeholderTextColor="#6b7280" value={formData.name} onChangeText={(text) => handleFormChange('name', text)} />
                </View>
              )}

              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput style={styles.input} placeholder="Enter your email" placeholderTextColor="#6b7280" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={(text) => handleFormChange('email', text)} />

              {authMode === 'signup' && (selectedRole === 'hotel_manager' || selectedRole === 'cashier') && (
                <View>
                  <Text style={styles.inputLabel}>RESTAURANT</Text>
                  <View style={[styles.pickerContainer, styles.input]}>
                    <Picker
                      selectedValue={formData.restaurant_id}
                      onValueChange={(itemValue) => handleFormChange('restaurant_id', itemValue)}
                      enabled={!restaurantLoading}
                      style={{ color: '#fff', marginLeft: -10, marginTop: -15, marginBottom: -15 }}
                      dropdownIconColor="#fff"
                    >
                      <Picker.Item label="Select a restaurant" value="" />
                      {restaurants.map(r => <Picker.Item key={r.id} label={r.name} value={r.id} />)}
                    </Picker>
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={[styles.input, styles.passwordContainer]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#6b7280"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(text) => handleFormChange('password', text)}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff color="#9ca3af" size={18} /> : <Eye color="#9ca3af" size={18} />}
                </TouchableOpacity>
              </View>

              {authMode === 'signup' && (
                <View>
                  <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry={!showPassword}
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleFormChange('confirmPassword', text)}
                  />
                </View>
              )}

              <TouchableOpacity style={styles.submitBtn} onPress={handleAuthSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.backBtn} onPress={() => setStep('role')}>
              <Text style={styles.backBtnText}>← Back to Role Selection</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
        <Image source={ChefMascot} style={styles.bottomFixedMascot} resizeMode="contain" />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', width: width, height: height },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', width: '100%' },
  topFixedBanner: { position: 'absolute', top: 0, width: 280, height: 85, alignSelf: 'center', zIndex: 10 },
  bottomFixedMascot: { position: 'absolute', bottom: 0, width: 280, height: 110, alignSelf: 'center', zIndex: 10 },
  scrollContent: { alignItems: 'center', padding: 20, paddingTop: 100, paddingBottom: 130, minHeight: '100%', justifyContent: 'center', flexGrow: 1 },
  headerImagesContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  titleImage: { width: 220, height: 60, marginBottom: 5 },
  subtitle: { fontSize: 11, color: '#d1d5db', letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 20, fontWeight: '500', color: '#fff', marginBottom: 25 },
  roleOptions: { width: '100%', maxWidth: 400 },
  roleButton: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  iconContainer: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  iconText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  roleContent: { flex: 1 },
  roleLabel: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  roleDesc: { fontSize: 12, color: '#9ca3af' },
  formContainer: { width: '100%', maxWidth: 400 },
  accountHeaderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249, 115, 22, 0.1)', borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.4)', borderRadius: 8, paddingVertical: 14, marginBottom: 30 },
  accountHeaderText: { color: '#f97316', fontWeight: 'bold', fontSize: 14 },
  errorText: { color: '#ef4444', marginBottom: 15, textAlign: 'center' },
  successText: { color: '#22c55e', marginBottom: 15, textAlign: 'center' },
  tabsContainer: { flexDirection: 'row', marginBottom: 25, borderBottomWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent', marginBottom: -1 },
  activeTab: { borderColor: '#f97316' },
  tabText: { color: '#9ca3af', fontWeight: '600', fontSize: 14 },
  activeTabText: { color: '#f97316' },
  formBox: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 24, backgroundColor: 'transparent' },
  inputLabel: { color: '#9ca3af', fontSize: 12, fontWeight: 'bold', marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(20, 20, 20, 0.6)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, color: '#fff', marginBottom: 20 },
  pickerContainer: { padding: 0, justifyContent: 'center' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 0, paddingHorizontal: 0 },
  passwordInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 12, color: '#fff' },
  eyeIcon: { padding: 12 },
  submitBtn: { backgroundColor: '#f97316', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  backBtn: { marginTop: 20, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8 },
  backBtnText: { color: '#9ca3af', fontSize: 13 }
});

export default OnboardingScreen;
