import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Modal, Image, Platform, useWindowDimensions, DeviceEventEmitter } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { orderService, tableService } from '../services/api';
import { LogOut, LayoutDashboard, UtensilsCrossed, ShoppingCart, Table2, Package, Settings, MoreHorizontal, TrendingUp, TrendingDown, Clock, Grid2X2, Flame, CircleDollarSign, BarChart3, ChevronRight } from 'lucide-react-native';
import MenuManagement from '../components/MenuManagement';
import OrdersManagement from '../components/OrdersManagement';
import TableManagement from '../components/TableManagement';
import InventoryManagement from '../components/InventoryManagement';
import ConsumptionReports from '../components/ConsumptionReports';
import PaymentsManagement from '../components/PaymentsManagement';
import ReportsAnalytics from '../components/ReportsAnalytics';
import SettingsManagement from '../components/SettingsManagement';
import VoiceWidget from '../components/VoiceWidget';
const { width, height } = Dimensions.get('window');

export default function HotelManagerDashboard({ navigation }) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isWidgetHidden, setIsWidgetHidden] = useState(false);
  const hideTimeoutRef = useRef(null);

  const handleGlobalTouch = () => {
    setIsWidgetHidden(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setIsWidgetHidden(false);
    }, 3000);
  };

  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  
  // Dummy data for visual matching
  const revenue = 61;
  const pendingOrders = 206;
  const activeTablesCount = 12;
  const totalTables = 19;
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const o = await orderService.getLiveOrders();
      setOrders(Array.isArray(o) ? o : []);
      const t = await tableService.getTables();
      setTables(Array.isArray(t) ? t : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const renderDashboard = () => (
    <ScrollView 
      style={styles.dashboardScroll} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.dashboardContent}
    >
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#ff5722' }]}>
              <ShoppingCart color="white" size={20} />
            </View>
            <View style={[styles.trendPill, { backgroundColor: '#10b981' }]}>
              <TrendingUp color="white" size={12} />
              <Text style={styles.trendText}>50.0%</Text>
            </View>
          </View>
          <Text style={styles.statValue}>{orders.length || 3}</Text>
          <Text style={styles.statLabel}>Total Orders Today</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#10b981' }]}>
              <BarChart3 color="white" size={20} />
            </View>
            <View style={[styles.trendPill, { backgroundColor: '#10b981' }]}>
              <TrendingUp color="white" size={12} />
              <Text style={styles.trendText}>94.4%</Text>
            </View>
          </View>
          <Text style={styles.statValue}>₹{revenue}</Text>
          <Text style={styles.statLabel}>Revenue Today</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#ffe4e6' }]}>
              <Clock color="#ff5722" size={20} />
            </View>
            <View style={[styles.trendPill, { backgroundColor: '#fee2e2' }]}>
              <TrendingUp color="#ff5722" size={12} />
              <Text style={[styles.trendText, { color: '#ff5722' }]}>Live</Text>
            </View>
          </View>
          <Text style={styles.statValue}>{pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending Orders</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}>
              <LayoutDashboard color="#10b981" size={20} />
            </View>
            <View style={[styles.trendPill, { backgroundColor: '#10b981' }]}>
              <TrendingUp color="white" size={12} />
              <Text style={styles.trendText}>63%</Text>
            </View>
          </View>
          <Text style={styles.statValue}>
            {tables.filter(t => t.status && t.status.toLowerCase() === 'occupied').length}/{tables.length || 19}
          </Text>
          <Text style={styles.statLabel}>Active Tables</Text>
        </View>
      </View>

      {/* Best Sellers */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bestSellersScroll} contentContainerStyle={{ gap: 15, paddingRight: 20 }}>
        <View style={styles.bestSellerCard}>
          <View style={styles.bestSellerIcon}>
            <Flame color="white" size={24} />
          </View>
          <View>
            <Text style={styles.bestSellerTag}>BEST SELLER</Text>
            <Text style={styles.bestSellerName}>Parcel Meals</Text>
            <Text style={styles.bestSellerCount}>100 orders today</Text>
          </View>
        </View>
        <View style={styles.bestSellerCard}>
          <View style={styles.bestSellerIcon}>
            <Flame color="white" size={24} />
          </View>
          <View>
            <Text style={styles.bestSellerTag}>BEST SELLER</Text>
            <Text style={styles.bestSellerName}>Tomato Salad</Text>
            <Text style={styles.bestSellerCount}>36 orders today</Text>
          </View>
        </View>
      </ScrollView>

      {/* Recent Orders */}
      <View style={styles.recentOrdersHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.updatedText}>Updated just now</Text>
      </View>

      {orders.length > 0 ? (
        [...orders].sort((a, b) => (b.order_id || 0) - (a.order_id || 0)).slice(0, 5).map((o, i) => (
          <View key={i} style={styles.orderListItem}>
            <Text style={styles.orderId}>#{o.order_id || '2329'}</Text>
            <View style={styles.orderDetailsInfo}>
              <Text style={styles.orderItemName}>{o.items?.[0]?.name || 'Sambar Idly'} (2) x1</Text>
              <Text style={styles.orderSubtext}>Takeaway • 10:41 AM</Text>
            </View>
            <View style={styles.orderStatusPill}>
              <Text style={styles.orderStatusText}>{o.status === 'PENDING' ? 'Pending' : 'Prep'}</Text>
            </View>
            <Text style={styles.orderPrice}>₹{o.total_amount || '1'}</Text>
          </View>
        ))
      ) : (
        <View style={styles.orderListItem}>
            <Text style={styles.orderId}>#2329</Text>
            <View style={styles.orderDetailsInfo}>
              <Text style={styles.orderItemName}>Sambar Idly (2) x1</Text>
              <Text style={styles.orderSubtext}>Takeaway • 10:41 AM</Text>
            </View>
            <View style={styles.orderStatusPill}>
              <Text style={styles.orderStatusText}>Pending</Text>
            </View>
            <Text style={styles.orderPrice}>₹1</Text>
        </View>
      )}
      <View style={{ height: 100 }} /> 
    </ScrollView>
  );

  const renderPlaceholder = (title) => (
    <View style={[styles.dashboardScroll, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={{ color: 'gray', marginTop: 10 }}>This module is currently being developed.</Text>
    </View>
  );

  return (
    <View 
      style={[styles.container, { height: windowHeight, maxHeight: windowHeight }]}
      onStartShouldSetResponderCapture={(evt) => { handleGlobalTouch(); return false; }}
    >
      {/* Top Header - Global */}
      <View style={styles.topHeader}>
        <View style={styles.headerTopRow}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={{ width: 140, height: 35 }} resizeMode="contain" />
          </View>
          <View style={styles.managerBadge}>
            <Text style={styles.managerBadgeText}>MANAGER</Text>
          </View>
        </View>

        {(activeTab === 'dashboard' || activeTab === 'menu' || activeTab === 'orders') && (
          <>
            <View style={styles.headerMiddleRow}>
              <Text style={styles.greetingText}>Good Morning!</Text>
              <View style={styles.openStatusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.openStatusText}>Open</Text>
              </View>
            </View>
            <Text style={styles.userInfoText}>
              {user?.name || 'Marimuthu A'} • Grand Udipi Palace
            </Text>
          </>
        )}

        {activeTab === 'tables' && (
          <>
            <View style={styles.headerMiddleRow}>
              <Text style={styles.greetingText}>Table & QR</Text>
              <TouchableOpacity style={styles.actionBtnHeader} onPress={() => DeviceEventEmitter.emit('onAddTable')}>
                <Text style={styles.actionBtnHeaderText}>+ Table</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.userInfoText}>
              12 occupied • 7 vacant • 19 total
            </Text>
          </>
        )}

        {activeTab === 'inventory' && (
          <>
            <View style={styles.headerMiddleRow}>
              <Text style={styles.greetingText}>Inventory</Text>
            </View>
            <Text style={styles.userInfoText}>
              Manage stock levels and scan invoices
            </Text>
          </>
        )}

        {activeTab === 'payments' && (
          <>
            <View style={styles.headerMiddleRow}>
              <Text style={styles.greetingText}>Payments</Text>
            </View>
            <Text style={styles.userInfoText}>
              Track all payment transactions
            </Text>
          </>
        )}

        {activeTab === 'reports' && (
          <>
            <View style={styles.headerMiddleRow}>
              <Text style={styles.greetingText}>Reports & Analytics</Text>
            </View>
            <Text style={styles.userInfoText}>
              Your restaurant performance insights
            </Text>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <View style={styles.headerMiddleRow}>
              <Text style={styles.greetingText}>Account & Settings</Text>
              <TouchableOpacity style={styles.actionBtnHeader}>
                <Text style={styles.actionBtnHeaderText}>Save</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.userInfoText}>
              Manage your account preferences
            </Text>
          </>
        )}
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'menu' && <MenuManagement />}
        {activeTab === 'orders' && <OrdersManagement />}
        {activeTab === 'tables' && <TableManagement />}
        {activeTab === 'inventory' && <InventoryManagement setActiveTab={setActiveTab} />}
        {activeTab === 'consumption' && <ConsumptionReports />}
        {activeTab === 'payments' && <PaymentsManagement />}
        {activeTab === 'reports' && <ReportsAnalytics />}
        {activeTab === 'settings' && <SettingsManagement />}
      </View>

      {/* Popover Menu for 'More' - MUST STAY ABSOLUTE AND RENDER AFTER CONTENT */}
      {isMoreMenuOpen && (
        <TouchableOpacity style={styles.popoverOverlay} activeOpacity={1} onPress={() => setIsMoreMenuOpen(false)}>
          <View style={styles.popoverMenu}>
            <TouchableOpacity style={styles.popoverItem} onPress={() => { setActiveTab('inventory'); setIsMoreMenuOpen(false); }}>
              <Package color="#4b5563" size={20} />
              <Text style={styles.popoverText}>Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popoverItem} onPress={() => { setActiveTab('payments'); setIsMoreMenuOpen(false); }}>
              <CircleDollarSign color="#4b5563" size={20} />
              <Text style={styles.popoverText}>Payments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popoverItem} onPress={() => { setActiveTab('reports'); setIsMoreMenuOpen(false); }}>
              <TrendingUp color="#4b5563" size={20} />
              <Text style={styles.popoverText}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popoverItem} onPress={() => { setActiveTab('settings'); setIsMoreMenuOpen(false); }}>
              <Settings color="#4b5563" size={20} />
              <Text style={styles.popoverText}>Settings</Text>
            </TouchableOpacity>
            <View style={styles.popoverDivider} />
            <TouchableOpacity style={styles.popoverItem} onPress={handleLogout}>
              <LogOut color="#ef4444" size={20} />
              <Text style={[styles.popoverText, { color: '#ef4444' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Global Voice Widget */}
      <VoiceWidget isHidden={isWidgetHidden} onNavigate={(page) => setActiveTab(page.toLowerCase())} />

      {/* Bottom Tab Bar */}
      <View style={[styles.bottomTabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('dashboard'); setIsMoreMenuOpen(false); }}>
          <LayoutDashboard color={activeTab === 'dashboard' ? '#ff5722' : '#9ca3af'} size={24} />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('menu'); setIsMoreMenuOpen(false); }}>
          <UtensilsCrossed color={activeTab === 'menu' ? '#ff5722' : '#9ca3af'} size={24} />
          <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('orders'); setIsMoreMenuOpen(false); }}>
          <ShoppingCart color={activeTab === 'orders' ? '#ff5722' : '#9ca3af'} size={24} />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('tables'); setIsMoreMenuOpen(false); }}>
          <Table2 color={activeTab === 'tables' ? '#ff5722' : '#9ca3af'} size={24} />
          <Text style={[styles.tabText, activeTab === 'tables' && styles.activeTabText]}>Tables</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setIsMoreMenuOpen(!isMoreMenuOpen)}>
          <MoreHorizontal color={isMoreMenuOpen ? '#ff5722' : '#9ca3af'} size={24} />
          <Text style={[styles.tabText, isMoreMenuOpen && styles.activeTabText]}>More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
    overflow: 'hidden' 
  },
  
  // Top Header Styles
  topHeader: {
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // for safe area
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 10, // Ensure header is above content
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  managerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  managerBadgeText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  headerMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greetingText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  openStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  openStatusText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 12,
  },
  userInfoText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  actionBtnHeader: {
    backgroundColor: '#ff5722',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionBtnHeaderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Main Content
  mainContent: {
    flex: 1,
    flexShrink: 1,
    overflow: 'hidden',
  },
  dashboardScroll: {
    flex: 1,
  },
  dashboardContent: {
    padding: 20,
    paddingTop: 35,
    paddingBottom: 40,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    width: (width - 55) / 2, // 2 columns with gaps
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 2,
  },
  trendText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },

  // Best Sellers
  bestSellersScroll: {
    marginBottom: 25,
  },
  bestSellerCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    minWidth: 220,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  bestSellerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bestSellerTag: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bestSellerName: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bestSellerCount: {
    color: '#94a3b8',
    fontSize: 12,
  },

  // Recent Orders
  recentOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  liveBadge: {
    backgroundColor: '#ff5722',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  updatedText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  orderListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  orderId: {
    color: '#ff5722',
    fontWeight: 'bold',
    fontSize: 14,
    width: 60,
  },
  orderDetailsInfo: {
    flex: 1,
  },
  orderItemName: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  orderSubtext: {
    color: '#94a3b8',
    fontSize: 12,
  },
  orderStatusPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 10,
  },
  orderStatusText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  orderPrice: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1e293b',
  },

  // Bottom Tab Bar
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 100,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  activeTabText: {
    color: '#ff5722',
  },

  // Popover Menu
  popoverOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  popoverMenu: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    width: 180,
    padding: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  popoverText: {
    fontSize: 15,
    color: '#4b5563',
    fontWeight: '500',
  },
  popoverDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 5,
  },
});
