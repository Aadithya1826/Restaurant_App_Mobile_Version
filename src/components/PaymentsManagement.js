import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { IndianRupee, Wallet, CreditCard, Banknote, TrendingUp } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';

export default function PaymentsManagement() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user?.restaurant_id) return;
    try {
      setLoading(true);
      const data = await orderService.getAllOrders({ restaurant_id: user.restaurant_id });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch orders for payments', err);
    } finally {
      setLoading(false);
    }
  };

  const paidOrders = orders.filter(o => o.payment_status?.toLowerCase() === 'paid');

  const totalCollection = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const upiPayments = paidOrders
    .filter(o => o.payment_method?.toLowerCase() === 'upi' || o.payment_method?.toLowerCase() === 'razorpay')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const cardPayments = paidOrders
    .filter(o => o.payment_method?.toLowerCase() === 'card')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const cashPayments = paidOrders
    .filter(o => o.payment_method?.toLowerCase() === 'cash')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    const dStr = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(dStr);
    const now = new Date();
    const diffTime = Math.max(0, now - date);
    const diffMins = Math.floor(diffTime / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const metrics = [
    {
      id: 1,
      title: 'Overall Collection',
      value: `₹${totalCollection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      trend: '+8%',
      trendUp: true,
      icon: IndianRupee,
      iconColor: '#ff5722',
      iconBg: '#ffebd2',
    },
    {
      id: 2,
      title: 'UPI Payments',
      value: `₹${upiPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      trend: '+52%',
      trendUp: true,
      icon: Wallet,
      iconColor: '#ef4444',
      iconBg: '#fee2e2',
    },
    {
      id: 3,
      title: 'Card Payments',
      value: `₹${cardPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      trend: '+18%',
      trendUp: true,
      icon: CreditCard,
      iconColor: '#10b981',
      iconBg: '#dcfce7',
    },
    {
      id: 4,
      title: 'Cash',
      value: `₹${cashPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      trend: '+25%',
      trendUp: true,
      icon: Banknote,
      iconColor: '#6b7280',
      iconBg: '#f3f4f6',
    }
  ];

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {loading ? <ActivityIndicator size="large" color="#ff5722" style={{ marginTop: 20 }} /> : (
        <>
          {metrics.map((metric) => {
            const IconComponent = metric.icon;
            return (
              <View key={metric.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: metric.iconBg }]}>
                    <IconComponent color={metric.iconColor} size={24} />
                  </View>
                  <View style={styles.trendContainer}>
                    <TrendingUp color={metric.trendUp ? '#10b981' : '#ef4444'} size={16} />
                    <Text style={[styles.trendText, { color: metric.trendUp ? '#10b981' : '#ef4444' }]}>
                      {metric.trend}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cardBody}>
                  <Text style={styles.valueText}>{metric.value}</Text>
                  <Text style={styles.titleText}>{metric.title}</Text>
                </View>
              </View>
            );
          })}

          <View style={styles.historyCard}>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyTitle}>Transaction History</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerText, { width: 80 }]}>Order</Text>
                  <Text style={[styles.headerText, { width: 100 }]}>Table</Text>
                  <Text style={[styles.headerText, { width: 90 }]}>Amount</Text>
                  <Text style={[styles.headerText, { width: 90 }]}>Method</Text>
                  <Text style={[styles.headerText, { width: 110 }]}>Time</Text>
                  <Text style={[styles.headerText, { width: 90 }]}>Status</Text>
                </View>

                {orders.map((order, index) => {
                  const isTakeaway = !order.table_number || order.table_number === 'N/A' || order.table_number.toString().toLowerCase() === 'takeaway';
                  const tableDisplay = isTakeaway ? 'Takeaway' : order.table_number.toString().replace('T-', '');
                  const isPaid = order.payment_status?.toLowerCase() === 'paid';
                  const isPending = order.payment_status?.toLowerCase() === 'pending';
                  const isFailed = order.payment_status?.toLowerCase() === 'failed';
                  
                  return (
                    <View key={order.order_id || index} style={styles.tableRow}>
                      <Text style={[styles.rowCell, { width: 80, color: '#ff5722', fontWeight: 'bold' }]}>
                        #{order.order_id}
                      </Text>
                      <Text style={[styles.rowCell, { width: 100, color: '#1e293b', fontWeight: '600' }]}>
                        {tableDisplay}
                      </Text>
                      <Text style={[styles.rowCell, { width: 90, color: '#1e293b', fontWeight: 'bold' }]}>
                        ₹{order.total_amount || 0}
                      </Text>
                      <Text style={[styles.rowCell, { width: 90, color: '#64748b', textTransform: 'capitalize' }]}>
                        {order.payment_method || 'N/A'}
                      </Text>
                      <Text style={[styles.rowCell, { width: 110, color: '#64748b' }]}>
                        {formatTimeAgo(order.created_at)}
                      </Text>
                      <View style={{ width: 90 }}>
                        {isPaid && (
                          <View style={[styles.statusPill, { backgroundColor: '#f0fdf4' }]}>
                            <Text style={[styles.statusText, { color: '#16a34a' }]}>Paid</Text>
                          </View>
                        )}
                        {isPending && (
                          <View style={[styles.statusPill, { backgroundColor: '#fffbeb' }]}>
                            <Text style={[styles.statusText, { color: '#d97706' }]}>Pending</Text>
                          </View>
                        )}
                        {isFailed && (
                          <View style={[styles.statusPill, { backgroundColor: '#fff0f0' }]}>
                            <Text style={[styles.statusText, { color: '#ff4d4d' }]}>Failed</Text>
                          </View>
                        )}
                        {(!isPaid && !isPending && !isFailed) && (
                          <Text style={[styles.rowCell, { color: '#64748b' }]}>{order.payment_status || 'N/A'}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
                
                {orders.length === 0 && (
                  <Text style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No transactions found.</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 35,
    paddingBottom: 40,
    gap: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 4,
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  titleText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 15,
    paddingTop: 20,
    paddingBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    overflow: 'hidden',
  },
  historyHeaderRow: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  rowCell: {
    fontSize: 14,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  }
});
