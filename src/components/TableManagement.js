import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator, Platform, Modal, DeviceEventEmitter } from 'react-native';
import { Search, UtensilsCrossed, Clock, Edit2, Trash2, QrCode, Users, X, ChevronDown } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { tableService } from '../services/api';

export default function TableManagement() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, OCCUPIED, VACANT
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({ table_number: '', capacity: 4, status: 'Vacant', qr_url: '' });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('onAddTable', () => openModal(null));
    return () => listener.remove();
  }, []);

  const openModal = (table = null) => {
    setEditingTable(table);
    setFormData(table ? {
      table_number: table.table_number,
      capacity: table.capacity || 4,
      status: table.status || 'Vacant',
      qr_url: table.qr_url || ''
    } : { table_number: '', capacity: 4, status: 'Vacant', qr_url: '' });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingTable) await tableService.updateTable(editingTable.id, formData);
      else await tableService.createTable({...formData, restaurant_id: user.restaurant_id});
      setIsModalOpen(false);
      fetchTables();
    } catch(e) { Alert.alert("Error", "Failed to save table"); }
  };

  useEffect(() => {
    fetchTables();
  }, [user]);

  const fetchTables = async () => {
    if (!user?.restaurant_id) return;
    try {
      setLoading(true);
      const data = await tableService.getTables({ restaurant_id: user.restaurant_id });
      setTables(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  };

  const occupiedCount = tables.filter(t => t.status && t.status.toLowerCase() === 'occupied').length;
  const vacantCount = tables.filter(t => !t.status || t.status.toLowerCase() !== 'occupied').length;
  const totalCount = tables.length;
  const occupancyRate = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0;

  const filteredTables = tables.filter(t => {
    const isOccupied = t.status && t.status.toLowerCase() === 'occupied';
    if (filter === 'OCCUPIED' && !isOccupied) return false;
    if (filter === 'VACANT' && isOccupied) return false;
    if (searchQuery && !String(t.table_number).toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id) => {
    if (Platform.OS === 'web' && !window.confirm('Are you sure you want to delete this table?')) return;
    try { await tableService.deleteTable(id); fetchTables(); } catch (e) { Alert.alert("Error", "Failed to delete"); }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 35, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Live Floor Card */}
      <View style={styles.liveFloorCard}>
        <Text style={styles.liveFloorTitle}>LIVE FLOOR</Text>
        
        <View style={styles.liveFloorMain}>
          <View>
            <Text style={styles.liveFloorPercent}>{occupancyRate}%</Text>
            <Text style={styles.liveFloorSub}>Occupancy - {occupiedCount} of {totalCount} tables seated</Text>
          </View>
          <View style={styles.progressRing}>
            <View style={styles.progressRingInner} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>OCCUPIED</Text>
            <Text style={styles.statBoxValue}>{occupiedCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>VACANT</Text>
            <Text style={styles.statBoxValue}>{vacantCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>INACTIVE</Text>
            <Text style={styles.statBoxValue}>0</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search color="#9ca3af" size={20} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Find a table or order"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingRight: 20 }}>
        <TouchableOpacity 
          style={[styles.filterPill, filter === 'ALL' ? styles.filterPillActive : styles.filterPillInactive]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterText, filter === 'ALL' ? styles.filterTextActive : styles.filterTextInactive]}>All {totalCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterPill, filter === 'OCCUPIED' ? styles.filterPillActive : styles.filterPillInactive]}
          onPress={() => setFilter('OCCUPIED')}
        >
          <Text style={[styles.filterText, filter === 'OCCUPIED' ? styles.filterTextActive : styles.filterTextInactive]}>Occupied {occupiedCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterPill, filter === 'VACANT' ? styles.filterPillActive : styles.filterPillInactive]}
          onPress={() => setFilter('VACANT')}
        >
          <Text style={[styles.filterText, filter === 'VACANT' ? styles.filterTextActive : styles.filterTextInactive]}>Vacant {vacantCount}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floor Plan Header */}
      <View style={styles.floorPlanHeader}>
        <UtensilsCrossed color="#94a3b8" size={20} />
        <Text style={styles.floorPlanTitle}>Floor Plan</Text>
      </View>

      {/* Tables Grid */}
      {loading ? <ActivityIndicator size="large" color="#ff5722" style={{ marginTop: 20 }} /> : (
      <View style={styles.grid}>
        {filteredTables.map((table) => {
          const isOccupied = table.status && table.status.toLowerCase() === 'occupied';
          return (
          <View key={table.id} style={[styles.tableCard, { borderColor: isOccupied ? '#ff5722' : '#10b981' }]}>
            {/* Absolute Badge */}
            <View style={[styles.tableBadge, { backgroundColor: isOccupied ? '#ff5722' : '#10b981' }]}>
              <Text style={styles.tableBadgeText}>{table.table_number.replace('T-', '')}</Text>
            </View>

            <View style={styles.cardTopRow}>
              <Text style={styles.tableName}>Table {table.table_number.replace('T-', '')}</Text>
              <View style={styles.capacityInfo}>
                <Users color="#94a3b8" size={12} />
                <Text style={styles.capacityText}>{table.capacity || 4}</Text>
              </View>
            </View>

            <View style={styles.cardMiddleRow}>
              <View style={[styles.statusPill, { backgroundColor: isOccupied ? '#ff5722' : '#10b981' }]}>
                <Text style={styles.statusPillText}>{isOccupied ? 'OCCUPIED' : 'VACANT'}</Text>
              </View>
              <TouchableOpacity style={styles.qrBtn}>
                <QrCode color="#ff5722" size={14} />
                <Text style={styles.qrBtnText}>View QR</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dottedDivider} />

            <View style={styles.cardBottomRow}>
              <View style={styles.orderInfo}>
                <Clock color="#94a3b8" size={14} />
                <Text style={styles.orderText}>{table.current_order_id ? `#${table.current_order_id}` : 'No order'}</Text>
              </View>
              
              <View style={styles.cardActions}>
                {/* Custom Toggle Switch visually mocked */}
                <View style={[styles.toggleSwitch, { backgroundColor: table.is_active ? '#10b981' : '#9ca3af' }]}>
                  <View style={[styles.toggleKnob, { alignSelf: table.is_active ? 'flex-end' : 'flex-start' }]} />
                </View>
                <TouchableOpacity onPress={() => openModal(table)}>
                  <Edit2 color="#9ca3af" size={16} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(table.id)}>
                  <Trash2 color="#ef4444" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )})}
      </View>
      )}

      {/* Floating Add/Edit Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingTable ? 'Edit Table' : 'Add New Table'}</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}><X color="#94a3b8" size={20} /></TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Table Number/Name</Text>
                <TextInput style={styles.input} placeholder="e.g. T-01" value={formData.table_number} onChangeText={t => setFormData({...formData, table_number: t})} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Seating Capacity</Text>
                <TextInput style={styles.input} placeholder="4" keyboardType="numeric" value={formData.capacity?.toString()} onChangeText={t => setFormData({...formData, capacity: parseInt(t) || 0})} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Table Status</Text>
                <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowStatusDropdown(!showStatusDropdown)}>
                  <Text style={styles.dropdownText}>{formData.status}</Text>
                  <ChevronDown size={16} color="#64748b" />
                </TouchableOpacity>
                {showStatusDropdown && (
                  <View style={styles.dropdownList}>
                    {['Vacant', 'Occupied', 'Reserved'].map(s => (
                      <TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => { setFormData({...formData, status: s}); setShowStatusDropdown(false); }}>
                        <Text style={styles.dropdownItemText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {editingTable && editingTable.current_order_id && (
                  <Text style={[styles.helperText, { color: '#ff5722' }]}>Cannot change status. This table currently has an active order (#{editingTable.current_order_id}).</Text>
                )}
                <Text style={styles.helperText}>Tables with active orders will automatically appear as Occupied.</Text>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>QR Code Link / URL</Text>
                <TextInput style={styles.input} placeholder="https://example.com/menu/t1" value={formData.qr_url} onChangeText={t => setFormData({...formData, qr_url: t})} />
                <Text style={styles.helperText}>You can link an external menu or QR target URL here.</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}><Text style={styles.saveBtnText}>{editingTable ? 'Save Changes' : 'Create Table'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  liveFloorCard: {
    backgroundColor: '#ff5722',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#ff5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  liveFloorTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 15,
  },
  liveFloorMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  liveFloorPercent: {
    color: 'white',
    fontSize: 48,
    fontWeight: '900',
  },
  liveFloorSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: -5,
  },
  progressRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: 'white', // fake progress indicator
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff5722',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statBoxLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statBoxValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 50,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1e293b',
  },
  
  filterScroll: {
    marginBottom: 25,
    maxHeight: 45,
  },
  filterPill: {
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  filterPillActive: {
    backgroundColor: '#ff5722',
  },
  filterPillInactive: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: 'white',
  },
  filterTextInactive: {
    color: '#4b5563',
  },

  floorPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  floorPlanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
    rowGap: 25,
  },
  tableCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 15,
    paddingTop: 20, // space for badge
    position: 'relative',
    marginBottom: 5,
  },
  tableBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 2,
  },
  tableBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  capacityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacityText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qrBtnText: {
    color: '#ff5722',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dottedDivider: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderStyle: 'dashed',
    marginBottom: 15,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleSwitch: {
    width: 32,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'white',
    alignSelf: 'flex-end',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: 'white', width: '100%', maxWidth: 450, borderRadius: 24, padding: 24, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  modalScroll: { maxHeight: 400 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#0f172a' },
  helperText: { color: '#94a3b8', fontSize: 11, marginTop: 6 },
  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  dropdownText: { fontSize: 14, color: '#0f172a' },
  dropdownList: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginTop: 4, elevation: 5 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemText: { fontSize: 14, color: '#0f172a' },
  modalFooter: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', flex: 1, alignItems: 'center' },
  cancelBtnText: { color: '#0f172a', fontSize: 14, fontWeight: 'bold' },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24, backgroundColor: '#ff5722', flex: 1, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 14, fontWeight: 'bold' }
});
