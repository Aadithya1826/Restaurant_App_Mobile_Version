import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, FlatList, Alert, TextInput, ActivityIndicator } from 'react-native';
import { orderService } from '../services/api';
import { Clock, ChefHat, CheckCircle2, Search, SlidersHorizontal, Truck } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'PENDING', title: 'New Orders', icon: Clock },
  { id: 'PREPARING', title: 'Preparing', icon: ChefHat },
  { id: 'READY', title: 'Ready', icon: CheckCircle2 },
  { id: 'SERVED', title: 'Served', icon: Truck },
];

export default function OrdersManagement() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [orderMode, setOrderMode] = useState('DINE_IN');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchOrders = async () => {
    if (!user?.restaurant_id) return;
    try {
      const data = await orderService.getLiveOrders({ restaurant_id: user.restaurant_id });
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await orderService.updateOrderStatus(id, status);
      fetchOrders();
    } catch (e) {
      Alert.alert("Error", "Failed to update order status");
    }
  };

  const isTakeaway = (order) => !order.table_number || order.table_number === 'N/A' || order.table_number.toString().toLowerCase() === 'takeaway';

  const filteredOrders = orders.filter(o => {
    const matchesMode = orderMode === 'TAKEAWAY' ? isTakeaway(o) : !isTakeaway(o);
    const matchesTab = activeTab === 'PENDING' ? (o.status === 'PENDING' || o.status === 'CONFIRMED') : o.status === activeTab;
    const matchesSearch = o.order_id?.toString().includes(searchQuery) || o.table_number?.toString().includes(searchQuery);
    return matchesMode && matchesTab && matchesSearch;
  });
  
  // Live data counts
  const activeOrdersCount = orders.length;
  const takeawayCount = orders.filter(o => isTakeaway(o)).length;
  const dineInCount = orders.length - takeawayCount;
  const countsByTab = {
    'PENDING': orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length,
    'PREPARING': orders.filter(o => o.status === 'PREPARING').length,
    'READY': orders.filter(o => o.status === 'READY').length,
    'SERVED': orders.filter(o => o.status === 'SERVED').length,
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs > 0) return `${diffHrs} hr ago`;
    if (diffMins > 0) return `${diffMins} min ago`;
    return 'Just now';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Orders</Text>
          <Text style={styles.subtitle}>Kitchen Display - Real-time</Text>
        </View>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>• {activeOrdersCount} active</Text>
        </View>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity 
          style={[styles.segmentBtn, orderMode === 'DINE_IN' && styles.activeSegmentBtn]} 
          onPress={() => setOrderMode('DINE_IN')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.segmentText, orderMode === 'DINE_IN' && styles.activeSegmentText]}>Dine-In</Text>
            <View style={styles.segmentBadge}>
              <Text style={styles.segmentBadgeText}>{dineInCount}</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.segmentBtn, orderMode === 'TAKEAWAY' && styles.activeSegmentBtn]} 
          onPress={() => setOrderMode('TAKEAWAY')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.segmentText, orderMode === 'TAKEAWAY' && styles.activeSegmentText]}>Takeaway</Text>
            <View style={styles.segmentBadge}>
              <Text style={styles.segmentBadgeText}>{takeawayCount}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Search color="#9ca3af" size={20} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search Order ID..." 
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterBtn}>
          <SlidersHorizontal color="#4b5563" size={18} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={{ paddingRight: 20 }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity key={tab.id} style={[styles.tabBtn, isActive ? styles.activeTabBtn : styles.inactiveTabBtn]} onPress={() => setActiveTab(tab.id)}>
                <Icon color={isActive ? 'white' : '#f59e0b'} size={14} />
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.title}</Text>
                {countsByTab[tab.id] > 0 && (
                  <View style={isActive ? styles.countBadgeActive : styles.countBadgeInactive}>
                    <Text style={isActive ? styles.countBadgeTextActive : styles.countBadgeTextInactive}>{countsByTab[tab.id]}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      {loading ? <ActivityIndicator size="large" color="#ff5722" style={{ marginTop: 20 }} /> : (
        <FlatList
          style={{ flex: 1 }}
          data={filteredOrders}
          keyExtractor={item => item.order_id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item.order_id}</Text>
                <View style={styles.timePill}>
                  <Text style={styles.timeText}>{formatTimeAgo(item.created_at)}</Text>
                </View>
              </View>
              
              <View style={styles.itemsContainer}>
                <Text style={styles.itemsText}>{item.items?.map(i => `${i.name} x${i.quantity}`).join('\n') || 'No items'}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.tableText}>{isTakeaway(item) ? 'Takeaway' : `Table ${item.table_number}`}</Text>
                <Text style={styles.priceText}>₹ {item.total_amount || '0'}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.detailsBtn}>
                  <Text style={styles.detailsBtnText}>Details</Text>
                </TouchableOpacity>
                
                {item.status === 'PENDING' || item.status === 'CONFIRMED' ? (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.order_id, 'PREPARING')}>
                    <Text style={styles.actionText}>Start Preparing</Text>
                  </TouchableOpacity>
                ) : item.status === 'PREPARING' ? (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.order_id, 'READY')}>
                    <Text style={styles.actionText}>Mark Ready</Text>
                  </TouchableOpacity>
                ) : item.status === 'READY' ? (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.order_id, 'SERVED')}>
                    <Text style={styles.actionText}>Mark Served</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} disabled>
                    <Text style={styles.actionText}>Completed</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={{ color: 'gray' }}>No orders found.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, paddingBottom: 40, paddingHorizontal: 20 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { color: '#9ca3af', fontSize: 13, marginTop: 4 },
  activePill: { 
    backgroundColor: '#ff4444', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  activePillText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 30,
    padding: 6,
    marginBottom: 20,
    width: '80%',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSegmentBtn: {
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeSegmentText: {
    color: '#1e293b',
  },
  segmentBadge: {
    backgroundColor: '#ff5722',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  segmentBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1e293b',
  },
  filterBtn: {
    padding: 5,
  },

  tabsScroll: {
    marginBottom: 20,
    maxHeight: 45,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    gap: 8,
  },
  activeTabBtn: {
    backgroundColor: '#111827',
  },
  inactiveTabBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  activeTabText: {
    color: 'white',
  },
  countBadgeInactive: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeTextInactive: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  countBadgeTextActive: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff5722',
  },
  timePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  itemsContainer: {
    marginBottom: 15,
  },
  itemsText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 15,
    marginBottom: 15,
  },
  tableText: {
    color: '#64748b',
    fontSize: 14,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  detailsBtnText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionBtn: {
    flex: 1.5,
    backgroundColor: '#ff5722',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
