// ─── Typed Translation Dictionary ──────────────────────────────────────────
// OCP: Add a new language by adding a new entry to the LANG_MAP object.
//      Add a new key by adding it to TranslationDict — TypeScript will
//      enforce that every language provides a value (compile error if missing).

export type Lang = 'th' | 'en';

export interface TranslationDict {
  // Header
  appTitle: string;
  appSubtitle: string;

  // Language switcher
  langLabel: string;

  // KPI cards
  taxableGain: string;
  excludedLosses: string;
  excludedLossesSub: string;
  excludedLossesSubNone: string;
  totalRevenue: string;
  totalCostBasis: string;
  stockTaxableGain: string;
  cryptoTaxableGain: string;
  transactionsCount: string;
  sellsCount: string;
  noData: string;

  // Trade table
  tradeHistory: string;
  trades: string;
  buys: string;
  sells: string;
  addTrade: string;
  noTrades: string;
  noTradesHint: string;
  colDate: string;
  colSymbol: string;
  colProvider: string;
  colType: string;
  colQty: string;
  colPrice: string;
  colFee: string;
  colFx: string;
  colTotal: string;
  colFifoGain: string;
  colTaxable: string;
  colActions: string;
  taxYear: string;

  // Trade form
  formAddTitle: string;
  formEditTitle: string;
  formDate: string;
  formSymbol: string;
  formAssetType: string;
  formTradeType: string;
  formProvider: string;
  formQuantity: string;
  formPrice: string;
  formFee: string;
  formFxRate: string;
  formNotes: string;
  formNotesPlaceholder: string;
  formCancel: string;
  formSubmit: string;
  formUpdate: string;

  // Asset type options
  assetForeignStock: string;
  assetCrypto: string;

  // Trade type values
  tradeTypeBuy: string;
  tradeTypeSell: string;

  // Provider names
  providerDime: string;
  providerLiberator: string;
  providerFinansiaSyrus: string;

  // Taxable indicators
  taxableYes: string;
  taxableNo: string;

  // Validation
  validationError: string;

  // Asset badges (short form)
  badgeStock: string;
  badgeCrypto: string;
}

export type TranslationMap = Record<Lang, TranslationDict>;

// ─── Translation Data ─────────────────────────────────────────────────────

