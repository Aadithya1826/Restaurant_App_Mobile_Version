import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { IndianRupee, TrendingDown, TrendingUp, Clock, PieChart } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Text as SvgText, Circle } from 'react-native-svg';
import { reportsService } from '../services/api';

const { width } = Dimensions.get('window');

export default function ReportsAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await reportsService.getReports();
      setData(response);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ff5722" />
      </View>
    );
  }

  const { summary, chart_data, payment_methods, top_items, order_breakdown, total_orders } = data;

  const renderMetricCard = (title, value, change, iconColor, bgColor, IconComponent = IndianRupee) => {
    const isUp = change.includes('+');
    const changeColor = isUp ? '#10b981' : '#ef4444';
    const TrendIcon = isUp ? TrendingUp : TrendingDown;
    
    return (
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
            <IconComponent color={iconColor} size={20} />
          </View>
          <View style={styles.trendBox}>
            <TrendIcon color={changeColor} size={14} />
            <Text style={[styles.trendText, { color: changeColor }]}>{change}</Text>
          </View>
        </View>
        <Text style={styles.metricValue}>₹{value.toLocaleString()}</Text>
        <Text style={styles.metricLabel}>{title}</Text>
      </View>
    );
  };

  const renderChart = () => {
    if (!chart_data || chart_data.length === 0) return null;

    const chartWidth = width - 80; // card padding is 20 + 20, plus margin 20 + 20 -> rough
    const chartHeight = 150;
    const maxRev = Math.max(...chart_data.map(d => d.revenue), 100);
    const minRev = 0;

    const points = chart_data.map((d, i) => {
      const x = (i / (chart_data.length - 1)) * chartWidth;
      const y = chartHeight - ((d.revenue - minRev) / (maxRev - minRev)) * chartHeight;
      return { x, y, value: d.revenue, label: d.name };
    });

    const dPath = points.map((p, i) => 
      (i === 0 ? 'M' : 'L') + ` ${p.x},${p.y}`
    ).join(' ');

    // For smooth curve, we could use bezier but let's stick to lines for simplicity 
    // or simple cubic bezier if needed. Given react-native-svg limits, L is safer.
    // Let's add area fill path
    const areaPath = `${dPath} L ${points[points.length-1].x},${chartHeight} L 0,${chartHeight} Z`;

    const yAxisLabels = [8000, 6000, 4000, 2000, 0];

    return (
      <View style={styles.chartCard}>
        <View style={styles.cardHeader}>
          <TrendingUp color="#ff5722" size={20} />
          <Text style={styles.cardTitle}>Revenue Trend</Text>
        </View>
        <View style={styles.chartWrapper}>
          {/* Y Axis Labels (Mocked) */}
          <View style={styles.yAxis}>
            {yAxisLabels.map(v => (
              <Text key={v} style={styles.yAxisText}>₹{v >= 1000 ? v/1000 + 'K' : v}</Text>
            ))}
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ width: chartWidth + 40, height: chartHeight + 40 }}>
              {/* Horizontal Grid Lines */}
              <Svg height={chartHeight} width={chartWidth + 40} style={{ position: 'absolute', top: 10, left: 10 }}>
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                  <Path key={i} d={`M0,${pct * chartHeight} L${chartWidth},${pct * chartHeight}`} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4,4" />
                ))}
              </Svg>

              <Svg height={chartHeight + 40} width={chartWidth + 40} style={{ marginTop: 10, marginLeft: 10 }}>
                <Defs>
                  <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#ff5722" stopOpacity="0.3" />
                    <Stop offset="1" stopColor="#ff5722" stopOpacity="0.0" />
                  </LinearGradient>
                </Defs>
                
                {/* Area Fill */}
                <Path d={areaPath} fill="url(#grad)" />
                
                {/* Line */}
                <Path d={dPath} fill="none" stroke="#ff5722" strokeWidth="3" />
                
                {/* Points and Labels */}
                {points.map((p, i) => (
                  <React.Fragment key={i}>
                    <Circle cx={p.x} cy={p.y} r={4} fill="white" stroke="#ff5722" strokeWidth="2" />
                    <SvgText 
                      x={p.x} y={p.y - 10} 
                      fontSize="10" 
                      fill="#1e293b" 
                      textAnchor="middle" 
                      fontWeight="bold"
                    >
                      ₹{p.value >= 1000 ? (p.value/1000).toFixed(1) + 'K' : p.value}
                    </SvgText>
                    <SvgText 
                      x={p.x} y={chartHeight + 20} 
                      fontSize="11" 
                      fill="#94a3b8" 
                      textAnchor="middle"
                    >
                      {p.label}
                    </SvgText>
                  </React.Fragment>
                ))}
              </Svg>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderPaymentMethods = () => {
    if (!payment_methods) return null;
    const maxVal = Math.max(...payment_methods.map(p => p.value), 1);
    const colors = {
      'Razorpay': '#ff5722',
      'Cash': '#10b981',
      'UPI': '#fba11b', // light orange
      'Wallet': '#64748b'
    };

    return (
      <View style={styles.listCard}>
        <View style={styles.cardHeader}>
          <PieChart color="#ff5722" size={20} />
          <Text style={styles.cardTitle}>Payment Methods</Text>
        </View>
        <View style={styles.listContent}>
          {payment_methods.map((method, index) => {
            const widthPct = (method.value / maxVal) * 100;
            const barColor = colors[method.name] || '#9ca3af';
            return (
              <View key={index} style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barName}>{method.name}</Text>
                  <Text style={styles.barValue}>₹{method.value.toLocaleString()}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${widthPct}%`, backgroundColor: barColor }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTopItems = () => {
    if (!top_items) return null;
    const maxRev = Math.max(...top_items.map(t => t.revenue), 1);

    return (
      <View style={styles.listCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cubeIcon}>
            <View style={styles.cubeInner} />
          </View>
          <Text style={styles.cardTitle}>Top Selling Items</Text>
        </View>
        <View style={styles.listContent}>
          {top_items.map((item, index) => {
            const widthPct = (item.revenue / maxRev) * 100;
            return (
              <View key={index} style={styles.topItemRow}>
                <View style={styles.rankCircle}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.topItemDetails}>
                  <View style={styles.barHeader}>
                    <Text style={styles.barName}>{item.name}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.barValue}>₹{item.revenue.toLocaleString()}</Text>
                      <Text style={styles.barSubValue}>{item.orders}</Text>
                    </View>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${widthPct}%`, backgroundColor: '#ff5722' }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderOrderBreakdown = () => {
    if (!order_breakdown) return null;
    const colors = { 'Dine-in': '#ff5722', 'Takeaway': '#10b981', 'Delivery': '#64748b' };
    
    return (
      <View style={styles.listCard}>
        <View style={styles.cardHeader}>
          <TrendingUp color="#ff5722" size={20} />
          <Text style={styles.cardTitle}>Order Breakdown</Text>
        </View>
        <View style={styles.listContent}>
          {order_breakdown.map((item, index) => {
            const pct = total_orders > 0 ? Math.round((item.value / total_orders) * 100) : 0;
            const barColor = colors[item.name] || '#ff5722';
            return (
              <View key={index} style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barName}>{item.name}</Text>
                  <Text style={styles.barValue}>{item.value} <Text style={{ color: '#94a3b8', fontSize: 11 }}>({pct}%)</Text></Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                </View>
              </View>
            );
          })}
          
          <View style={styles.totalOrdersRow}>
            <Text style={styles.totalOrdersLabel}>Total Orders per Today</Text>
            <Text style={styles.totalOrdersValue}>{total_orders}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      
      {/* Metric Cards Grid */}
      <View style={styles.metricsGrid}>
        {renderMetricCard("Today's Revenue", summary.today_revenue.value, summary.today_revenue.change, '#ff5722', '#ffebd2')}
        {renderMetricCard("Weekly Revenue", summary.weekly_revenue.value, summary.weekly_revenue.change, '#10b981', '#dcfce7')}
        {renderMetricCard("Monthly Revenue", summary.monthly_revenue.value, summary.monthly_revenue.change, '#ff5722', '#ffebd2')}
        {renderMetricCard("Avg. Order Value", summary.avg_order_value.value, summary.avg_order_value.change, '#10b981', '#dcfce7')}
      </View>

      {/* Charts & Lists */}
      {renderChart()}
      {renderPaymentMethods()}
      {renderTopItems()}
      {renderOrderBreakdown()}
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 35,
    paddingBottom: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
    rowGap: 15,
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    width: '47%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  
  // Charts & Lists common
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  listCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  
  // Chart specifically
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxis: {
    justifyContent: 'space-between',
    height: 150,
    marginRight: 10,
    paddingTop: 10,
  },
  yAxisText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  
  // Bars
  listContent: {
    gap: 15,
  },
  barItem: {
    marginBottom: 5,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  barName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  barValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  barSubValue: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'right',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Top Items
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 5,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  topItemDetails: {
    flex: 1,
  },
  cubeIcon: {
    width: 20, height: 20, borderWidth: 1.5, borderColor: '#ff5722', borderRadius: 4, alignItems: 'center', justifyContent: 'center'
  },
  cubeInner: {
    width: 8, height: 8, backgroundColor: '#ff5722', borderRadius: 2
  },

  // Total Orders
  totalOrdersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalOrdersLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  totalOrdersValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff5722',
  },
});
