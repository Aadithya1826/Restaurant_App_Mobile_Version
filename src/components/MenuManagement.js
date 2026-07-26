import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, Alert, FlatList, Image, Switch, Dimensions } from 'react-native';
import { menuService, rewriteImageUrl } from '../services/api';
import { Plus, Edit2, Trash2, Search, Star, Minus } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 55) / 2; // 2 columns with padding and gap

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', category_id: '', price: '', description: '', quantity: '0', image_url: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [itemsData, categoriesData] = await Promise.all([
        menuService.getItems().catch(() => []),
        menuService.getCategories().catch(() => [])
      ]);
      setItems(itemsData);
      setCategories(categoriesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailable = async (item) => {
    try {
      const updated = await menuService.updateItem(item.id, { is_available: !item.is_available });
      setItems(items.map(i => i.id === item.id ? updated : i));
    } catch (e) { Alert.alert("Error", "Failed to update availability"); }
  };

  const handleUpdateQuantity = async (item, delta) => {
    const newQuantity = Math.max(0, (item.quantity || 0) + delta);
    try {
      const updated = await menuService.updateItem(item.id, { quantity: newQuantity });
      setItems(items.map(i => i.id === item.id ? updated : i));
    } catch (e) {
      // Optomistic UI fallback or just alert
      setItems(items.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i));
    }
  };

  const handleSaveItem = async () => {
    if (!newItem.name || !newItem.category_id || !newItem.price) {
      return Alert.alert("Error", "Please fill required fields");
    }
    try {
      if (editingItem) {
        const updated = await menuService.updateItem(editingItem.id, { ...newItem, category_id: parseInt(newItem.category_id), price: parseFloat(newItem.price), quantity: parseInt(newItem.quantity) });
        setItems(items.map(i => i.id === editingItem.id ? updated : i));
      } else {
        const created = await menuService.createItem({ ...newItem, category_id: parseInt(newItem.category_id), price: parseFloat(newItem.price), quantity: parseInt(newItem.quantity) });
        setItems([...items, created]);
      }
      setIsModalOpen(false);
    } catch (e) {
      Alert.alert("Error", "Failed to save menu item");
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await menuService.deleteItem(id);
          setItems(items.filter(i => i.id !== id));
        } catch (e) { Alert.alert("Error", "Failed to delete item"); }
      }}
    ]);
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    setNewItem(item ? { ...item, quantity: item.quantity?.toString() || '0' } : { name: '', category_id: '', price: '', description: '', quantity: '0', image_url: '' });
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category_id === categories.find(c => c.name === activeCategory)?.id;
    return matchesSearch && matchesCategory;
  });

  const activeCount = items.filter(i => i.is_available).length;
  
  // Custom dummy image generator based on name
  const getDummyImage = (name) => {
    if (name.toLowerCase().includes('biryani')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=300&auto=format&fit=crop';
    if (name.toLowerCase().includes('idly')) return 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?q=80&w=300&auto=format&fit=crop';
    if (name.toLowerCase().includes('nan') || name.toLowerCase().includes('bread')) return 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?q=80&w=300&auto=format&fit=crop';
    if (name.toLowerCase().includes('gobi')) return 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=300&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop'; // Default salad/bowl
  };

  return (
    <View style={styles.container}>
      {/* Header inside the container to overlap with Dashboard's header background slightly */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Menu Management</Text>
          <Text style={styles.subtitle}>{items.length} items • {activeCount} available</Text>
        </View>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>• {activeCount} active</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color="#9ca3af" size={20} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search menu item" 
            placeholderTextColor="#9ca3af"
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
        </View>
        {/* We can place the Add Button here or somewhere else. Let's make it a FAB or just next to search */}
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
          <Plus color="white" size={20} />
        </TouchableOpacity>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingRight: 20 }}>
          <TouchableOpacity 
            style={[styles.catBtn, activeCategory === 'All' ? styles.activeCatBtn : styles.inactiveCatBtn]} 
            onPress={() => setActiveCategory('All')}
          >
            <Text style={[styles.catText, activeCategory === 'All' && styles.activeCatText]}>All</Text>
          </TouchableOpacity>
          {categories.map(c => (
            <TouchableOpacity 
              key={c.id} 
              style={[styles.catBtn, activeCategory === c.name ? styles.activeCatBtn : styles.inactiveCatBtn]} 
              onPress={() => setActiveCategory(c.name)}
            >
              <Text style={[styles.catText, activeCategory === c.name && styles.activeCatText]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? <Text style={{ padding: 20 }}>Loading...</Text> : (
        <FlatList
          style={{ flex: 1 }}
          data={filteredItems}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 15 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: item.image_url ? rewriteImageUrl(item.image_url) : getDummyImage(item.name) }} 
                  style={styles.itemImage} 
                />
                <View style={styles.ratingBadge}>
                  <Star color="#fbbf24" size={12} fill="#fbbf24" />
                  <Text style={styles.ratingText}>4.8</Text>
                </View>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>₹{item.price}</Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.idBadge}>
                  <Text style={styles.idText}>ID: {item.id}</Text>
                </View>
                
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>{item.description || 'Crispy golden crepe filled with spiced potato...'}</Text>
                
                <View style={styles.actionsRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Switch
                      trackColor={{ false: '#d1d5db', true: '#10b981' }}
                      thumbColor={'#ffffff'}
                      ios_backgroundColor="#d1d5db"
                      onValueChange={() => handleToggleAvailable(item)}
                      value={item.is_available}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: item.is_available ? '#10b981' : '#6b7280' }}>Avail</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => openModal(item)}><Edit2 color="#6b7280" size={16} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 color="#ef4444" size={16} /></TouchableOpacity>
                  </View>
                </View>

                <View style={styles.qtyContainer}>
                  <Text style={styles.qtyLabel}>Qty:</Text>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQuantity(item, -1)}>
                      <Minus color="#4b5563" size={14} />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.quantity || 0}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQuantity(item, 1)}>
                      <Plus color="#4b5563" size={14} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal for Add/Edit (kept mostly original functional styles but slightly modernized) */}
      {/* Floating Add/Edit Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBg}>
                <Edit2 color="white" size={20} />
              </View>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</Text>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {editingItem && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>ITEM ID (OPTIONAL)</Text>
                  <TextInput style={styles.input} value={editingItem.id.toString()} editable={false} />
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>ITEM NAME</Text>
                <TextInput style={styles.input} placeholder="e.g. Masala Dosa" value={newItem.name} onChangeText={t => setNewItem({...newItem, name: t})} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>CATEGORY</Text>
                <TextInput style={styles.input} placeholder="Category ID" keyboardType="numeric" value={newItem.category_id.toString()} onChangeText={t => setNewItem({...newItem, category_id: t})} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>PRICE</Text>
                <TextInput style={styles.input} placeholder="INR (₹) 0.00" keyboardType="numeric" value={newItem.price.toString()} onChangeText={t => setNewItem({...newItem, price: t})} />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>AVAILABLE QUANTITY</Text>
                <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={newItem.quantity?.toString()} onChangeText={t => setNewItem({...newItem, quantity: t})} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>DESCRIPTION</Text>
                <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline placeholder="Crispy golden crepe..." value={newItem.description} onChangeText={t => setNewItem({...newItem, description: t})} />
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={[styles.label, { marginBottom: 0 }]}>IMAGE URL (OPTIONAL)</Text>
                  {newItem.image_url ? (
                    <TouchableOpacity onPress={() => setNewItem({...newItem, image_url: ''})}>
                      <Text style={styles.removeImageText}>Remove Image</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="/static/images/..." value={newItem.image_url} onChangeText={t => setNewItem({...newItem, image_url: t})} />
                  <TouchableOpacity style={styles.uploadBtn}><Text style={styles.uploadBtnText}>Upload Image</Text></TouchableOpacity>
                </View>
                {newItem.image_url ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: rewriteImageUrl(newItem.image_url) }} style={styles.imagePreview} resizeMode="cover" />
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSaveItem} style={styles.saveBtn}><Text style={styles.saveBtnText}>Save Changes</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#ff5722', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  activePillText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  searchBar: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    paddingHorizontal: 15, 
    height: 50,
    borderRadius: 25, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1e293b' },
  addBtn: {
    backgroundColor: '#ff5722',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },

  categoryScroll: { marginBottom: 20, maxHeight: 40 },
  catBtn: { 
    paddingHorizontal: 20, 
    height: 40,
    justifyContent: 'center',
    borderRadius: 20, 
    marginRight: 10,
    borderWidth: 1,
  },
  activeCatBtn: { backgroundColor: '#ff5722', borderColor: '#ff5722' },
  inactiveCatBtn: { backgroundColor: 'white', borderColor: '#e5e7eb' },
  catText: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  activeCatText: { color: 'white' },
  
  card: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    width: cardWidth,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    overflow: 'hidden', // to clip the image border radius if needed
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    width: '100%',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  cardContent: { padding: 12 },
  idBadge: {
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  idText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemName: { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  itemDesc: { color: '#94a3b8', fontSize: 10, marginBottom: 12, lineHeight: 14 },
  
  actionsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  
  qtyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  qtyLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginLeft: 4,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qtyBtn: {
    padding: 6,
    paddingHorizontal: 8,
  },
  qtyValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    width: 20,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: 'white', width: '100%', maxWidth: 450, borderRadius: 24, padding: 24, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  modalIconBg: { backgroundColor: '#ff5722', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  modalScroll: { maxHeight: 400 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#0f172a' },
  uploadBtn: { backgroundColor: '#f8fafc', paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  uploadBtnText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  removeImageText: { color: '#ef4444', fontSize: 11, fontWeight: 'bold' },
  imagePreviewContainer: { marginTop: 12, height: 120, width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#f1f5f9' },
  imagePreview: { width: '100%', height: '100%' },
  modalFooter: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', flex: 1, alignItems: 'center' },
  cancelBtnText: { color: '#0f172a', fontSize: 14, fontWeight: 'bold' },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24, backgroundColor: '#ff5722', flex: 1, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 14, fontWeight: 'bold' }
});
