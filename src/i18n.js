// Bilingual EN/AR support for the client app. Deliberately not a generic
// i18n library — this is a fixed, known set of UI strings, so a flat
// dictionary + a tiny t() helper is simpler than pulling in a real i18n
// framework for two languages. Per-client free text (product categories,
// customer types — see config.js) is never routed through this: it's
// whatever the operator typed into the intake form, in whatever language
// they typed it, and t()/statusLabel() both fall back to the raw value
// for anything not in the dictionary.
export const LANG_KEY = "ahq_lang";

export const STRINGS = {
  // common
  cancel: { en: "Cancel", ar: "إلغاء" },
  done: { en: "Done", ar: "تم" },
  edit: { en: "Edit", ar: "تعديل" },
  add: { en: "Add", ar: "إضافة" },
  notes: { en: "Notes", ar: "ملاحظات" },
  search: { en: "Search customers, invoices, products, orders…", ar: "ابحث في العملاء والفواتير والمنتجات والطلبات…" },
  signOut: { en: "Sign out", ar: "تسجيل الخروج" },
  signIn: { en: "Sign in", ar: "تسجيل الدخول" },
  signingIn: { en: "Signing in…", ar: "جارٍ تسجيل الدخول…" },
  loading: { en: "Loading…", ar: "جارٍ التحميل…" },
  retry: { en: "Retry", ar: "إعادة المحاولة" },
  couldntReachServer: { en: "Couldn't reach the server: {error}", ar: "تعذّر الوصول إلى الخادم: {error}" },
  printSavePdf: { en: "Print / Save PDF", ar: "طباعة / حفظ PDF" },
  pdf: { en: "PDF", ar: "PDF" },
  exportExcel: { en: "Export Excel (CSV)", ar: "تصدير Excel (CSV)" },
  confirmSignOut: { en: "Sign out of {name}?", ar: "تسجيل الخروج من {name}؟" },
  businessManager: { en: "Business Manager", ar: "إدارة الأعمال" },
  manager: { en: "Manager", ar: "الإدارة" },
  appVersion: { en: "App version {v}", ar: "إصدار التطبيق {v}" },
  savingEllipsis: { en: "Saving…", ar: "جارٍ الحفظ…" },
  select: { en: "— select —", ar: "— اختر —" },
  more: { en: "More", ar: "المزيد" },
  languageToggle: { en: "العربية", ar: "English" },

  // login
  email: { en: "Email", ar: "البريد الإلكتروني" },
  password: { en: "Password", ar: "كلمة المرور" },

  // nav
  navDashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  navSales: { en: "Sales", ar: "المبيعات" },
  navInventory: { en: "Inventory", ar: "المخزون" },
  navCustomers: { en: "Customers", ar: "العملاء" },
  navInvoices: { en: "Invoices", ar: "الفواتير" },
  navPOs: { en: "Purchase orders", ar: "أوامر الشراء" },
  navShipping: { en: "Shipping", ar: "الشحن" },
  navExpenses: { en: "Expenses", ar: "المصروفات" },
  navReports: { en: "Reports", ar: "التقارير" },
  navAgent: { en: "Hadad Agent", ar: "وكيل حداد" },
  navSettings: { en: "Settings", ar: "الإعدادات" },

  // dashboard
  totalRevenue: { en: "Total revenue", ar: "إجمالي الإيرادات" },
  totalSalesCount: { en: "Total sales", ar: "إجمالي المبيعات" },
  totalProfit: { en: "Total profit", ar: "إجمالي الربح" },
  inventoryValue: { en: "Inventory value", ar: "قيمة المخزون" },
  pendingPOs: { en: "Pending POs", ar: "أوامر شراء معلّقة" },
  pendingShipments: { en: "Pending shipments", ar: "شحنات معلّقة" },
  unpaidInvoices: { en: "Unpaid invoices", ar: "فواتير غير مدفوعة" },
  lowStockAlert: { en: "Low stock: {list}", ar: "مخزون منخفض: {list}" },
  monthlySales: { en: "Monthly sales (last 6 months)", ar: "المبيعات الشهرية (آخر 6 أشهر)" },
  bestSellingProducts: { en: "Best-selling products", ar: "المنتجات الأكثر مبيعًا" },
  noSalesYet: { en: "No sales yet", ar: "لا توجد مبيعات بعد" },
  soldCount: { en: "{n} sold", ar: "تم بيع {n}" },

  // inventory
  product: { en: "Product", ar: "منتج" },
  all: { en: "All", ar: "الكل" },
  noSku: { en: "no SKU", ar: "بدون رمز" },
  sellPrefix: { en: "sell", ar: "بيع" },
  inStock: { en: "in stock", ar: "في المخزون" },
  noProductsInCategory: { en: "No products in this category", ar: "لا توجد منتجات في هذه الفئة" },

  // sales
  sale: { en: "Sale", ar: "عملية بيع" },
  noSalesYetHint: { en: "No sales yet — add one or ask Hadad Agent", ar: "لا توجد مبيعات بعد — أضف واحدة أو اسأل وكيل حداد" },

  // customers
  customer: { en: "Customer", ar: "العميل" },
  noCustomersYet: { en: "No customers yet", ar: "لا يوجد عملاء بعد" },

  // invoices
  invoicesAutoHint: { en: "Invoices are created automatically with each sale", ar: "يتم إنشاء الفواتير تلقائيًا مع كل عملية بيع" },

  // purchase orders
  po: { en: "PO", ar: "أمر شراء" },
  noPOsYet: { en: "No purchase orders yet", ar: "لا توجد أوامر شراء بعد" },
  updateCostQuestion: { en: "Update each product's cost price to the new landed cost?", ar: "هل تريد تحديث سعر تكلفة كل منتج ليطابق التكلفة الجديدة؟" },
  yesUpdateCosts: { en: "Yes, update costs", ar: "نعم، حدّث التكاليف" },
  noJustAddStock: { en: "No, just add stock", ar: "لا، أضف المخزون فقط" },
  markReceivedToStock: { en: "Mark received → stock", ar: "تعليم كمستلم ← إضافة للمخزون" },

  // shipping
  shipment: { en: "Shipment", ar: "شحنة" },
  noShipmentsYet: { en: "No shipments yet", ar: "لا توجد شحنات بعد" },

  // expenses
  expense: { en: "Expense", ar: "مصروف" },
  totalExpenses: { en: "Total expenses", ar: "إجمالي المصروفات" },
  noExpensesRecorded: { en: "No expenses recorded", ar: "لم يتم تسجيل أي مصروفات" },

  // reports
  noDataThisMonth: { en: "No data this month", ar: "لا توجد بيانات لهذا الشهر" },
  salesByProductMargin: { en: "Sales by product (qty · revenue · margin)", ar: "المبيعات حسب المنتج (الكمية · الإيرادات · الهامش)" },
  salesByCustomer: { en: "Sales by customer", ar: "المبيعات حسب العميل" },
  expensesByCategory: { en: "Expenses by category", ar: "المصروفات حسب الفئة" },
  revenue: { en: "Revenue", ar: "الإيرادات" },
  grossProfit: { en: "Gross profit", ar: "إجمالي الربح" },
  expensesLabel: { en: "Expenses", ar: "المصروفات" },
  netProfit: { en: "Net profit", ar: "صافي الربح" },

  // agent
  agentHint: { en: "Tell the agent what happened in plain language — it updates your records. Sensitive changes ask for confirmation first.", ar: "أخبر الوكيل بما حدث بلغة بسيطة — سيقوم بتحديث سجلاتك. التغييرات الحساسة تُطلب تأكيدها أولاً." },
  tryOneOfThese: { en: "Try one of these:", ar: "جرّب أحد هذه:" },
  confirmYes: { en: "Confirm — Yes", ar: "تأكيد — نعم" },
  cancelNo: { en: "Cancel — No", ar: "إلغاء — لا" },
  agentThinking: { en: "Hadad Agent is thinking…", ar: "وكيل حداد يفكر…" },
  agentPlaceholder: { en: 'e.g. "Sold 2 drones to Ahmed for 4500 each, paid cash"', ar: 'مثال: "بعت طائرتين مسيّرتين لأحمد بسعر 4500 لكل واحدة، دفع نقدًا"' },
  aiActivityLog: { en: "AI activity log", ar: "سجل نشاط الذكاء الاصطناعي" },
  agentErrorPrefix: { en: "Something went wrong — no changes were made. ({error})", ar: "حدث خطأ ما — لم يتم إجراء أي تغييرات. ({error})" },

  // settings
  signedInAs: { en: "Signed in as", ar: "تم تسجيل الدخول باسم" },
  changePassword: { en: "Change password", ar: "تغيير كلمة المرور" },
  currentPassword: { en: "Current password", ar: "كلمة المرور الحالية" },
  newPassword: { en: "New password", ar: "كلمة المرور الجديدة" },
  confirmNewPassword: { en: "Confirm new password", ar: "تأكيد كلمة المرور الجديدة" },
  passwordChanged: { en: "Password changed.", ar: "تم تغيير كلمة المرور." },
  passwordMinLength: { en: "New password must be at least 8 characters.", ar: "يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل." },
  passwordsDontMatch: { en: "New passwords don't match.", ar: "كلمتا المرور الجديدتان غير متطابقتين." },
  companyVat: { en: "Company & VAT", ar: "الشركة وضريبة القيمة المضافة" },
  companyName: { en: "Company name", ar: "اسم الشركة" },
  applyVatDefault: { en: "Apply UAE VAT ({rate}%) on new invoices by default", ar: "تطبيق ضريبة القيمة المضافة الإماراتية ({rate}%) على الفواتير الجديدة افتراضيًا" },
  vatRatePercent: { en: "VAT rate %", ar: "نسبة ضريبة القيمة المضافة %" },
  teamAccounts: { en: "Team accounts", ar: "حسابات الفريق" },
  deactivate: { en: "Deactivate", ar: "إلغاء تفعيل" },
  activate: { en: "Activate", ar: "تفعيل" },
  addTeamMember: { en: "Add team member", ar: "إضافة عضو للفريق" },
  namePlaceholder: { en: "Name", ar: "الاسم" },
  passwordPlaceholderMin: { en: "Password (8+ chars)", ar: "كلمة المرور (8 أحرف على الأقل)" },
  addAccount: { en: "Add account", ar: "إضافة حساب" },
  staffPermissionHint: { en: "Staff can sell and manage day-to-day work but never see cost prices, profit, or reports, and can't delete records or edit invoices.", ar: "يمكن للموظفين البيع وإدارة العمل اليومي، لكن لا يمكنهم رؤية أسعار التكلفة أو الأرباح أو التقارير، ولا يمكنهم حذف السجلات أو تعديل الفواتير." },

  // forms — product
  editProduct: { en: "Edit product", ar: "تعديل المنتج" },
  newProduct: { en: "New product", ar: "منتج جديد" },
  productName: { en: "Product name", ar: "اسم المنتج" },
  productNamePlaceholder: { en: "e.g. T-30 Agri Drone", ar: "مثال: طائرة زراعية T-30" },
  category: { en: "Category", ar: "الفئة" },
  skuItemCode: { en: "SKU / item code", ar: "رمز المنتج (SKU)" },
  supplier: { en: "Supplier", ar: "المورّد" },
  quantityInStock: { en: "Quantity in stock", ar: "الكمية في المخزون" },
  minStockAlert: { en: "Minimum stock alert", ar: "حد التنبيه لانخفاض المخزون" },
  costPriceCurrency: { en: "Cost price ({currency})", ar: "سعر التكلفة ({currency})" },
  sellingPriceCurrency: { en: "Selling price ({currency})", ar: "سعر البيع ({currency})" },
  trackSerialNumbers: { en: "Track serial numbers", ar: "تتبع الأرقام التسلسلية" },
  profitPerItem: { en: "Profit per item:", ar: "الربح لكل قطعة:" },
  saveProduct: { en: "Save product", ar: "حفظ المنتج" },

  // forms — customer
  editCustomer: { en: "Edit customer", ar: "تعديل العميل" },
  newCustomer: { en: "New customer", ar: "عميل جديد" },
  name: { en: "Name", ar: "الاسم" },
  customerType: { en: "Customer type", ar: "نوع العميل" },
  phone: { en: "Phone", ar: "الهاتف" },
  whatsapp: { en: "WhatsApp", ar: "واتساب" },
  company: { en: "Company", ar: "الشركة" },
  location: { en: "Location", ar: "الموقع" },
  saveCustomer: { en: "Save customer", ar: "حفظ العميل" },

  // forms — sale
  newSale: { en: "New sale", ar: "عملية بيع جديدة" },
  itemsQtyPrice: { en: "Items · qty · price", ar: "العناصر · الكمية · السعر" },
  addItem: { en: "Add item", ar: "إضافة عنصر" },
  discountCurrency: { en: "Discount ({currency})", ar: "الخصم ({currency})" },
  paymentStatus: { en: "Payment status", ar: "حالة الدفع" },
  method: { en: "Method", ar: "طريقة الدفع" },
  total: { en: "Total", ar: "الإجمالي" },
  saveSaleCreateInvoice: { en: "Save sale & create invoice", ar: "حفظ البيع وإنشاء فاتورة" },

  // forms — PO
  newPO: { en: "New purchase order", ar: "أمر شراء جديد" },
  newSupplierOption: { en: "+ New supplier…", ar: "+ مورّد جديد…" },
  newSupplierName: { en: "New supplier name", ar: "اسم المورّد الجديد" },
  newSupplierPlaceholder: { en: "e.g. SkyTech China", ar: "مثال: سكاي تك الصين" },
  itemsQtyUnitCost: { en: "Items · qty · unit cost", ar: "العناصر · الكمية · تكلفة الوحدة" },
  newItemOption: { en: "— new item —", ar: "— عنصر جديد —" },
  newItemNamePlaceholder: { en: "New item name", ar: "اسم العنصر الجديد" },
  shippingCostCurrency: { en: "Shipping cost ({currency})", ar: "تكلفة الشحن ({currency})" },
  expectedArrival: { en: "Expected arrival", ar: "تاريخ الوصول المتوقع" },
  notesSupplierRef: { en: "Notes / supplier invoice ref", ar: "ملاحظات / رقم فاتورة المورّد" },
  totalLandedCost: { en: "Total landed cost:", ar: "إجمالي التكلفة النهائية:" },
  createPOOrdered: { en: "Create PO (Ordered)", ar: "إنشاء أمر شراء (تم الطلب)" },

  // forms — shipment
  newShipment: { en: "New shipment", ar: "شحنة جديدة" },
  linkedTo: { en: "Linked to", ar: "مرتبط بـ" },
  customerSale: { en: "Customer sale", ar: "عملية بيع لعميل" },
  purchaseOrder: { en: "Purchase order", ar: "أمر شراء" },
  courierCompany: { en: "Courier / company", ar: "شركة الشحن" },
  trackingNumber: { en: "Tracking number", ar: "رقم التتبع" },
  estimatedDelivery: { en: "Estimated delivery", ar: "تاريخ التسليم المتوقع" },
  saveShipment: { en: "Save shipment", ar: "حفظ الشحنة" },

  // forms — expense
  newExpense: { en: "New expense", ar: "مصروف جديد" },
  amountCurrency: { en: "Amount ({currency})", ar: "المبلغ ({currency})" },
  date: { en: "Date", ar: "التاريخ" },
  saveExpense: { en: "Save expense", ar: "حفظ المصروف" },

  // detail modals — product
  lowStockBadge: { en: "Low stock", ar: "مخزون منخفض" },
  cost: { en: "Cost", ar: "التكلفة" },
  selling: { en: "Selling", ar: "سعر البيع" },
  profitPerItemShort: { en: "Profit / item", ar: "الربح / القطعة" },
  skuMinStock: { en: "SKU {sku} · Min stock {min}", ar: "رمز المنتج {sku} · الحد الأدنى للمخزون {min}" },
  serialNumbers: { en: "Serial numbers", ar: "الأرقام التسلسلية" },
  noneYet: { en: "None yet", ar: "لا يوجد بعد" },
  addSerialPlaceholder: { en: "Add serial number", ar: "أضف رقمًا تسلسليًا" },
  stockMovementHistory: { en: "Stock movement history", ar: "سجل حركة المخزون" },
  noMovementsYet: { en: "No movements yet", ar: "لا توجد حركات بعد" },

  // detail modals — customer
  totalSpent: { en: "Total spent", ar: "إجمالي الإنفاق" },
  outstandingBalance: { en: "Outstanding balance", ar: "الرصيد المستحق" },
  purchaseHistory: { en: "Purchase history", ar: "سجل المشتريات" },
  noPurchasesYet: { en: "No purchases yet", ar: "لا توجد مشتريات بعد" },

  // invoice modal
  invoiceNumber: { en: "Invoice {number}", ar: "فاتورة {number}" },
  billTo: { en: "Bill to:", ar: "فاتورة إلى:" },
  item: { en: "Item", ar: "العنصر" },
  qty: { en: "Qty", ar: "الكمية" },
  unitPrice: { en: "Unit price", ar: "سعر الوحدة" },
  amountCol: { en: "Amount", ar: "المبلغ" },
  subtotal: { en: "Subtotal", ar: "المجموع الفرعي" },
  vatPercent: { en: "VAT {rate}%", ar: "ضريبة القيمة المضافة {rate}%" },
  shareWhatsapp: { en: "Share via WhatsApp", ar: "مشاركة عبر واتساب" },
  emailAction: { en: "Email", ar: "بريد إلكتروني" },
  thankYouBusiness: { en: "Thank you for your business.", ar: "شكرًا لتعاملكم معنا." },

  // subscription suspended
  subscriptionSuspended: { en: "Subscription suspended", ar: "الاشتراك موقوف" },
  subscriptionSuspendedHint: { en: "{business} is paused pending payment. Contact your account manager to resume access.", ar: "تم إيقاف {business} مؤقتًا بانتظار الدفع. تواصل مع مدير حسابك لاستعادة الوصول." },
};

