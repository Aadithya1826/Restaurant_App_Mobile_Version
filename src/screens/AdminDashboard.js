import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Dimensions, SafeAreaView, Platform, TextInput, Modal, Alert, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { restaurantService, managerService, tableService } from '../services/api';
import { LayoutDashboard, Building2, Users, BarChart2, Settings, MapPin, IndianRupee, Search, Edit2, Trash2, Plus, X, Mail, Phone, Calendar, CheckSquare, Square, Receipt, CreditCard, Star, Globe, Shield, Database, LogOut, Bell, ChevronDown } from 'lucide-react-native';

const DataudipiTitle = require('../assets/Dataudupi-Title.png');
const ChefMascot = require('../assets/chef_mascot.png');

const { width, height: windowHeight } = Dimensions.get('window');

export default function AdminDashboard({ navigation }) {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Real data for counts
  const [hotelsCount, setHotelsCount] = useState(0);
  const [managersCount, setManagersCount] = useState(0);
  const [tablesCount, setTablesCount] = useState(0);

  const [hotelsList, setHotelsList] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isHotelModalVisible, setIsHotelModalVisible] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [hotelForm, setHotelForm] = useState({ name: '', address: '', phone: '' });

  const [isManagerModalVisible, setIsManagerModalVisible] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [managerForm, setManagerForm] = useState({ name: '', email: '', password: '', restaurant_id: '', is_active: true });

  const [settingsForm, setSettingsForm] = useState({
    darkMode: false,
    pushNotifications: true,
    autoAssign: false,
    twoFactorAuth: false,
    dailyBackups: true,
    sessionTimeout: '30 mins',
    backupFreq: 'Daily at Midnight'
  });

  const loadData = async () => {
    try {
      const h = await restaurantService.getAdminRestaurants();
      const hotelArr = Array.isArray(h) ? h : [];
      setHotelsCount(hotelArr.length);
      setHotelsList(hotelArr);
      
      const m = await managerService.getManagers();
      const managerArr = Array.isArray(m) ? m : [];
      setManagersCount(managerArr.length);
      setManagersList(managerArr);
      
      const t = await tableService.getTables();
      setTablesCount(Array.isArray(t) ? t.length : 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const handleHotelSubmit = async () => {
    try {
      if (editingHotel) {
        await restaurantService.updateRestaurant(editingHotel.id, hotelForm);
      } else {
        await restaurantService.createRestaurant(hotelForm);
      }
      setIsHotelModalVisible(false);
      loadData();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save hotel details.");
    }
  };

  const handleDeleteHotel = async (id) => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Are you sure you want to delete this hotel?')) return;
    }
    try {
      await restaurantService.deleteRestaurant(id);
      loadData();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not delete hotel.");
    }
  };

  const handleManagerSubmit = async () => {
    try {
      const payload = { ...managerForm };
      if (!payload.password) delete payload.password; // Don't send empty password
      if (!payload.restaurant_id) payload.restaurant_id = null;
      if (editingManager) {
        await managerService.updateManager(editingManager.id, payload);
      } else {
        await managerService.createManager(payload);
      }
      setIsManagerModalVisible(false);
      loadData();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save manager details.");
    }
  };

  const handleDeleteManager = async (id) => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Are you sure you want to delete this manager?')) return;
    }
    try {
      await managerService.deleteManager(id);
      loadData();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not delete manager.");
    }
  };

  const renderHeader = () => {
    let title = 'Dashboard';
    let subtitle = 'Platform-wide overview';
    if (activeTab === 'hotels') {
      title = 'Hotels & Venues';
      subtitle = `${hotelsList.length} Hotels Registered`;
    } else if (activeTab === 'managers') {
      title = 'Managers';
      subtitle = 'Hotel managers & assignments';
    } else if (activeTab === 'reports') {
      title = 'Reports';
      subtitle = 'Performance insights';
    } else if (activeTab === 'settings') {
      title = 'Settings';
      subtitle = 'Accounts & preferences';
    }

    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <Image source={DataudipiTitle} style={styles.headerLogo} resizeMode="contain" />
          <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>
        </View>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
    );
  };

  const StatCard = ({ icon: Icon, iconBg, topText, value, label }) => (
    <View style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
          <Icon color={iconBg === '#fff7ed' ? '#ea580c' : '#059669'} size={24} />
        </View>
        <Text style={styles.statTopText}>{topText}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderDashboard = () => (
    <ScrollView style={styles.dashboardScroll} contentContainerStyle={styles.dashboardScrollContent} showsVerticalScrollIndicator={false}>
      
      <StatCard 
        icon={Building2} 
        iconBg="#fff7ed" 
        topText="Active on platform" 
        value={hotelsCount.toString()} 
        label="Total Hotels" 
      />
      <StatCard 
        icon={Users} 
        iconBg="#f0fdf4" 
        topText="Assigned managers" 
        value={managersCount.toString()} 
        label="Active Managers" 
      />
      <StatCard 
        icon={IndianRupee} 
        iconBg="#fff7ed" 
        topText="+546.6%" 
        value="₹860" 
        label="Platform Revenue (Today)" 
      />
      <StatCard 
        icon={MapPin} 
        iconBg="#f0fdf4" 
        topText={`Out of ${tablesCount} total`} 
        value={tablesCount.toString()} 
        label="Active Tables" 
      />

      {/* Top Performing Hotels */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Top Performing Hotels</Text>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Hotel</Text>
          <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'right' }]}>Revenue</Text>
          <Text style={[styles.tableHeaderText, { width: 70, textAlign: 'right' }]}>Growth</Text>
        </View>
        <View style={styles.hotelRow}>
          <View style={styles.badgeNumber}><Text style={styles.badgeNumberText}>1</Text></View>
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName}>Data Udipi</Text>
            <View style={styles.hotelLocation}>
              <MapPin color="#ef4444" size={12} />
              <Text style={styles.hotelAddress} numberOfLines={2}>51, Anna Main Road, MGR Nagar, Chennai 600 078</Text>
            </View>
          </View>
          <Text style={styles.hotelRevenue}>197 orders</Text>
          <View style={styles.growthBadge}><Text style={styles.growthText}>+12%</Text></View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        <View style={styles.activityRow}>
          <View style={styles.activityIconWrapper}><Building2 color="#fff" size={20} /></View>
          <View style={styles.activityContent}>
            <View style={styles.activityHeaderRow}>
              <Text style={styles.activityTitle}>New hotel added</Text>
              <Text style={styles.activityTime}>3 months ago</Text>
            </View>
            <Text style={styles.activityDesc}>Grand Udipi Palace - 1/10, Mugalivakkam Main Road, Mugalivakkam, Chennai 600 125</Text>
          </View>
        </View>

        <View style={styles.activityRow}>
          <View style={styles.activityIconWrapper}><Users color="#fff" size={20} /></View>
          <View style={styles.activityContent}>
            <View style={styles.activityHeaderRow}>
              <Text style={styles.activityTitle}>Manager assigned</Text>
              <Text style={styles.activityTime}>4 months ago</Text>
            </View>
            <Text style={styles.activityDesc}>Marimuthu A → Data Udipi</Text>
          </View>
        </View>

        <View style={styles.activityRow}>
          <View style={styles.activityIconWrapper}><Building2 color="#fff" size={20} /></View>
          <View style={styles.activityContent}>
            <View style={styles.activityHeaderRow}>
              <Text style={styles.activityTitle}>New hotel added</Text>
              <Text style={styles.activityTime}>4 months ago</Text>
            </View>
            <Text style={styles.activityDesc}>Data Udipi - 51, Anna Main Road, MGR Nagar, Chennai 600 078</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderHotels = () => {
    const filtered = hotelsList.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <ScrollView style={styles.dashboardScroll} contentContainerStyle={styles.dashboardScrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => { setEditingHotel(null); setHotelForm({ name: '', address: '', phone: '' }); setIsHotelModalVisible(true); }}>
          <Building2 color="#fff" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>ADD HOTEL</Text>
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <TextInput style={styles.searchInput} placeholder="Search hotels..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor="#9ca3af" />
        </View>
        <Text style={styles.listMetaText}>{hotelsList.length} hotels registered on the platform</Text>
        
        {filtered.map(hotel => (
          <View key={hotel.id} style={styles.entityCard}>
            <View style={styles.entityHeader}>
              <View style={[styles.entityIcon, { backgroundColor: '#f97316' }]}><Building2 color="#fff" size={20} /></View>
              <View style={styles.entityActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { setEditingHotel(hotel); setHotelForm({ name: hotel.name, address: hotel.address || '', phone: hotel.phone || '' }); setIsHotelModalVisible(true); }}><Edit2 color="#6b7280" size={18} /></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteHotel(hotel.id)}><Trash2 color="#ef4444" size={18} /></TouchableOpacity>
                <View style={[styles.activeBadge, {marginLeft: 10}]}><Text style={styles.activeBadgeText}>ACTIVE</Text></View>
              </View>
            </View>
            <Text style={styles.entityTitle}>{hotel.name}</Text>
            <View style={styles.entityLocation}>
              <MapPin color="#6b7280" size={14} style={{ marginTop: 2, marginRight: 4 }} />
              <Text style={styles.entityAddress}>{hotel.address || 'No address provided'}</Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statCol}><Text style={styles.statVal}>1</Text><Text style={styles.statLbl}>Venues</Text></View>
              <View style={styles.statCol}><Text style={styles.statVal}>0</Text><Text style={styles.statLbl}>Orders</Text></View>
              <View style={styles.statCol}><Text style={[styles.statVal, { color: '#ea580c' }]}>₹0</Text><Text style={styles.statLbl}>Revenue</Text></View>
            </View>
            
            <View style={styles.entityFooter}>
              <Users color="#9ca3af" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.entityFooterText}>
                 {managersList.find(m => m.restaurant_id === hotel.id)?.name || 'No manager assigned'}
              </Text>
            </View>
          </View>
        ))}
        <View style={{height: 100}} />
      </ScrollView>
    );
  };

  const renderManagers = () => {
    const filtered = managersList.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <ScrollView style={styles.dashboardScroll} contentContainerStyle={styles.dashboardScrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => { setEditingManager(null); setManagerForm({ name: '', email: '', password: '', restaurant_id: '', is_active: true }); setIsManagerModalVisible(true); }}>
          <Users color="#fff" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>ADD MANAGER</Text>
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <TextInput style={styles.searchInput} placeholder="Search managers or hotels..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor="#9ca3af" />
        </View>
        <Text style={styles.listMetaText}>{managersList.length} managers on platform</Text>
        
        {filtered.map(manager => {
          const initials = manager.name ? manager.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'M';
          return (
          <View key={manager.id} style={styles.entityCard}>
            <View style={styles.entityHeader}>
              <View style={[styles.entityIcon, { backgroundColor: '#0ea5e9' }]}><Text style={styles.avatarText}>{initials}</Text></View>
              <View style={styles.entityActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { setEditingManager(manager); setManagerForm({ name: manager.name, email: manager.email, password: '', restaurant_id: manager.restaurant_id || '', is_active: manager.is_active !== false }); setIsManagerModalVisible(true); }}><Edit2 color="#6b7280" size={18} /></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteManager(manager.id)}><Trash2 color="#ef4444" size={18} /></TouchableOpacity>
              </View>
            </View>
            
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
              <Text style={styles.entityTitle}>{manager.name}</Text>
              <View style={[styles.activeBadge, { marginLeft: 10, backgroundColor: manager.is_active !== false ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={[styles.activeBadgeText, { color: manager.is_active !== false ? '#16a34a' : '#ef4444' }]}>{manager.is_active !== false ? 'ACTIVE' : 'INACTIVE'}</Text>
              </View>
            </View>
            
            <View style={styles.assignmentBox}>
              <Building2 color="#ea580c" size={16} style={{marginRight: 8}} />
              <Text style={styles.assignmentText}>{hotelsList.find(h => h.id === manager.restaurant_id)?.name || 'Unassigned'}</Text>
            </View>
            
            <View style={styles.contactRow}><Mail color="#9ca3af" size={14} style={{marginRight: 8}} /><Text style={styles.contactText}>{manager.email}</Text></View>
            <View style={styles.contactRow}><Phone color="#9ca3af" size={14} style={{marginRight: 8}} /><Text style={styles.contactText}>{manager.phone || '+91 00000 00000'}</Text></View>
            <View style={styles.contactRow}><Calendar color="#9ca3af" size={14} style={{marginRight: 8}} /><Text style={styles.contactText}>Manager - Joined {new Date(manager.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text></View>
          </View>
        )})}
        <View style={{height: 100}} />
      </ScrollView>
    );
  };

  const renderReports = () => {
    return (
      <ScrollView style={styles.dashboardScroll} contentContainerStyle={styles.dashboardScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsGrid}>
          <View style={styles.reportMetricCard}>
            <View style={{flex: 1}}>
              <Text style={styles.metricCardLabel}>TODAY'S PLATFORM REVENUE</Text>
              <Text style={styles.metricCardVal}>₹860</Text>
            </View>
            <View style={[styles.metricIconBox, {backgroundColor: '#ffedd5'}]}>
              <IndianRupee color="#f97316" size={20} />
            </View>
          </View>
          
          <View style={styles.reportMetricCard}>
            <View style={{flex: 1}}>
              <Text style={styles.metricCardLabel}>TODAY'S ORDERS</Text>
              <Text style={styles.metricCardVal}>3</Text>
            </View>
            <View style={[styles.metricIconBox, {backgroundColor: '#dcfce7'}]}>
              <Receipt color="#14b8a6" size={20} />
            </View>
          </View>
          
          <View style={styles.reportMetricCard}>
            <View style={{flex: 1}}>
              <Text style={styles.metricCardLabel}>AVG. ORDER VALUE</Text>
              <Text style={styles.metricCardVal}>₹205</Text>
            </View>
            <View style={[styles.metricIconBox, {backgroundColor: '#ffedd5'}]}>
              <CreditCard color="#eab308" size={20} />
            </View>
          </View>
          
          <View style={styles.reportMetricCard}>
            <View style={{flex: 1}}>
              <Text style={styles.metricCardLabel}>CUSTOMER SATISFACTION</Text>
              <Text style={styles.metricCardVal}>4.8/5</Text>
            </View>
            <View style={[styles.metricIconBox, {backgroundColor: '#fce7f3'}]}>
              <Star color="#f59e0b" size={20} />
            </View>
          </View>
        </View>

        {/* Monthly Revenue Trend */}
        <View style={styles.sectionContainer}>
          <View style={styles.activityHeaderRow}>
            <Text style={styles.sectionTitle}>Monthly Revenue Trend</Text>
            <TouchableOpacity style={styles.outlineBtn}><Text style={styles.outlineBtnText}>Last 6 months</Text></TouchableOpacity>
          </View>
          <View style={styles.chartMockContainer}>
            <View style={styles.chartWaveHeader}>
               {[1,2,3,4,5,6].map((i) => <View key={i} style={styles.chartWaveCircle} />)}
            </View>
            <View style={styles.chartGradientBody}>
              <View style={styles.chartLabelsRow}>
                <Text style={styles.chartLabel}>Oct</Text>
                <Text style={styles.chartLabel}>Nov</Text>
                <Text style={styles.chartLabel}>Dec</Text>
                <Text style={styles.chartLabel}>Jan</Text>
                <Text style={styles.chartLabel}>Feb</Text>
                <Text style={styles.chartLabel}>Mar</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Payment Methods */}
        <View style={styles.sectionContainer}>
          <View style={styles.activityHeaderRow}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <Text style={styles.linkText}>Share</Text>
          </View>
          
          <View style={styles.progressRow}>
             <View style={styles.progressHeader}><Text style={styles.progressLabel}>Razorpay</Text><Text style={styles.progressVal}>53.4%</Text></View>
             <View style={styles.progressBarBg}><View style={[styles.progressBarFill, {width: '53.4%', backgroundColor: '#f97316'}]} /></View>
          </View>
          <View style={styles.progressRow}>
             <View style={styles.progressHeader}><Text style={styles.progressLabel}>Cash</Text><Text style={styles.progressVal}>38.9%</Text></View>
             <View style={styles.progressBarBg}><View style={[styles.progressBarFill, {width: '38.9%', backgroundColor: '#15803d'}]} /></View>
          </View>
          <View style={styles.progressRow}>
             <View style={styles.progressHeader}><Text style={styles.progressLabel}>UPI</Text><Text style={styles.progressVal}>6.0%</Text></View>
             <View style={styles.progressBarBg}><View style={[styles.progressBarFill, {width: '6.0%', backgroundColor: '#ef4444'}]} /></View>
          </View>
          <View style={styles.progressRow}>
             <View style={styles.progressHeader}><Text style={styles.progressLabel}>Cash</Text><Text style={styles.progressVal}>0.8%</Text></View>
             <View style={styles.progressBarBg}><View style={[styles.progressBarFill, {width: '0.8%', backgroundColor: '#4b5563'}]} /></View>
          </View>
          <View style={styles.progressRow}>
             <View style={styles.progressHeader}><Text style={styles.progressLabel}>Wallet</Text><Text style={styles.progressVal}>0.7%</Text></View>
             <View style={styles.progressBarBg}><View style={[styles.progressBarFill, {width: '0.7%', backgroundColor: '#f97316'}]} /></View>
          </View>
          <View style={styles.progressRow}>
             <View style={styles.progressHeader}><Text style={styles.progressLabel}>Card</Text><Text style={styles.progressVal}>0.2%</Text></View>
             <View style={styles.progressBarBg}><View style={[styles.progressBarFill, {width: '0.2%', backgroundColor: '#15803d'}]} /></View>
          </View>
        </View>
        
        {/* Hotel Performance */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Hotel Performance</Text>
          <View style={[styles.activityHeaderRow, {marginBottom: 15}]}>
            <Text style={[styles.activityDesc, {flex: 1}]}>Performance summary across the top venues</Text>
            <Text style={[styles.activityDesc, {width: 80, textAlign: 'right'}]}>Updated just now</Text>
          </View>
          
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Hotel</Text>
            <Text style={[styles.tableHeaderText, { width: 100, textAlign: 'right' }]}>Performance</Text>
          </View>
          
          <View style={[styles.progressRow, {flexDirection: 'row', alignItems: 'center'}]}>
             <Text style={[styles.progressLabel, {flex: 1}]}>Data Udipi</Text>
             <View style={[styles.progressBarBg, {width: 80}]}><View style={[styles.progressBarFill, {width: '30%', backgroundColor: '#f97316'}]} /></View>
          </View>
        </View>

        <View style={{height: 100}} />
      </ScrollView>
    );
  };

  const renderSettings = () => {
    const toggleSetting = (key) => setSettingsForm(prev => ({...prev, [key]: !prev[key]}));
    
    return (
      <ScrollView style={styles.dashboardScroll} contentContainerStyle={styles.dashboardScrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[styles.primaryButton, {width: 160, alignSelf: 'flex-start'}]}>
           <Text style={styles.primaryButtonText}>Save Changes</Text>
        </TouchableOpacity>
        
        <View style={[styles.sectionContainer, {flexDirection: 'row', alignItems: 'center', padding: 20}]}>
          <View style={styles.saBadge}><Text style={styles.saBadgeText}>SA</Text></View>
          <View style={{flex: 1, marginLeft: 15}}>
             <Text style={styles.profileTitle}>Platform Admin</Text>
             <Text style={styles.profileSubtitle}>Platform Administrator</Text>
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
             <Text style={styles.signOutBtnText}>Sign out</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sectionContainer}>
          <View style={styles.settingsHeader}>
             <View style={[styles.settingsIconBox, {backgroundColor: '#f97316'}]}><Globe color="#fff" size={20} /></View>
             <Text style={styles.settingsSectionTitle}>General</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={{flex: 1}}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingDesc}>Enable dark theme across the platform</Text>
            </View>
            <Switch value={settingsForm.darkMode} onValueChange={() => toggleSetting('darkMode')} trackColor={{false: '#e5e7eb', true: '#f97316'}} thumbColor="#fff" />
          </View>
          
          <View style={styles.settingRow}>
            <View style={{flex: 1}}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Receive alerts for critical updates</Text>
            </View>
            <Switch value={settingsForm.pushNotifications} onValueChange={() => toggleSetting('pushNotifications')} trackColor={{false: '#e5e7eb', true: '#f97316'}} thumbColor="#fff" />
          </View>
          
          <View style={[styles.settingRow, {borderBottomWidth: 0, paddingBottom: 0}]}>
            <View style={{flex: 1}}>
              <Text style={styles.settingTitle}>Auto-assign Managers</Text>
              <Text style={styles.settingDesc}>Automatically link new venues</Text>
            </View>
            <Switch value={settingsForm.autoAssign} onValueChange={() => toggleSetting('autoAssign')} trackColor={{false: '#e5e7eb', true: '#f97316'}} thumbColor="#fff" />
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <View style={styles.settingsHeader}>
             <View style={[styles.settingsIconBox, {backgroundColor: '#f97316'}]}><Shield color="#fff" size={20} /></View>
             <Text style={styles.settingsSectionTitle}>Security</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={{flex: 1}}>
              <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
              <Text style={styles.settingDesc}>Require 2FA for all admin logins</Text>
            </View>
            <Switch value={settingsForm.twoFactorAuth} onValueChange={() => toggleSetting('twoFactorAuth')} trackColor={{false: '#e5e7eb', true: '#f97316'}} thumbColor="#fff" />
          </View>
          
          <View style={[styles.settingRow, {borderBottomWidth: 0, paddingBottom: 0, flexDirection: 'column', alignItems: 'stretch'}]}>
             <Text style={styles.inputLabel}>SESSION TIMEOUT</Text>
             <TouchableOpacity style={styles.dropdownBox}>
                <Text style={styles.dropdownBoxText}>{settingsForm.sessionTimeout}</Text>
                <ChevronDown color="#6b7280" size={20} />
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.settingsHeader}>
             <View style={[styles.settingsIconBox, {backgroundColor: '#6b7280'}]}><Database color="#fff" size={20} /></View>
             <Text style={styles.settingsSectionTitle}>Data & Backup</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={{flex: 1}}>
              <Text style={styles.settingTitle}>Daily Backups</Text>
              <Text style={styles.settingDesc}>Schedule automatic database backups</Text>
            </View>
            <Switch value={settingsForm.dailyBackups} onValueChange={() => toggleSetting('dailyBackups')} trackColor={{false: '#e5e7eb', true: '#f97316'}} thumbColor="#fff" />
          </View>
          
          <View style={[styles.settingRow, {flexDirection: 'column', alignItems: 'stretch'}]}>
             <Text style={styles.inputLabel}>BACKUP FREQUENCY</Text>
             <TouchableOpacity style={styles.dropdownBox}>
                <Text style={styles.dropdownBoxText}>{settingsForm.backupFreq}</Text>
                <ChevronDown color="#6b7280" size={20} />
             </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={{marginTop: 10, alignSelf: 'flex-start'}}>
            <Text style={{color: '#ef4444', fontWeight: 'bold', fontSize: 14}}>Export System Data</Text>
          </TouchableOpacity>
        </View>

        <View style={{height: 100}} />
      </ScrollView>
    );
  };

  const renderModals = () => (
    <>
      <Modal visible={isHotelModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{editingHotel ? 'Edit Hotel' : 'Add Hotel'}</Text>
                <Text style={styles.modalSubtitle}>{editingHotel ? `Update details for ${editingHotel.name}.` : 'Create a new hotel record.'}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsHotelModalVisible(false)}><X color="#6b7280" size={24} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Hotel Name</Text>
              <TextInput style={styles.modalInput} value={hotelForm.name} onChangeText={(t) => setHotelForm({...hotelForm, name: t})} placeholder="Enter hotel name" />
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput style={styles.modalInput} value={hotelForm.address} onChangeText={(t) => setHotelForm({...hotelForm, address: t})} placeholder="Enter hotel address" />
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput style={styles.modalInput} value={hotelForm.phone} onChangeText={(t) => setHotelForm({...hotelForm, phone: t})} placeholder="Enter contact phone" />
              
              <TouchableOpacity style={styles.submitBtn} onPress={handleHotelSubmit}><Text style={styles.submitBtnText}>{editingHotel ? 'SAVE CHANGES' : 'CREATE HOTEL'}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsHotelModalVisible(false)}><Text style={styles.cancelBtnText}>CANCEL</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={isManagerModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{editingManager ? 'Edit Manager' : 'Add Manager'}</Text>
                <Text style={styles.modalSubtitle}>{editingManager ? `Update details for ${editingManager.name}.` : 'Create a new manager.'}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsManagerModalVisible(false)}><X color="#6b7280" size={24} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Manager Name</Text>
              <TextInput style={styles.modalInput} value={managerForm.name} onChangeText={(t) => setManagerForm({...managerForm, name: t})} placeholder="Enter name" />
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput style={styles.modalInput} value={managerForm.email} onChangeText={(t) => setManagerForm({...managerForm, email: t})} placeholder="Enter email" autoCapitalize="none" />
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput style={styles.modalInput} value={managerForm.password} onChangeText={(t) => setManagerForm({...managerForm, password: t})} placeholder={editingManager ? "Leave blank to keep current" : "Enter password"} secureTextEntry />
              
              <Text style={styles.inputLabel}>Hotel Assignment</Text>
              <View style={styles.pickerContainer}>
                {hotelsList.map(h => (
                  <TouchableOpacity key={h.id} style={[styles.pickerItem, managerForm.restaurant_id === h.id && styles.pickerItemActive]} onPress={() => setManagerForm({...managerForm, restaurant_id: h.id})}>
                    <Text style={[styles.pickerItemText, managerForm.restaurant_id === h.id && styles.pickerItemTextActive]}>{h.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.pickerItem, !managerForm.restaurant_id && styles.pickerItemActive]} onPress={() => setManagerForm({...managerForm, restaurant_id: ''})}>
                    <Text style={[styles.pickerItemText, !managerForm.restaurant_id && styles.pickerItemTextActive]}>Unassigned</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.checkboxRow} onPress={() => setManagerForm({...managerForm, is_active: !managerForm.is_active})}>
                {managerForm.is_active ? <CheckSquare color="#0ea5e9" size={20} /> : <Square color="#9ca3af" size={20} />}
                <Text style={styles.checkboxLabel}>Active Status</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.submitBtn} onPress={handleManagerSubmit}><Text style={styles.submitBtnText}>{editingManager ? 'SAVE CHANGES' : 'CREATE MANAGER'}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsManagerModalVisible(false)}><Text style={styles.cancelBtnText}>CANCEL</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <View style={styles.mainContent}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'hotels' && renderHotels()}
        {activeTab === 'managers' && renderManagers()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'settings' && renderSettings()}
      </View>

      {/* Floating Voice Assistant */}
      <View style={styles.voiceAssistantContainer} pointerEvents="box-none">
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>Hi!! I'm your Voice Assistant!</Text>
        </View>
        <View style={styles.mascotCircle}>
          <Image source={ChefMascot} style={styles.mascotImg} resizeMode="contain" />
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab('dashboard'); setSearchQuery(''); }}>
          <LayoutDashboard color={activeTab === 'dashboard' ? '#f97316' : '#6b7280'} size={24} />
          <Text style={[styles.navText, activeTab === 'dashboard' && styles.activeNavText]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab('hotels'); setSearchQuery(''); }}>
          <Building2 color={activeTab === 'hotels' ? '#f97316' : '#6b7280'} size={24} />
          <Text style={[styles.navText, activeTab === 'hotels' && styles.activeNavText]}>Hotels</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab('managers'); setSearchQuery(''); }}>
          <Users color={activeTab === 'managers' ? '#f97316' : '#6b7280'} size={24} />
          <Text style={[styles.navText, activeTab === 'managers' && styles.activeNavText]}>Managers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab('reports'); setSearchQuery(''); }}>
          <BarChart2 color={activeTab === 'reports' ? '#f97316' : '#6b7280'} size={24} />
          <Text style={[styles.navText, activeTab === 'reports' && styles.activeNavText]}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab('settings'); setSearchQuery(''); }}>
          <Settings color={activeTab === 'settings' ? '#f97316' : '#6b7280'} size={24} />
          <Text style={[styles.navText, activeTab === 'settings' && styles.activeNavText]}>Settings</Text>
        </TouchableOpacity>
      </View>
      {renderModals()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', height: Platform.OS === 'web' ? windowHeight : '100%', maxHeight: Platform.OS === 'web' ? windowHeight : '100%', overflow: 'hidden' },
  headerContainer: { backgroundColor: '#111', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, padding: 20, paddingTop: 40, paddingBottom: 30, zIndex: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerLogo: { height: 25, width: 120 },
  adminBadge: { borderColor: '#ea580c', borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(234, 88, 12, 0.1)' },
  adminBadgeText: { color: '#ea580c', fontSize: 10, fontWeight: 'bold' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  headerSubtitle: { color: '#9ca3af', fontSize: 14 },
  
  mainContent: { flex: 1, flexShrink: 1, marginTop: -20, overflow: 'hidden' },
  dashboardScroll: { flex: 1, flexGrow: 1 },
  dashboardScrollContent: { padding: 20, paddingTop: 35 },
  
  statCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  statIconContainer: { padding: 12, borderRadius: 12 },
  statTopText: { color: '#059669', fontSize: 13, fontWeight: '600' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  statLabel: { color: '#6b7280', fontSize: 14 },
  
  sectionContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 10, marginBottom: 15 },
  tableHeaderText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  hotelRow: { flexDirection: 'row', alignItems: 'center' },
  badgeNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  badgeNumberText: { color: '#fff', fontWeight: 'bold' },
  hotelInfo: { flex: 1 },
  hotelName: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  hotelLocation: { flexDirection: 'row', alignItems: 'flex-start' },
  hotelAddress: { color: '#6b7280', fontSize: 12, flex: 1, marginLeft: 4, lineHeight: 16 },
  hotelRevenue: { width: 80, textAlign: 'right', fontSize: 13, color: '#4b5563' },
  growthBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, width: 60, alignItems: 'center', marginLeft: 10 },
  growthText: { color: '#059669', fontSize: 11, fontWeight: 'bold' },
  
  activityRow: { flexDirection: 'row', marginBottom: 20 },
  activityIconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  activityContent: { flex: 1 },
  activityHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  activityTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  activityTime: { fontSize: 12, color: '#9ca3af' },
  activityDesc: { fontSize: 13, color: '#6b7280', lineHeight: 20 },
  
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 18, color: '#6b7280' },
  
  bottomNav: { flexDirection: 'row', backgroundColor: '#111', paddingVertical: 10, paddingBottom: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { color: '#6b7280', fontSize: 10, marginTop: 4 },
  activeNavText: { color: '#f97316' },

  voiceAssistantContainer: { position: 'absolute', bottom: 90, right: 15, flexDirection: 'row', alignItems: 'flex-end' },
  speechBubble: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, marginRight: -10, marginBottom: 20, zIndex: 1 },
  speechText: { color: '#ea580c', fontWeight: 'bold', fontSize: 12 },
  mascotCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', padding: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, zIndex: 2, borderWidth: 1, borderColor: '#fee2e2' },
  mascotImg: { width: '100%', height: '100%', borderRadius: 30 },
  
  primaryButton: { backgroundColor: '#f97316', paddingVertical: 15, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 15, borderWidth: 1, borderColor: '#e5e7eb' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111827', outlineStyle: 'none' },
  listMetaText: { color: '#6b7280', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  entityCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  entityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  entityIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  entityActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 6, marginLeft: 5 },
  activeBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeBadgeText: { color: '#16a34a', fontSize: 10, fontWeight: 'bold' },
  entityTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  entityLocation: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  entityAddress: { color: '#6b7280', fontSize: 13, flex: 1, lineHeight: 18 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 15, marginBottom: 15 },
  statCol: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  statLbl: { fontSize: 12, color: '#6b7280' },
  entityFooter: { flexDirection: 'row', alignItems: 'center' },
  entityFooterText: { color: '#6b7280', fontSize: 13 },
  assignmentBox: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  assignmentText: { color: '#111827', fontSize: 13, fontWeight: '500' },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  contactText: { color: '#6b7280', fontSize: 13 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '90%', maxWidth: 400, borderRadius: 16, maxHeight: '80%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#6b7280' },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 13, color: '#4b5563', marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 14, color: '#111827', marginBottom: 15, backgroundColor: '#fff' },
  pickerContainer: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 15, overflow: 'hidden' },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  pickerItemActive: { backgroundColor: '#eff6ff' },
  pickerItemText: { fontSize: 14, color: '#4b5563' },
  pickerItemTextActive: { color: '#2563eb', fontWeight: 'bold' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  checkboxLabel: { marginLeft: 10, fontSize: 14, color: '#4b5563' },
  submitBtn: { backgroundColor: '#f97316', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  cancelBtn: { backgroundColor: '#f3f4f6', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  cancelBtnText: { color: '#111827', fontSize: 14, fontWeight: 'bold' },
  
  metricsGrid: { flexDirection: 'column' },
  reportMetricCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, flexDirection: 'row', alignItems: 'center' },
  metricCardLabel: { color: '#6b7280', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  metricCardVal: { color: '#111827', fontSize: 18, fontWeight: 'bold' },
  metricIconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  
  chartMockContainer: { backgroundColor: '#fff', height: 200, borderRadius: 16, marginTop: 15, overflow: 'hidden' },
  chartWaveHeader: { flexDirection: 'row', justifyContent: 'space-around', height: 40, marginTop: 20, marginBottom: -20 },
  chartWaveCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f97316', opacity: 0.8 },
  chartGradientBody: { flex: 1, backgroundColor: 'rgba(249, 115, 22, 0.1)', justifyContent: 'flex-end', paddingBottom: 15 },
  chartLabelsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  chartLabel: { color: '#6b7280', fontSize: 12 },
  
  outlineBtn: { borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  outlineBtnText: { color: '#111827', fontSize: 12, fontWeight: 'bold' },
  linkText: { color: '#6b7280', fontSize: 13 },
  
  progressRow: { marginBottom: 15 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 14, color: '#111827', fontWeight: 'bold' },
  progressVal: { fontSize: 13, color: '#6b7280' },
  progressBarBg: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  
  saBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ea580c', justifyContent: 'center', alignItems: 'center' },
  saBadgeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  profileTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  profileSubtitle: { fontSize: 13, color: '#6b7280' },
  signOutBtn: { backgroundColor: '#ffedd5', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  signOutBtnText: { color: '#ea580c', fontWeight: 'bold', fontSize: 13 },
  
  settingsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  settingsIconBox: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  settingsSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  settingTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  settingDesc: { fontSize: 13, color: '#6b7280' },
  dropdownBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  dropdownBoxText: { fontSize: 14, color: '#111827' }
});
