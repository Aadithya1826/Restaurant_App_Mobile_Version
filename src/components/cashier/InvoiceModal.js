import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import * as Print from 'expo-print';

const InvoiceModal = ({ show, setShow, lastBillNo, lastOrderType, lastPaymentMethod, lastFutureSale, lastCart, lastBillAmt, restaurantData }) => {
  const dateStr = new Date().toLocaleString();
  const orderTypeFormatted = lastOrderType === 'take-away' ? 'Take Away' : 'Dine In';

  const printReceipt = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: monospace; width: 95%; max-width: 70mm; margin: 0 auto; padding: 5px; box-sizing: border-box; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .dashed { border-top: 1px dashed #000; margin: 10px 0; }
            .solid { border-top: 1px solid #ccc; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .item-name { flex: 2; word-break: break-word; padding-right: 5px; }
            .item-qty { width: 45px; text-align: center; }
            .item-amt { width: 75px; text-align: right; padding-left: 10px; }
            .meta { font-size: 12px; }
            .footer { font-size: 10px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin: 0;">DATA UDIPI HOTEL</h2>
            <div style="font-size: 12px;">M G R Nagar, Chennai</div>
            <div style="font-size: 12px;">Phone: {(restaurantData?.name || '').toLowerCase().includes('mugalivakkam') ? '+91 95970 66563' : '31595014'}</div>
          </div>
          
          <div style="border: 1px solid #000; padding: 5px; margin: 10px 0; text-align: center; font-weight: bold;">
            COUNTER POS
          </div>
          
          <div class="dashed"></div>
          
          <div class="meta">Bill No: <span class="bold">${lastBillNo}</span> &nbsp;&nbsp; ${dateStr}</div>
          <div class="meta">Mode: <span class="bold">${orderTypeFormatted}</span> | Pay: <span class="bold">${lastPaymentMethod}</span></div>
          ${lastFutureSale && lastFutureSale.name ? `
            <div class="solid"></div>
            <div class="meta">Future Sale: <span class="bold">${lastFutureSale.name}</span></div>
            ${lastFutureSale.phone ? `<div class="meta">Phone: ${lastFutureSale.phone}</div>` : ''}
            ${lastFutureSale.deliveryDate ? `<div class="meta">Del. Date: ${lastFutureSale.deliveryDate}</div>` : ''}
            ${lastFutureSale.deliveryTime ? `<div class="meta">Del. Time: ${lastFutureSale.deliveryTime}</div>` : ''}
          ` : ''}
          
          <div class="dashed"></div>
          
          <div class="item-row bold">
            <div class="item-name">Item</div>
            <div class="item-qty">Qty</div>
            <div class="item-amt">Amt</div>
          </div>
          
          ${(lastCart || []).map(item => `
            <div class="item-row" style="font-size: 13px;">
              <div class="item-name">
                <div>${item.description}</div>
                <div style="font-size: 11px; color: #666;">${item.product_code || '154'}</div>
              </div>
              <div class="item-qty">${item.qty}</div>
              <div class="item-amt">&#8377;${item.amount.toFixed(2)}</div>
            </div>
          `).join('')}
          
          <div class="dashed"></div>
          
          <div class="row bold" style="font-size: 16px;">
            <div>TOTAL</div>
            <div>&#8377;${(lastBillAmt || 0).toFixed(2)}</div>
          </div>
          
          <div class="dashed"></div>
          
          <div class="center" style="margin-top: 10px;">
            <div class="bold" style="font-size: 12px; font-style: italic;">Thank you! Visit again.</div>
            <div class="solid"></div>
            <div class="footer">Techwizard AI partners<br>hello@t-wi.com</div>
          </div>
        </body>
      </html>
    `;
    
    try {
      await Print.printAsync({ html });
    } catch (err) {
      console.error('Print error:', err);
    }
  };

  return (
    <Modal visible={show} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.receiptContainer}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.receiptContent}>
            
            {/* Header */}
            <View style={styles.centerAlign}>
              <Text style={styles.restaurantName}>DATA UDIPI HOTEL</Text>
              <Text style={styles.addressText}>M G R Nagar, Chennai</Text>
              <Text style={styles.addressText}>Phone: {(restaurantData?.name || '').toLowerCase().includes('mugalivakkam') ? '+91 95970 66563' : '31595014'}</Text>
            </View>
            
            {/* Boxed Title */}
            <View style={styles.counterBox}>
              <Text style={styles.counterBoxText}>COUNTER POS</Text>
            </View>
            
            <View style={styles.dashedLine} />
            
            {/* Meta Info */}
            <View style={styles.metaInfoRow}>
              <Text style={styles.metaText}>Bill No: <Text style={styles.boldText}>{lastBillNo}</Text>  {dateStr}</Text>
            </View>
            <View style={styles.metaInfoRow}>
              <Text style={styles.metaText}>Mode: <Text style={styles.boldText}>{orderTypeFormatted}</Text> | Pay: <Text style={styles.boldText}>{lastPaymentMethod}</Text></Text>
            </View>

            {lastFutureSale && lastFutureSale.name ? (
              <View>
                <View style={styles.solidLine} />
                <View style={styles.metaInfoRow}>
                  <Text style={styles.metaText}>Future Sale: <Text style={styles.boldText}>{lastFutureSale.name}</Text></Text>
                </View>
                {lastFutureSale.phone ? (
                  <View style={styles.metaInfoRow}>
                    <Text style={styles.metaText}>Phone: {lastFutureSale.phone}</Text>
                  </View>
                ) : null}
                {lastFutureSale.deliveryDate ? (
                  <View style={styles.metaInfoRow}>
                    <Text style={styles.metaText}>Del. Date: {lastFutureSale.deliveryDate}</Text>
                  </View>
                ) : null}
                {lastFutureSale.deliveryTime ? (
                  <View style={styles.metaInfoRow}>
                    <Text style={styles.metaText}>Del. Time: {lastFutureSale.deliveryTime}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            
            <View style={styles.dashedLine} />
            
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Item</Text>
              <Text style={[styles.tableHeaderText, { width: 40, textAlign: 'center' }]}>Qty</Text>
              <Text style={[styles.tableHeaderText, { width: 70, textAlign: 'right' }]}>Amt</Text>
            </View>
            
            {/* Items */}
            {(lastCart || []).map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemText}>{item.description}</Text>
                  <Text style={styles.itemCodeText}>{item.product_code || '154'}</Text>
                </View>
                <Text style={[styles.itemText, { width: 40, textAlign: 'center' }]}>{item.qty}</Text>
                <Text style={[styles.itemText, { width: 70, textAlign: 'right' }]}>₹{item.amount.toFixed(2)}</Text>
              </View>
            ))}
            
            <View style={styles.dashedLine} />
            
            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalAmount}>₹{(lastBillAmt || 0).toFixed(2)}</Text>
            </View>
            
            <View style={styles.dashedLine} />
            
            {/* Footer */}
            <View style={styles.footerSection}>
              <Text style={styles.thankYouText}>Thank you! Visit again.</Text>
              <View style={styles.solidLine} />
              <Text style={styles.techText}>Techwizard AI partners</Text>
              <Text style={styles.techText}>hello@t-wi.com</Text>
            </View>

          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.printBtn} onPress={printReceipt}>
              <Text style={styles.printBtnText}>Print Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => { if(setShow) setShow(false); }}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  receiptContainer: { 
    backgroundColor: '#fff', 
    width: 320, 
    maxHeight: '85%', 
    borderRadius: 4, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
    overflow: 'hidden'
  },
  receiptContent: { padding: 20 },
  centerAlign: { alignItems: 'center', marginBottom: 15 },
  restaurantName: { fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace', fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  addressText: { fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace', fontSize: 12, color: '#000', marginBottom: 2 },
  
  counterBox: { borderWidth: 1, borderColor: '#000', paddingVertical: 8, alignItems: 'center', marginBottom: 15 },
  counterBoxText: { fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace', fontSize: 14, fontWeight: 'bold', color: '#000' },
  
  dashedLine: { borderWidth: 1, borderColor: '#000', borderStyle: 'dashed', marginVertical: 12 },
  solidLine: { borderWidth: 0.5, borderColor: '#ccc', marginVertical: 12, width: '100%' },
  
  metaInfoRow: { marginBottom: 6 },
  metaText: { fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace', fontSize: 12, color: '#000' },
  boldText: { fontWeight: 'bold' },
  
  tableHeaderRow: { flexDirection: 'row', marginBottom: 10 },
  tableHeaderText: { fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace', fontSize: 13, fontWeight: 'bold', color: '#000' },
  
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  itemText: { fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace', fontSize: 13, color: '#000' },
  itemCodeText: { fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace', fontSize: 11, color: '#6b7280', marginTop: 2 },
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace', fontSize: 16, fontWeight: 'bold', color: '#000' },
  totalAmount: { fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace', fontSize: 16, fontWeight: 'bold', color: '#000' },
  
  footerSection: { alignItems: 'center', marginTop: 10 },
  thankYouText: { fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace', fontSize: 12, fontStyle: 'italic', color: '#000', fontWeight: 'bold' },
  techText: { fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace', fontSize: 10, color: '#6b7280' },
  
  closeBtn: { flex: 1, backgroundColor: '#ef4444', padding: 12, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  printBtn: { flex: 1, backgroundColor: '#111827', padding: 12, alignItems: 'center' },
  printBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  buttonRow: { flexDirection: 'row', width: '100%' }
});

export default InvoiceModal;