/** t(lang, key, vars?) — falls back to the key itself if missing, so a bug shows up as a raw key in the UI, not a crash. */
export function t(lang, key, vars) {
  const entry = STRINGS[key];
  let str = entry ? (entry[lang] || entry.en) : key;
  if (vars) for (const [k, v] of Object.entries(vars)) str = str.replaceAll("{" + k + "}", v);
  return str;
}

// Fixed template-level enum values (payment/PO/shipment/invoice statuses,
// payment methods, expense categories, roles, AI log fields) that
// currently go through the generic cap() title-caser — Arabic has no
// "capitalize first letter" concept, so these need real translations.
// Anything NOT in this map (e.g. a client's own product category names)
// falls back to cap(), same as before this feature existed.
const STATUS_AR = {
  paid: "مدفوع", partial: "جزئي", unpaid: "غير مدفوع",
  draft: "مسودة", ordered: "تم الطلب", shipped: "تم الشحن", received: "تم الاستلام", cancelled: "ملغى",
  preparing: "قيد التحضير", in_transit: "قيد النقل", delivered: "تم التسليم", delayed: "متأخر", void: "ملغاة",
  cash: "نقدًا", bank_transfer: "تحويل بنكي", card: "بطاقة", other: "أخرى",
  shipping: "الشحن", tools: "أدوات", repairs: "إصلاحات", rent: "إيجار", marketing: "تسويق", salaries: "رواتب", customs: "رسوم جمركية",
  admin: "مسؤول", staff: "موظف",
  sale: "بيع", po_received: "استلام أمر شراء", manual_adjust: "تعديل يدوي", return: "إرجاع", correction: "تصحيح",
  whatsapp: "واتساب", telegram: "تيليجرام", in_app: "داخل التطبيق",
  executed: "تم التنفيذ", awaiting_confirmation: "بانتظار التأكيد", awaiting_clarification: "بانتظار التوضيح", rejected: "مرفوض", failed: "فشل", query: "استعلام",
};

/** statusLabel(lang, cap, value) — cap is the existing English title-caser, passed in to avoid a circular import; falls back to it for anything not in STATUS_AR (client-defined category/type names). */
export function statusLabel(lang, cap, value) {
  if (lang === "ar" && STATUS_AR[value]) return STATUS_AR[value];
  return cap(value);
}
