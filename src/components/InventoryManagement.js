import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, FlatList, Alert, TextInput, Modal } from 'react-native';
import { inventoryService } from '../services/api';
import { Plus, Package, TrendingDown, CheckCircle2, Edit2, Trash2, Search } from 'lucide-react-native';

export default function InventoryManagement() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', open_stock: '0', purchase: '0', issue: '0', unit: 'units' });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const data = await inventoryService.getInventory();
      setInventory(data || []);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleDelete = (id) => {
    Alert.alert("Confirm", "Delete this item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await inventoryService.deleteItem(id);
          fetchInventory();
        } catch(e) { Alert.alert("Error", "Could not delete item"); }
      }}
    ]);
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    setFormData(item ? {
      name: item.name,
      open_stock: item.open_stock.toString(),
      purchase: item.purchase.toString(),
      issue: item.issue.toString(),
      unit: item.unit || 'units'
    } : { name: '', open_stock: '0', purchase: '0', issue: '0', unit: 'units' });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        open_stock: parseFloat(formData.open_stock) || 0,
        purchase: parseFloat(formData.purchase) || 0,
        issue: parseFloat(formData.issue) || 0,
        unit: formData.unit,
        total: (parseFloat(formData.open_stock) || 0) + (parseFloat(formData.purchase) || 0),
        balance: ((parseFloat(formData.open_stock) || 0) + (parseFloat(formData.purchase) || 0)) - (parseFloat(formData.issue) || 0)
      };

      if (editingItem) await inventoryService.updateInventory(editingItem.id, payload);
      else await inventoryService.createItem(payload);
      
      setIsModalOpen(false);
      fetchInventory();
    } catch(e) { Alert.alert("Error", "Failed to save item"); }
  };

  const filteredInventory = inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const lowStockItems = inventory.filter(i => i.balance < 5);
  const inStockItems = inventory.filter(i => i.balance >= 5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}><Plus color="white" size={20} /></TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statBox}>
          <Package color="gray" size={24} /><Text style={styles.statValue}>{inventory.length}</Text><Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <TrendingDown color="#ff4d4d" size={24} /><Text style={[styles.statValue, {color: '#ff4d4d'}]}>{lowStockItems.length}</Text><Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View style={styles.statBox}>
          <CheckCircle2 color="#16a34a" size={24} /><Text style={[styles.statValue, {color: '#16a34a'}]}>{inStockItems.length}</Text><Text style={styles.statLabel}>In Stock</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search color="gray" size={20} />
        <TextInput style={styles.searchInput} placeholder="Search inventory..." value={searchTerm} onChangeText={setSearchTerm} />
      </View>

      {loading ? <Text>Loading...</Text> : (
        <FlatList
          data={filteredInventory}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => {
            const isLow = item.balance < 5;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                    <View style={[styles.iconBox, {backgroundColor: isLow ? '#fff0f0' : '#f0fdf4'}]}>
                      <Package color={isLow ? '#ff4d4d' : '#16a34a'} size={16} />
                    </View>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => openModal(item)}><Edit2 size={16} color="gray" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={16} color="red" /></TouchableOpacity>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoCol}><Text style={styles.infoLabel}>Open</Text><Text style={styles.infoVal}>{item.open_stock}</Text></View>
                  <View style={styles.infoCol}><Text style={styles.infoLabel}>Purch</Text><Text style={styles.infoVal}>{item.purchase}</Text></View>
                  <View style={styles.infoCol}><Text style={styles.infoLabel}>Issue</Text><Text style={[styles.infoVal, {color: '#ff4d4d'}]}>{item.issue}</Text></View>
                  <View style={styles.infoCol}><Text style={styles.infoLabel}>Bal</Text><Text style={[styles.infoVal, {fontWeight:'bold', color: isLow ? '#ff4d4d' : 'black'}]}>{item.balance} {item.unit}</Text></View>
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Item'}</Text>
            <ScrollView>
              <TextInput style={styles.input} placeholder="Item Name" value={formData.name} onChangeText={t => setFormData({...formData, name: t})} />
              <View style={{flexDirection:'row', gap:10}}>
                <TextInput style={[styles.input, {flex:1}]} placeholder="Open Stock" keyboardType="numeric" value={formData.open_stock} onChangeText={t => setFormData({...formData, open_stock: t})} />
                <TextInput style={[styles.input, {flex:1}]} placeholder="Purchase" keyboardType="numeric" value={formData.purchase} onChangeText={t => setFormData({...formData, purchase: t})} />
              </View>
              <View style={{flexDirection:'row', gap:10}}>
                <TextInput style={[styles.input, {flex:1}]} placeholder="Issue" keyboardType="numeric" value={formData.issue} onChangeText={t => setFormData({...formData, issue: t})} />
                <TextInput style={[styles.input, {flex:1}]} placeholder="Unit (e.g. kg)" value={formData.unit} onChangeText={t => setFormData({...formData, unit: t})} />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={{color: 'white'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#f5620c', padding: 10, borderRadius: 20 },
  statsCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 1 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', marginVertical: 5 },
  statLabel: { color: 'gray', fontSize: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 10, borderRadius: 20, marginBottom: 15 },
  searchInput: { flex: 1, marginLeft: 10 },
  card: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#eee', paddingTop: 15 },
  infoCol: { alignItems: 'center' },
  infoLabel: { fontSize: 11, color: 'gray', marginBottom: 5 },
  infoVal: { fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 10 },
  saveBtn: { padding: 10, backgroundColor: '#f5620c', borderRadius: 5 }
});
