import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, StyleSheet, Alert, Dimensions, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { menuService } from '../services/api';
import api from '../services/api';
import { LogOut, Trash2 } from 'lucide-react-native';
import InvoiceModal from '../components/cashier/InvoiceModal';
import FutureSaleModal from '../components/cashier/FutureSaleModal';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');
const isTablet = width > 600;

export default function CashierDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');
  const [productCodeInput, setProductCodeInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  
  const [billNo, setBillNo] = useState(101);
  const [lastBillNo, setLastBillNo] = useState(0);
  const [lastBillAmt, setLastBillAmt] = useState(0);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showFutureSaleModal, setShowFutureSaleModal] = useState(false);
  
  const [orderType, setOrderType] = useState('take-away');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [futureSale, setFutureSale] = useState({ name: '', address: '', city: '', phone: '', deliveryDate: '' });

  const [lastOrderType, setLastOrderType] = useState('take-away');
  const [lastFutureSale, setLastFutureSale] = useState(null);
  const [lastPaymentMethod, setLastPaymentMethod] = useState('');
  const [lastCart, setLastCart] = useState([]);

  useEffect(() => {
    if (!user || !user.restaurant_id) return;
    menuService.getItems({ restaurant_id: user.restaurant_id })
      .then(data => Array.isArray(data) && setMenuItems(data))
      .catch(err => console.error(err));

    menuService.getCategories({ restaurant_id: user.restaurant_id })
      .then(data => {
        if (Array.isArray(data)) {
          const unique = data.reduce((acc, current) => {
            if (!acc.find(item => item.name === current.name)) acc.push(current);
            return acc;
          }, []);
          setCategories(unique);
        }
      })
      .catch(err => console.error(err));
  }, [user]);

  const addItemToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1, amount: (c.qty + 1) * c.rate } : c);
      }
      return [...prev, {
        id: item.id,
        product_code: item.item_code || item.id,
        description: item.name || 'Unknown',
        rate: item.price || 0,
        qty: 1,
        amount: item.price || 0
      }];
    });
  };

  const addProductToCart = () => {
    const code = productCodeInput.trim().toLowerCase();
    if (code) {
      const item = menuItems.find(i => String(i.item_code).toLowerCase() === code);
      if (item) {
        addItemToCart(item);
        setProductCodeInput('');
      } else {
        Alert.alert("Not Found", "Item code not found");
      }
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const totalAmt = cart.reduce((sum, item) => sum + item.amount, 0);

    const payload = {
      table_number: orderType === 'take-away' ? 'takeaway' : '1',
      payment_method: paymentMethod,
      cart: cart.map(c => ({ id: c.id, quantity: c.qty, price: c.rate })),
      subtotal: totalAmt,
      gst: 0,
      service_charge: 0,
      total_amount: totalAmt
    };

    api.post(`/api/v1/orders?restaurant_id=${user?.restaurant_id}`, payload)
      .then(res => Alert.alert("Success", "Order placed successfully"))
      .catch(err => Alert.alert("Error", "Failed to place order"));

    setLastBillNo(billNo);
    setLastBillAmt(totalAmt);
    setBillNo(prev => prev + 1);
    setLastCart([...cart]);
    setCart([]);
    setLastOrderType(orderType);
    setLastPaymentMethod(paymentMethod);
    setLastFutureSale({ ...futureSale });
    setFutureSale({ name: '', address: '', city: '', phone: '', deliveryDate: '' });
    setShowInvoice(true);
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const filteredItems = menuItems.filter(item => {
    if (selectedCategoryId !== 'All' && item.category_id !== selectedCategoryId) return false;
    const search = descriptionInput.trim().toLowerCase();
    if (search) {
      const matchName = item.name && item.name.toLowerCase().includes(search);
      const matchCode = item.item_code && String(item.item_code).toLowerCase().includes(search);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  const totalAmount = cart.reduce((sum, item) => sum + item.amount, 0);

  const updateQty = (id, delta) => {
    setCart(prev => {
      const newCart = prev.map(c => c.id === id ? { ...c, qty: c.qty + delta, amount: (c.qty + delta) * c.rate } : c);
      return newCart.filter(c => c.qty > 0);
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.duBadge}><Text style={styles.duBadgeText}>DU</Text></View>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Data Udipi Restaurant</Text>
          <Text style={styles.headerSubtitle}>Counter POS-Cashier</Text>
        </View>
        <View style={styles.headerCenter}>
           <Text style={styles.headerDate}>{new Date().toLocaleDateString()} · Items in cart: {cart.reduce((s, c) => s + c.qty, 0)}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.mainLayout, { flexDirection: isTablet ? 'row' : 'column' }]}>
        {/* Left Panel */}
        <View style={[styles.leftPanel, { flex: isTablet ? 3 : 1 }]}>
          <View style={styles.controlsRow}>
            <View style={styles.pickerContainer}>
              {Platform.OS === 'web' ? (
                <select 
                  value={orderType} 
                  onChange={(e) => setOrderType(e.target.value)} 
                  style={{ height: '100%', width: '100%', border: 'none', backgroundColor: 'transparent', outline: 'none', padding: '0 10px', fontSize: 14, color: '#111827', cursor: 'pointer', appearance: 'auto' }}
                >
                  <option value="take-away">[7] Take Away</option>
                  <option value="dine-in">[1] Dine In</option>
                </select>
              ) : (
                <Picker selectedValue={orderType} onValueChange={(val) => setOrderType(val)} style={{ height: 40, borderWidth: 0 }}>
                  <Picker.Item label="[7] Take Away" value="take-away" />
                  <Picker.Item label="[1] Dine In" value="dine-in" />
                </Picker>
              )}
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter item code (e.g. C01)"
              value={productCodeInput}
              onChangeText={setProductCodeInput}
              onSubmitEditing={addProductToCart}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search item..."
              value={descriptionInput}
              onChangeText={setDescriptionInput}
            />
          </View>

          <View style={{height: 50}}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{alignItems: 'center'}}>
              <TouchableOpacity style={[styles.catBtn, selectedCategoryId === 'All' && styles.catBtnActive]} onPress={() => setSelectedCategoryId('All')}>
                <Text style={selectedCategoryId === 'All' ? styles.catTextActive : styles.catText}>All</Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity key={cat.id} style={[styles.catBtn, selectedCategoryId === cat.id && styles.catBtnActive]} onPress={() => setSelectedCategoryId(cat.id)}>
                  <Text style={selectedCategoryId === cat.id ? styles.catTextActive : styles.catText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredItems}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemPriceCol}>
                  <Text style={styles.itemPrice}>₹{(item.price || 0).toFixed(2)}</Text>
                  <TouchableOpacity style={styles.addBtn} onPress={() => addItemToCart(item)}>
                     <Text style={styles.addBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>

        {/* Right Panel (Cart) */}
        <View style={[styles.rightPanel, { flex: isTablet ? 2 : undefined }]}>
          <View style={styles.cartHeader}>
            <View>
              <Text style={styles.cartTitle}>Current order</Text>
              <Text style={styles.cartSubtitle}>{cart.length} lines - {cart.reduce((s,c) => s+c.qty, 0)} items</Text>
            </View>
            <TouchableOpacity onPress={() => setCart([])}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {cart.length > 0 && (
             <FlatList
                data={cart}
                keyExtractor={item => item.id.toString()}
                showsVerticalScrollIndicator={false}
                style={{maxHeight: isTablet ? 'auto' : 150}}
                renderItem={({ item }) => (
                  <View style={styles.cartItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartItemName}>{item.description}</Text>
                      <Text style={styles.cartItemRate}>₹{item.rate.toFixed(2)}</Text>
                    </View>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}><Text>-</Text></TouchableOpacity>
                      <Text style={styles.qtyText}>{item.qty}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 1)}><Text>+</Text></TouchableOpacity>
                    </View>
                    <Text style={styles.cartItemTotal}>₹{item.amount.toFixed(2)}</Text>
                  </View>
                )}
             />
          )}

          <View style={styles.cartFooter}>
            <TouchableOpacity style={styles.futureSaleBtn} onPress={() => setShowFutureSaleModal(true)}>
              <Text style={styles.futureSaleText}>+ Future Sale</Text>
            </TouchableOpacity>
            <View style={styles.summaryRow}>
              <Text style={styles.subtotalText}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.chargeBtn} onPress={handleCheckout}>
              <Text style={styles.chargeBtnText}>Charge ₹{totalAmount.toFixed(2)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <InvoiceModal
        show={showInvoice} setShow={setShowInvoice}
        lastBillNo={lastBillNo} lastOrderType={lastOrderType} lastPaymentMethod={lastPaymentMethod}
        lastFutureSale={lastFutureSale} lastCart={lastCart} lastBillAmt={lastBillAmt}
      />
      <FutureSaleModal show={showFutureSaleModal} setShow={setShowFutureSaleModal} futureSale={futureSale} setFutureSale={setFutureSale} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', height: Platform.OS === 'web' ? Dimensions.get('window').height : '100%', maxHeight: Platform.OS === 'web' ? Dimensions.get('window').height : '100%', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  duBadge: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  duBadgeText: { color: '#6b7280', fontWeight: 'bold', fontSize: 16 },
  headerLeft: { flex: 1, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { color: '#6b7280', fontSize: 13 },
  headerCenter: { marginRight: 20 },
  headerDate: { color: '#6b7280', fontSize: 13 },
  logoutBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  
  mainLayout: { flex: 1 },
  leftPanel: { flex: 1, padding: 15 },
  controlsRow: { flexDirection: isTablet ? 'row' : 'column', gap: 15, marginBottom: 20 },
  pickerContainer: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, justifyContent: 'center', backgroundColor: '#fff', overflow: 'hidden' },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, backgroundColor: '#fff', fontSize: 14 },
  
  categoryScroll: { maxHeight: 50 },
  catBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', marginRight: 10 },
  catBtnActive: { backgroundColor: '#fff', borderColor: '#d1d5db', borderWidth: 1.5 },
  catText: { color: '#111827', fontSize: 14, fontWeight: '500' },
  catTextActive: { color: '#111827', fontWeight: 'bold', fontSize: 14 },
  
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 10 },
  itemName: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#111827' },
  itemPriceCol: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  itemPrice: { color: '#6b7280', fontSize: 15 },
  addBtn: { borderWidth: 1, borderColor: '#e5e7eb', width: 32, height: 32, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#111827', fontSize: 18, fontWeight: '300' },
  
  rightPanel: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e5e7eb', padding: 20 },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 15, marginBottom: 15 },
  cartTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  cartSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  clearText: { color: '#4b5563', fontSize: 14 },
  
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  cartItemName: { fontWeight: 'bold', color: '#111827' },
  cartItemRate: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  qtyBtn: { backgroundColor: '#f3f4f6', width: 28, height: 28, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  qtyText: { marginHorizontal: 12, fontWeight: 'bold' },
  cartItemTotal: { width: 70, textAlign: 'right', fontWeight: 'bold', color: '#111827' },
  
  cartFooter: { paddingTop: 10 },
  futureSaleBtn: { backgroundColor: '#e5e7eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  futureSaleText: { color: '#1f2937', fontWeight: 'bold', fontSize: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  subtotalText: { fontSize: 14, color: '#6b7280' },
  totalText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  chargeBtn: { backgroundColor: '#1f2937', paddingVertical: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  chargeBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