const translations: TranslationMap = {
  th: {
    appTitle: '📊 ติดตามภาษีการลงทุน',
    appSubtitle: 'คำนวณกำไร FIFO — ตามหลักเกณฑ์กรมสรรพากร',

    langLabel: 'ภาษา',

    taxableGain: 'กำไรที่ต้องเสียภาษี (เฉพาะกำไร)',
    excludedLosses: 'ขาดทุนที่หักลบไม่ได้',
    excludedLossesSub: 'ขาดทุนไม่สามารถหักลบกับกำไรได้ตามกฎหมายไทย',
    excludedLossesSubNone: 'ไม่มีขาดทุน',
    totalRevenue: 'รายได้รวม (บาท)',
    totalCostBasis: 'ต้นทุนรวม (บาท)',
    stockTaxableGain: 'กำไรหุ้น (ที่ต้องเสียภาษี)',
    cryptoTaxableGain: 'กำไรคริปโต (ที่ต้องเสียภาษี)',
    transactionsCount: 'รายการ',
    sellsCount: 'รายการขาย',
    noData: 'ไม่มีข้อมูล',

    tradeHistory: 'ประวัติการซื้อขาย',
    trades: 'รายการ',
    buys: 'ซื้อ',
    sells: 'ขาย',
    addTrade: '+ เพิ่มรายการ',
    noTrades: 'ไม่มีรายการซื้อขายในปี',
    noTradesHint: 'กด "เพิ่มรายการ" เพื่อบันทึกการซื้อขายครั้งแรก',
    colDate: 'วันที่',
    colSymbol: 'สัญลักษณ์',
    colProvider: 'โบรกเกอร์',
    colType: 'ประเภท',
    colQty: 'จำนวน',
    colPrice: 'ราคา (USD)',
    colFee: 'ค่าธรรมเนียม (USD)',
    colFx: 'อัตราแลกเปลี่ยน',
    colTotal: 'รวม (บาท)',
    colFifoGain: 'กำไร FIFO (บาท)',
    colTaxable: 'คิดภาษี',
    colActions: 'จัดการ',
    taxYear: 'ปีภาษี',

    formAddTitle: 'เพิ่มรายการใหม่',
    formEditTitle: 'แก้ไขรายการ',
    formDate: 'วันที่',
    formSymbol: 'สัญลักษณ์',
    formAssetType: 'ประเภทสินทรัพย์',
    formTradeType: 'ประเภทรายการ',
    formProvider: 'โบรกเกอร์',
    formQuantity: 'จำนวน',
    formPrice: 'ราคาต่อหน่วย (USD)',
    formFee: 'ค่าธรรมเนียม (USD)',
    formFxRate: 'อัตราแลกเปลี่ยน (บาท)',
    formNotes: 'หมายเหตุ (ไม่บังคับ)',
    formNotesPlaceholder: 'เช่น อ้างอิงโบรกเกอร์',
    formCancel: 'ยกเลิก',
    formSubmit: 'เพิ่มรายการ',
    formUpdate: 'แก้ไขรายการ',

    assetForeignStock: 'หุ้นต่างประเทศ',
    assetCrypto: 'คริปโต',

    tradeTypeBuy: 'ซื้อ',
    tradeTypeSell: 'ขาย',

    providerDime: 'Dime',
    providerLiberator: 'Liberator',
    providerFinansiaSyrus: 'FinansiaSyrus',

    taxableYes: '✅ นำไปคิดภาษีได้',
    taxableNo: '❌ ขาดทุน — หักลบไม่ได้',

    validationError: 'เกิดข้อผิดพลาด',

    badgeStock: 'หุ้น',
    badgeCrypto: 'คริปโต',
  },

  en: {
    appTitle: '📊 Thai Tax Tracker',
    appSubtitle: 'FIFO Capital Gains Calculator — Revenue Dept. Rules',

    langLabel: 'Language',

    taxableGain: 'Taxable Gain (Gains Only)',
    excludedLosses: 'Excluded Losses (Not Deductible)',
    excludedLossesSub: 'Losses cannot offset gains per Thai law',
    excludedLossesSubNone: 'No losses',
    totalRevenue: 'Total Revenue (THB)',
    totalCostBasis: 'Total Cost Basis (THB)',
    stockTaxableGain: 'Stock Taxable Gain',
    cryptoTaxableGain: 'Crypto Taxable Gain',
    transactionsCount: 'transactions',
    sellsCount: 'sells',
    noData: 'No data',

    tradeHistory: 'Trade History',
    trades: 'trades',
    buys: 'buys',
    sells: 'sells',
    addTrade: '+ Add Trade',
    noTrades: 'No trades recorded for',
    noTradesHint: 'Click "Add Trade" to enter your first transaction.',
    colDate: 'Date',
    colSymbol: 'Symbol',
    colProvider: 'Provider',
    colType: 'Type',
    colQty: 'Qty',
    colPrice: 'Price (USD)',
    colFee: 'Fee (USD)',
    colFx: 'FX Rate',
    colTotal: 'Total (THB)',
    colFifoGain: 'FIFO Gain (THB)',
    colTaxable: 'Taxable',
    colActions: 'Actions',
    taxYear: 'Tax Year',

    formAddTitle: 'Add New Trade',
    formEditTitle: 'Edit Trade',
    formDate: 'Date',
    formSymbol: 'Symbol',
    formAssetType: 'Asset Type',
    formTradeType: 'Trade Type',
    formProvider: 'Provider (Broker)',
    formQuantity: 'Quantity',
    formPrice: 'Unit Price (USD)',
    formFee: 'Fee (USD)',
    formFxRate: 'FX Rate (THB)',
    formNotes: 'Notes (optional)',
    formNotesPlaceholder: 'e.g. Broker reference',
    formCancel: 'Cancel',
    formSubmit: 'Add Trade',
    formUpdate: 'Update Trade',

    assetForeignStock: 'Foreign Stock',
    assetCrypto: 'Crypto',

    tradeTypeBuy: 'Buy',
    tradeTypeSell: 'Sell',

    providerDime: 'Dime',
    providerLiberator: 'Liberator',
    providerFinansiaSyrus: 'FinansiaSyrus',

    taxableYes: '✅ Taxable',
    taxableNo: '❌ Loss — not deductible',

    validationError: 'Validation Error',

    badgeStock: 'STK',
    badgeCrypto: 'CRYPTO',
  },
};

export default translations;
