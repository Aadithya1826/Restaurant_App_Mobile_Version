import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { menuService, recipeService, reportsService } from '../services/api';
import { FileText, BookOpen, Calendar, Plus, Trash2, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Save } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

export default function ConsumptionReports() {
  const [activeTab, setActiveTab] = useState('tally'); // 'tally' or 'recipes'
  
  // Tally state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  
  // Recipe state
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (activeTab === 'tally') fetchConsumptionReport();
  }, [selectedDate, activeTab]);

  useEffect(() => {
    if (activeTab === 'recipes' && selectedMenuItem) fetchRecipeForMenu();
    else setRecipeIngredients([]);
  }, [selectedMenuItem, activeTab]);

  const fetchMenuItems = async () => {
    try {
      const data = await menuService.getItems();
      setMenuItems(data || []);
    } catch (err) { console.error('Failed to fetch menu items', err); }
  };

  const fetchConsumptionReport = async () => {
    try {
      setLoadingReport(true);
      const data = await reportsService.getConsumptionReport(selectedDate);
      setReportData(data);
    } catch (err) {
      console.error('Failed to fetch consumption report', err);
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchRecipeForMenu = async () => {
    try {
      setLoadingRecipes(true);
      const data = await recipeService.getRecipes(selectedMenuItem);
      setRecipeIngredients(data || []);
    } catch (err) { console.error('Failed to fetch recipes', err); } 
    finally { setLoadingRecipes(false); }
  };

  const handleAddIngredientRow = () => {
    setRecipeIngredients([...recipeIngredients, { inventory_item_name: '', quantity: 0, unit: 'g' }]);
  };

  const handleRemoveIngredientRow = (index) => {
    const newIngredients = [...recipeIngredients];
    newIngredients.splice(index, 1);
    setRecipeIngredients(newIngredients);
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...recipeIngredients];
    newIngredients[index][field] = value;
    setRecipeIngredients(newIngredients);
  };

  const handleSaveRecipe = async () => {
    if (!selectedMenuItem) return;
    const validIngredients = recipeIngredients.filter(ing => ing.inventory_item_name.trim() !== '' && ing.quantity > 0);
    try {
      setSavingRecipe(true);
      await recipeService.updateRecipe({
        menu_item_id: parseInt(selectedMenuItem),
        ingredients: validIngredients
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchRecipeForMenu();
    } catch (err) { console.error('Failed to save recipe', err); alert('Failed to save recipe'); } 
    finally { setSavingRecipe(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Consumption Reports</Text>
        <Text style={styles.subtitle}>Compare theoretical vs actual ingredient usage.</Text>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'tally' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('tally')}
          >
            <FileText color={activeTab === 'tally' ? 'white' : '#334155'} size={16} />
            <Text style={[styles.tabText, activeTab === 'tally' && styles.tabTextActive]}>Daily Tally</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'recipes' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('recipes')}
          >
            <BookOpen color={activeTab === 'recipes' ? 'white' : '#334155'} size={16} />
            <Text style={[styles.tabText, activeTab === 'recipes' && styles.tabTextActive]}>Manage Recipes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'tally' && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Calendar color="#ff6b35" size={20} />
              <Text style={styles.cardTitle}>Daily Inventory Tally</Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={styles.dateLabel}>Report Date:</Text>
              <TextInput 
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                style={styles.dateInput}
              />
            </View>
          </View>

          {loadingReport ? (
            <ActivityIndicator size="large" color="#ff6b35" style={{ marginVertical: 40 }} />
          ) : reportData ? (
            <View>
              <View style={styles.salesSummaryBox}>
                <Text style={styles.salesSummaryTitle}>Items Sold on {selectedDate}</Text>
                <View style={styles.salesChipsContainer}>
                  {reportData.items_sold.length > 0 ? reportData.items_sold.map(item => (
                    <View key={item.id} style={styles.saleChip}>
                      <Text style={styles.saleChipText}>{item.name}: </Text>
                      <Text style={styles.saleChipValue}>{item.quantity}</Text>
                    </View>
                  )) : (
                    <Text style={{ color: '#64748b' }}>No sales data for this date.</Text>
                  )}
                </View>
              </View>

              <View style={{ marginTop: 16 }}>
                {reportData.tally.length > 0 ? reportData.tally.map((row, idx) => (
                  <View key={idx} style={styles.mobileTableRow}>
                    <Text style={styles.mobileRowTitle}>{row.ingredient_name}</Text>
                    
                    <View style={styles.mobileRowDetail}>
                      <Text style={styles.mobileRowLabel}>Theoretical (POS):</Text>
                      <Text style={styles.mobileRowValue}>{row.theoretical_consumption.toFixed(2)} {row.unit}</Text>
                    </View>
                    <View style={styles.mobileRowDetail}>
                      <Text style={styles.mobileRowLabel}>Actual (Inv):</Text>
                      <Text style={styles.mobileRowValue}>{row.actual_consumption.toFixed(2)} {row.unit}</Text>
                    </View>
                    <View style={styles.mobileRowDetail}>
                      <Text style={styles.mobileRowLabel}>Variance:</Text>
                      <Text style={[styles.mobileRowValue, { fontWeight: 'bold', color: row.variance === 0 ? '#10b981' : row.variance > 0 ? '#f59e0b' : '#ef4444' }]}>
                        {row.variance > 0 ? '+' : ''}{row.variance.toFixed(2)} {row.unit}
                      </Text>
                    </View>
                    
                    <View style={{ marginTop: 12 }}>
                      {row.variance === 0 ? (
                        <View style={styles.statusPillGreen}><CheckCircle2 size={14} color="#10b981" /><Text style={styles.statusTextGreen}>Perfect Match</Text></View>
                      ) : Math.abs(row.variance) <= (row.theoretical_consumption * 0.1) ? (
                        <View style={styles.statusPillYellow}><TrendingUp size={14} color="#f59e0b" /><Text style={styles.statusTextYellow}>Acceptable</Text></View>
                      ) : (
                        <View style={styles.statusPillRed}><AlertTriangle size={14} color="#ef4444" /><Text style={styles.statusTextRed}>High Variance</Text></View>
                      )}
                    </View>
                  </View>
                )) : (
                  <Text style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>No consumption data to display for this date.</Text>
                )}
              </View>
            </View>
          ) : (
             <Text style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Failed to load report data.</Text>
          )}
        </View>
      )}

      {activeTab === 'recipes' && (
        <View style={styles.card}>
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <BookOpen color="#ff6b35" size={20} />
              <Text style={styles.cardTitle}>Recipe Formula Editor</Text>
            </View>
            <Text style={styles.subtitle}>Map menu items to their raw inventory ingredients.</Text>
          </View>

          <View style={{ marginBottom: 24, zIndex: 10 }}>
            <Text style={styles.label}>Select Menu Item to Edit:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedMenuItem}
                onValueChange={(val) => setSelectedMenuItem(val)}
                style={{ height: 50, width: '100%' }}
              >
                <Picker.Item label="-- Select Menu Item --" value="" />
                {menuItems.map(item => (
                  <Picker.Item key={item.id} label={item.name} value={item.id} />
                ))}
              </Picker>
            </View>
          </View>

          {selectedMenuItem ? (
            <View>
              {loadingRecipes ? (
                <ActivityIndicator size="small" color="#ff6b35" style={{ marginVertical: 20 }} />
              ) : (
                <View>
                  {recipeIngredients.map((ing, idx) => (
                    <View key={idx} style={styles.mobileRecipeCard}>
                      <View style={styles.recipeRowHeader}>
                        <Text style={styles.recipeRowLabel}>Ingredient {idx + 1}</Text>
                        <TouchableOpacity onPress={() => handleRemoveIngredientRow(idx)} style={styles.deleteBtn}>
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={{ marginBottom: 12 }}>
                        <Text style={styles.label}>Inventory Item Name</Text>
                        <TextInput 
                          style={styles.input}
                          value={ing.inventory_item_name}
                          onChangeText={(val) => handleIngredientChange(idx, 'inventory_item_name', val)}
                          placeholder="e.g. Dosai Rice"
                        />
                      </View>
                      
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.label}>Quantity/Order</Text>
                          <TextInput 
                            style={styles.input}
                            value={ing.quantity.toString()}
                            onChangeText={(val) => handleIngredientChange(idx, 'quantity', parseFloat(val) || 0)}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.label}>Unit</Text>
                          <View style={styles.pickerWrapperUnit}>
                            <Picker
                              selectedValue={ing.unit}
                              onValueChange={(val) => handleIngredientChange(idx, 'unit', val)}
                              style={{ height: 45 }}
                            >
                              <Picker.Item label="g" value="g" />
                              <Picker.Item label="kg" value="kg" />
                              <Picker.Item label="ml" value="ml" />
                              <Picker.Item label="L" value="L" />
                              <Picker.Item label="units" value="units" />
                            </Picker>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                  
                  {recipeIngredients.length === 0 && (
                    <Text style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No ingredients mapped yet. Add your first ingredient below!</Text>
                  )}
                </View>
              )}

              <View style={styles.recipeFooter}>
                <TouchableOpacity style={styles.addIngBtn} onPress={handleAddIngredientRow}>
                  <Plus size={16} color="#ff6b35" />
                  <Text style={styles.addIngText}>Add Ingredient</Text>
                </TouchableOpacity>

                <View style={{ alignItems: 'center', marginTop: 16 }}>
                  {saveSuccess && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                      <CheckCircle2 size={16} color="#10b981" />
                      <Text style={{ color: '#10b981', fontWeight: '500' }}>Saved Successfully!</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.saveRecipeBtn} onPress={handleSaveRecipe} disabled={savingRecipe}>
                    {savingRecipe ? <ActivityIndicator size="small" color="white" /> : <Save size={16} color="white" />}
                    <Text style={styles.saveRecipeText}>Save Recipe</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 60 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 },
  subtitle: { color: '#64748b', fontSize: 14, marginBottom: 16 },
  
  tabContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabBtnActive: { backgroundColor: '#ff6b35', borderColor: '#ff6b35' },
  tabText: { color: '#334155', fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: 'white' },
  
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  cardHeaderRow: { marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  dateLabel: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  dateInput: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', fontSize: 14 },
  
  salesSummaryBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 16 },
  salesSummaryTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 12 },
  salesChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  saleChip: { backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row' },
  saleChipText: { fontSize: 12, fontWeight: '500', color: '#0f172a' },
  saleChipValue: { fontSize: 12, fontWeight: 'bold', color: '#ff6b35' },
  
  mobileTableRow: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, marginBottom: 12 },
  mobileRowTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  mobileRowDetail: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  mobileRowLabel: { fontSize: 13, color: '#64748b' },
  mobileRowValue: { fontSize: 13, color: '#0f172a', fontWeight: '500' },
  
  statusPillGreen: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, alignSelf: 'flex-start' },
  statusTextGreen: { color: '#10b981', fontSize: 12, fontWeight: '600' },
  statusPillYellow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, alignSelf: 'flex-start' },
  statusTextYellow: { color: '#f59e0b', fontSize: 12, fontWeight: '600' },
  statusPillRed: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, alignSelf: 'flex-start' },
  statusTextRed: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  pickerWrapper: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, backgroundColor: 'white', overflow: 'hidden' },
  pickerWrapperUnit: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, backgroundColor: 'white', overflow: 'hidden' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  deleteBtn: { backgroundColor: '#fef2f2', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#fee2e2' },
  
  mobileRecipeCard: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  recipeRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recipeRowLabel: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  
  recipeFooter: { marginTop: 16 },
  addIngBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ff6b35', borderStyle: 'dashed', backgroundColor: '#fff3eb' },
  addIngText: { color: '#ff6b35', fontWeight: '600', fontSize: 14 },
  saveRecipeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ff6b35', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 8, width: '100%' },
  saveRecipeText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
