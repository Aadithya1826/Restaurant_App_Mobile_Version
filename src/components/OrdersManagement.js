import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, FlatList, Alert } from 'react-native';
import { orderService } from '../services/api';
import { Clock, ChefHat, CheckCircle2, Truck } from 'lucide-react-native';

const TABS = [
  { id: 'PENDING', title: 'New', icon: Clock },
  { id: 'PREPARING', title: 'Prep', icon: ChefHat },
  { id: 'READY', title: 'Ready', icon: CheckCircle2 },
  { id: 'SERVED', title: 'Served', icon: Truck },
];

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [orderMode, setOrderMode] = useState('DINE_IN');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getLiveOrders();
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
    return matchesMode && matchesTab;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Orders (KDS)</Text>
      </View>

      <View style={styles.modeToggle}>
        <TouchableOpacity style={[styles.modeBtn, orderMode === 'DINE_IN' && styles.activeModeBtn]} onPress={() => setOrderMode('DINE_IN')}>
          <Text style={[styles.modeText, orderMode === 'DINE_IN' && styles.activeModeText]}>Dine-In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeBtn, orderMode === 'TAKEAWAY' && styles.activeModeBtn]} onPress={() => setOrderMode('TAKEAWAY')}>
          <Text style={[styles.modeText, orderMode === 'TAKEAWAY' && styles.activeModeText]}>Takeaway</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={[styles.tab, isActive && styles.activeTab]} onPress={() => setActiveTab(tab.id)}>
              <Icon color={isActive ? 'white' : 'gray'} size={16} />
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? <Text>Loading...</Text> : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.order_id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item.order_id}</Text>
                <Text style={styles.time}>{new Date(item.created_at).toLocaleTimeString()}</Text>
              </View>
              <Text style={styles.items}>{item.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.table}>{isTakeaway(item) ? 'Takeaway' : `Table ${item.table_number}`}</Text>
                <Text style={styles.price}>₹{item.total_amount}</Text>
              </View>
              <View style={styles.actions}>
                {item.status === 'PENDING' || item.status === 'CONFIRMED' ? (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.order_id, 'PREPARING')}><Text style={styles.actionText}>Start Prep</Text></TouchableOpacity>
                ) : item.status === 'PREPARING' ? (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.order_id, 'READY')}><Text style={styles.actionText}>Mark Ready</Text></TouchableOpacity>
                ) : item.status === 'READY' ? (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.order_id, 'SERVED')}><Text style={styles.actionText}>Mark Served</Text></TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  header: { marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold' },
  modeToggle: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 20, padding: 5, marginBottom: 15, alignSelf: 'flex-start' },
  modeBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 15 },
  activeModeBtn: { backgroundColor: 'white', elevation: 2 },
  modeText: { color: 'gray', fontWeight: 'bold' },
  activeModeText: { color: 'black' },
  tabs: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  tab: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 10, borderRadius: 20, gap: 5, flex: 1, marginHorizontal: 2, justifyContent: 'center' },
  activeTab: { backgroundColor: '#111' },
  tabText: { fontSize: 12, fontWeight: 'bold', color: 'gray' },
  activeTabText: { color: 'white' },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#ff6b35' },
  time: { color: 'gray', fontSize: 12 },
  items: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 10, marginBottom: 10 },
  table: { color: 'gray', fontSize: 12 },
  price: { fontSize: 16, fontWeight: 'bold' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: { backgroundColor: '#ff6b35', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  actionText: { color: 'white', fontWeight: 'bold', fontSize: 12 }
});
