import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, Users, FileText, Truck,
  ClipboardList, Wallet, BarChart3, Bot, Settings, Search, Plus, Sun, Moon,
  X, Check, AlertTriangle, Printer, Send, MoreHorizontal, ChevronRight,
  Sparkles, LogOut, Loader2, UserPlus, Trash2, Lock, Languages
} from "lucide-react";
import { api, setToken, clearToken, hasToken } from "./api.js";
import { config, isModuleEnabled, money, brandShades, PRODUCT_CATEGORIES, CUSTOMER_TYPES, EXPENSE_CATEGORIES } from "./config.js";
import { customNav, customRoutes } from "./custom/index.js";
import { t, statusLabel, LANG_KEY } from "./i18n.js";

/* ---------------- helpers ---------------- */
const N = (v) => Number(v) || 0;
const fmt = (n) => N(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
const AED = money;
const cap = (s) => String(s || "").split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
const catLabel = (v) => PRODUCT_CATEGORIES.find((c) => c.value === v)?.label || cap(v);
const custTypeLabel = (v) => CUSTOMER_TYPES.find((c) => c.value === v)?.label || cap(v);
const today = () => new Date().toISOString().slice(0, 10);
const dstr = (d) => (d ? String(d).slice(0, 10) : "");
const CATS = PRODUCT_CATEGORIES.map((c) => c.value);
const CUST_TYPES = CUSTOMER_TYPES.map((c) => c.value);
const EXP_CATS = EXPENSE_CATEGORIES;
const PO_STATUSES = ["draft", "ordered", "shipped", "received", "cancelled"];
const SHIP_STATUSES = ["preparing", "shipped", "in_transit", "delivered", "delayed"];
const PAY_METHODS = ["cash", "bank_transfer", "card", "other"];
const invoiceTotal = (inv) => {
  const base = N(inv.subtotal) - N(inv.discount);
  return { base, vat: inv.vat_enabled ? base * N(inv.vat_rate) / 100 : 0, total: base * (inv.vat_enabled ? 1 + N(inv.vat_rate) / 100 : 1) };
};

const del = async (path, msg, after) => {
  if (!window.confirm(msg)) return;
  try { await api(path, { method: "DELETE" }); after && after(); }
  catch (e) { alert(e.message); }
};

/* ---------------- UI atoms ---------------- */
const Btn = ({ children, onClick, kind = "primary", th, small, disabled }) => {
  const base = "inline-flex items-center justify-center gap-1 rounded-lg font-medium transition-colors " +
    (small ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm") + (disabled ? " opacity-50 pointer-events-none" : "");
  const kinds = {
    primary: " bg-sand-500 hover:bg-sand-400 text-stone-950",
    ghost: " border " + th.bord + " " + th.text + " " + th.hov,
    danger: " bg-red-600 hover:bg-red-500 text-white",
  };
  return <button onClick={onClick} className={base + kinds[kind]}>{children}</button>;
};
const Card = ({ children, th, className = "" }) => <div className={"rounded-xl border " + th.bord + " " + th.card + " " + className}>{children}</div>;
const AIBadge = () => <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 text-violet-500 px-2 py-0.5 text-xs font-medium"><Sparkles size={11} />AI</span>;
const Pill = ({ v, label }) => {
  const map = {
    paid: "bg-emerald-500/15 text-emerald-500", received: "bg-emerald-500/15 text-emerald-500", delivered: "bg-emerald-500/15 text-emerald-500",
    partial: "bg-sand-500/15 text-sand-500", preparing: "bg-sand-500/15 text-sand-500",
    ordered: "bg-sky-500/15 text-sky-500", shipped: "bg-sky-500/15 text-sky-500", in_transit: "bg-sky-500/15 text-sky-500",
    unpaid: "bg-red-500/15 text-red-500", delayed: "bg-red-500/15 text-red-500", cancelled: "bg-red-500/15 text-red-500", void: "bg-red-500/15 text-red-500",
    draft: "bg-stone-500/15 text-stone-400",
  };
  return <span className={"rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap " + (map[v] || "bg-stone-500/15 text-stone-400")}>{label ?? cap(v)}</span>;
};
const Field = ({ label, children, th }) => <label className="block text-sm"><span className={"block mb-1 text-xs font-medium " + th.sub}>{label}</span>{children}</label>;
const inpCls = (th) => "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sand-500 " + th.inp;
const Inp = ({ th, ...p }) => <input {...p} className={inpCls(th)} />;
const Sel = ({ th, children, ...p }) => <select {...p} className={inpCls(th)}>{children}</select>;
const TA = ({ th, ...p }) => <textarea rows={2} {...p} className={inpCls(th)} />;
const Empty = ({ th, text }) => <div className={"py-10 text-center text-sm " + th.sub}>{text}</div>;
const Spinner = ({ th }) => <div className={"flex justify-center py-12 " + th.sub}><Loader2 className="animate-spin" /></div>;

const Modal = ({ title, onClose, children, th, wide }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className={"w-full " + (wide ? "sm:max-w-2xl" : "sm:max-w-md") + " max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border " + th.bord + " " + th.card + " shadow-2xl"}>
      <div className={"sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b " + th.bord + " " + th.card}>
        <h3 className={"font-semibold " + th.text}>{title}</h3>
        <button onClick={onClose} className={th.sub}><X size={18} /></button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

/* ---------------- login ---------------- */
function Login({ onLogin, lang, setLang }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const th = { bord: "border-stone-800", card: "bg-stone-900", text: "text-stone-100", sub: "text-stone-400", inp: "bg-stone-800 border-stone-700 text-stone-100 placeholder-stone-500", hov: "hover:bg-stone-800" };
  const go = async () => {
    if (!email || !password || busy) return;
    setBusy(true); setErr("");
    try {
      const r = await api("/api/auth/login", { method: "POST", body: { email, password } });
      setToken(r.token);
      onLogin(r.user);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <div className={"w-full max-w-sm rounded-2xl border p-6 " + th.bord + " " + th.card}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={"/" + config.branding.logo_file} alt={config.client.business_name} className="h-10 w-auto" />
            <div>
              <div className="font-bold text-stone-100 leading-tight">{config.client.business_name}</div>
              <div className="text-xs text-stone-400">{t(lang, "businessManager")}</div>
            </div>
          </div>
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="shrink-0 text-stone-400 hover:text-stone-100 flex items-center gap-1 text-xs"><Languages size={15} />{t(lang, "languageToggle")}</button>
        </div>
        <div className="space-y-3">
          <Field label={t(lang, "email")} th={th}><Inp th={th} type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} placeholder="you@example.com" /></Field>
          <Field label={t(lang, "password")} th={th}><Inp th={th} type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} placeholder="••••••••" /></Field>
          {err && <div className="text-sm text-red-500">{err}</div>}
          <button onClick={go} disabled={busy} className="w-full rounded-lg bg-sand-500 hover:bg-sand-400 text-stone-950 font-semibold py-2.5 text-sm disabled:opacity-50">
            {busy ? t(lang, "signingIn") : t(lang, "signIn")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- forms ---------------- */
function ProductForm({ th, lang, d, edit, onDone, onClose, isAdmin }) {
  const [f, setF] = useState(edit ? { ...edit } : { name: "", category: PRODUCT_CATEGORIES[0]?.value || "other", sku: "", quantity: 0, cost_price: 0, selling_price: 0, supplier_id: "", min_stock: 1, notes: "", track_serials: false });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setBusy(true);
    const body = { name: f.name, category: f.category, sku: f.sku || null, quantity: N(f.quantity), selling_price: N(f.selling_price), supplier_id: f.supplier_id || null, min_stock: N(f.min_stock), notes: f.notes || "", track_serials: !!f.track_serials };
    if (isAdmin) body.cost_price = N(f.cost_price);
    try {
      if (edit) await api("/api/products/" + edit.id, { method: "PATCH", body });
      else await api("/api/products", { method: "POST", body });
      onDone();
    } catch (e) { alert(e.message); }
    setBusy(false);
  };
  return (
    <Modal title={edit ? t(lang, "editProduct") : t(lang, "newProduct")} onClose={onClose} th={th} wide>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t(lang, "productName")} th={th}><Inp th={th} value={f.name} onChange={set("name")} placeholder={t(lang, "productNamePlaceholder")} /></Field>
        <Field label={t(lang, "category")} th={th}><Sel th={th} value={f.category} onChange={set("category")}>{PRODUCT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Sel></Field>
        <Field label={t(lang, "skuItemCode")} th={th}><Inp th={th} value={f.sku || ""} onChange={set("sku")} /></Field>
        <Field label={t(lang, "supplier")} th={th}>
          <Sel th={th} value={f.supplier_id || ""} onChange={set("supplier_id")}>
            <option value="">—</option>{d.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Sel>
        </Field>
        <Field label={t(lang, "quantityInStock")} th={th}><Inp th={th} type="number" value={f.quantity} onChange={set("quantity")} /></Field>
        <Field label={t(lang, "minStockAlert")} th={th}><Inp th={th} type="number" value={f.min_stock} onChange={set("min_stock")} /></Field>
        {isAdmin && <Field label={t(lang, "costPriceCurrency", { currency: config.client.currency })} th={th}><Inp th={th} type="number" value={f.cost_price} onChange={set("cost_price")} /></Field>}
        <Field label={t(lang, "sellingPriceCurrency", { currency: config.client.currency })} th={th}><Inp th={th} type="number" value={f.selling_price} onChange={set("selling_price")} /></Field>
        <div className="sm:col-span-2"><Field label={t(lang, "notes")} th={th}><TA th={th} value={f.notes || ""} onChange={set("notes")} /></Field></div>
        {isModuleEnabled("serial_tracking") && <label className={"flex items-center gap-2 text-sm " + th.text}><input type="checkbox" checked={!!f.track_serials} onChange={(e) => setF({ ...f, track_serials: e.target.checked })} className="accent-sand-500" /> {t(lang, "trackSerialNumbers")}</label>}
      </div>
      {isAdmin && <div className={"mt-3 text-sm " + th.sub}>{t(lang, "profitPerItem")} <span className="text-emerald-500 font-medium">{AED(N(f.selling_price) - N(f.cost_price))}</span></div>}
      <div className="mt-4 flex justify-end gap-2"><Btn kind="ghost" th={th} onClick={onClose}>{t(lang, "cancel")}</Btn><Btn th={th} disabled={!f.name || busy} onClick={save}>{busy ? t(lang, "savingEllipsis") : t(lang, "saveProduct")}</Btn></div>
    </Modal>
  );
}

function CustomerForm({ th, lang, edit, onDone, onClose }) {
  const [f, setF] = useState(edit ? { ...edit } : { name: "", phone: "", whatsapp: "", email: "", company: "", location: "", type: CUSTOMER_TYPES[0]?.value || "other", notes: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setBusy(true);
    const body = { name: f.name, phone: f.phone, whatsapp: f.whatsapp, email: f.email, company: f.company, location: f.location, type: f.type, notes: f.notes };
    try {
      if (edit) await api("/api/customers/" + edit.id, { method: "PATCH", body });
      else await api("/api/customers", { method: "POST", body });
      onDone();
    } catch (e) { alert(e.message); }
    setBusy(false);
  };
  return (
    <Modal title={edit ? t(lang, "editCustomer") : t(lang, "newCustomer")} onClose={onClose} th={th} wide>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t(lang, "name")} th={th}><Inp th={th} value={f.name} onChange={set("name")} /></Field>
        <Field label={t(lang, "customerType")} th={th}><Sel th={th} value={f.type} onChange={set("type")}>{CUSTOMER_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Sel></Field>
        <Field label={t(lang, "phone")} th={th}><Inp th={th} value={f.phone || ""} onChange={set("phone")} /></Field>
        <Field label={t(lang, "whatsapp")} th={th}><Inp th={th} value={f.whatsapp || ""} onChange={set("whatsapp")} /></Field>
        <Field label={t(lang, "email")} th={th}><Inp th={th} value={f.email || ""} onChange={set("email")} /></Field>
        <Field label={t(lang, "company")} th={th}><Inp th={th} value={f.company || ""} onChange={set("company")} /></Field>
        <Field label={t(lang, "location")} th={th}><Inp th={th} value={f.location || ""} onChange={set("location")} /></Field>
        <div className="sm:col-span-2"><Field label={t(lang, "notes")} th={th}><TA th={th} value={f.notes || ""} onChange={set("notes")} /></Field></div>
      </div>
      <div className="mt-4 flex justify-end gap-2"><Btn kind="ghost" th={th} onClick={onClose}>{t(lang, "cancel")}</Btn><Btn th={th} disabled={!f.name || busy} onClick={save}>{busy ? t(lang, "savingEllipsis") : t(lang, "saveCustomer")}</Btn></div>
    </Modal>
  );
}

function SaleForm({ th, lang, d, onDone, onClose }) {
  const [customer_id, setCustomer] = useState(d.customers[0]?.id || "");
  const [rows, setRows] = useState([{ product_id: d.products[0]?.id || "", quantity: 1, unit_price: N(d.products[0]?.selling_price) }]);
  const [discount, setDiscount] = useState(0);
  const [payment_status, setPS] = useState("paid");
  const [payment_method, setPM] = useState("cash");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const setRow = (i, k, v) => setRows(rows.map((r, j) => {
    if (j !== i) return r;
    const n = { ...r, [k]: v };
    if (k === "product_id") { const p = d.products.find((x) => x.id === v); n.unit_price = N(p?.selling_price); }
    return n;
  }));
  const total = Math.max(0, rows.reduce((a, r) => a + N(r.quantity) * N(r.unit_price), 0) - N(discount));
  const save = async () => {
    setBusy(true);
    try {
      const r = await api("/api/sales", { method: "POST", body: { customer_id, discount: N(discount), payment_status, payment_method, notes, items: rows.map((x) => ({ product_id: x.product_id, quantity: N(x.quantity), unit_price: N(x.unit_price) })) } });
      onDone(r.invoice?.id);
    } catch (e) { alert(e.message); setBusy(false); }
  };
  return (
    <Modal title={t(lang, "newSale")} onClose={onClose} th={th} wide>
      <div className="space-y-3">
        <Field label={t(lang, "customer")} th={th}><Sel th={th} value={customer_id} onChange={(e) => setCustomer(e.target.value)}>{d.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Sel></Field>
        <div>
          <div className={"mb-1 text-xs font-medium " + th.sub}>{t(lang, "itemsQtyPrice")}</div>
          {rows.map((r, i) => (
            <div key={i} className="mb-2 flex gap-2 items-center">
              <div className="flex-1"><Sel th={th} value={r.product_id} onChange={(e) => setRow(i, "product_id", e.target.value)}>{d.products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.quantity} {t(lang, "inStock")})</option>)}</Sel></div>
              <div className="w-16"><Inp th={th} type="number" value={r.quantity} onChange={(e) => setRow(i, "quantity", e.target.value)} /></div>
              <div className="w-24"><Inp th={th} type="number" value={r.unit_price} onChange={(e) => setRow(i, "unit_price", e.target.value)} /></div>
              {rows.length > 1 && <button className={th.sub} onClick={() => setRows(rows.filter((_, j) => j !== i))}><X size={16} /></button>}
            </div>
          ))}
          <Btn kind="ghost" th={th} small onClick={() => setRows([...rows, { product_id: d.products[0]?.id || "", quantity: 1, unit_price: N(d.products[0]?.selling_price) }])}><Plus size={14} />{t(lang, "addItem")}</Btn>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label={t(lang, "discountCurrency", { currency: config.client.currency })} th={th}><Inp th={th} type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
          <Field label={t(lang, "paymentStatus")} th={th}><Sel th={th} value={payment_status} onChange={(e) => setPS(e.target.value)}>{["paid", "partial", "unpaid"].map((s) => <option key={s} value={s}>{statusLabel(lang, cap, s)}</option>)}</Sel></Field>
          <Field label={t(lang, "method")} th={th}><Sel th={th} value={payment_method} onChange={(e) => setPM(e.target.value)}>{PAY_METHODS.map((m) => <option key={m} value={m}>{statusLabel(lang, cap, m)}</option>)}</Sel></Field>
        </div>
        <Field label={t(lang, "notes")} th={th}><TA th={th} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div className={"flex justify-between text-sm " + th.text}><span>{t(lang, "total")}</span><span className="font-semibold">{AED(total)}</span></div>
        <div className="flex justify-end gap-2"><Btn kind="ghost" th={th} onClick={onClose}>{t(lang, "cancel")}</Btn><Btn th={th} disabled={!customer_id || busy} onClick={save}>{busy ? t(lang, "savingEllipsis") : t(lang, "saveSaleCreateInvoice")}</Btn></div>
      </div>
    </Modal>
  );
}

function POForm({ th, lang, d, onDone, onClose }) {
  const [supplier_id, setSupplier] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [rows, setRows] = useState([{ product_id: d.products[0]?.id || "", item_name: "", quantity: 1, unit_cost: 0 }]);
  const [shipping_cost, setShipping] = useState(0);
  const [expected_arrival, setEta] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const itemsTotal = rows.reduce((a, r) => a + N(r.quantity) * N(r.unit_cost), 0);
  const save = async () => {
    setBusy(true);
    try {
      let sup = supplier_id;
      if (sup === "__new__" && newSupplier.trim())
        sup = (await api("/api/suppliers", { method: "POST", body: { name: newSupplier.trim() } })).id;
      await api("/api/pos", { method: "POST", body: {
        supplier_id: sup && sup !== "__new__" ? sup : null,
        shipping_cost: N(shipping_cost), expected_arrival: expected_arrival || null, notes,
        items: rows.map((r) => ({ product_id: r.product_id || null, item_name: r.product_id ? undefined : (r.item_name || "Item"), quantity: N(r.quantity), unit_cost: N(r.unit_cost) })),
      }});
      onDone();
    } catch (e) { alert(e.message); setBusy(false); }
  };
  return (
    <Modal title={t(lang, "newPO")} onClose={onClose} th={th} wide>
      <div className="space-y-3">
        <Field label={t(lang, "supplier")} th={th}>
          <Sel th={th} value={supplier_id} onChange={(e) => setSupplier(e.target.value)}>
            <option value="">—</option>
            {d.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="__new__">{t(lang, "newSupplierOption")}</option>
          </Sel>
        </Field>
        {supplier_id === "__new__" && <Field label={t(lang, "newSupplierName")} th={th}><Inp th={th} value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} placeholder={t(lang, "newSupplierPlaceholder")} /></Field>}
        <div>
          <div className={"mb-1 text-xs font-medium " + th.sub}>{t(lang, "itemsQtyUnitCost")}</div>
          {rows.map((r, i) => (
            <div key={i} className="mb-2 flex gap-2 items-center">
              <div className="flex-1"><Sel th={th} value={r.product_id} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, product_id: e.target.value } : x))}><option value="">{t(lang, "newItemOption")}</option>{d.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Sel></div>
              {!r.product_id && <div className="flex-1"><Inp th={th} placeholder={t(lang, "newItemNamePlaceholder")} value={r.item_name} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, item_name: e.target.value } : x))} /></div>}
              <div className="w-16"><Inp th={th} type="number" value={r.quantity} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} /></div>
              <div className="w-24"><Inp th={th} type="number" value={r.unit_cost} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, unit_cost: e.target.value } : x))} /></div>
              {rows.length > 1 && <button className={th.sub} onClick={() => setRows(rows.filter((_, j) => j !== i))}><X size={16} /></button>}
            </div>
          ))}
          <Btn kind="ghost" th={th} small onClick={() => setRows([...rows, { product_id: "", item_name: "", quantity: 1, unit_cost: 0 }])}><Plus size={14} />{t(lang, "addItem")}</Btn>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t(lang, "shippingCostCurrency", { currency: config.client.currency })} th={th}><Inp th={th} type="number" value={shipping_cost} onChange={(e) => setShipping(e.target.value)} /></Field>
          <Field label={t(lang, "expectedArrival")} th={th}><Inp th={th} type="date" value={expected_arrival} onChange={(e) => setEta(e.target.value)} /></Field>
        </div>
        <Field label={t(lang, "notesSupplierRef")} th={th}><TA th={th} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div className={"text-sm " + th.text}>{t(lang, "totalLandedCost")} <span className="font-semibold">{AED(itemsTotal + N(shipping_cost))}</span></div>
        <div className="flex justify-end gap-2"><Btn kind="ghost" th={th} onClick={onClose}>{t(lang, "cancel")}</Btn><Btn th={th} disabled={busy} onClick={save}>{busy ? t(lang, "savingEllipsis") : t(lang, "createPOOrdered")}</Btn></div>
      </div>
    </Modal>
  );
}

function ShipmentForm({ th, lang, d, onDone, onClose }) {
  const [refType, setRefType] = useState("sale");
  const [refId, setRefId] = useState("");
  const [f, setF] = useState({ courier: "", tracking_number: "", shipping_cost: 0, eta: "", status: "preparing", notes: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setBusy(true);
    try {
      await api("/api/shipments", { method: "POST", body: { ...(refType === "sale" ? { sale_id: refId } : { po_id: refId }), courier: f.courier, tracking_number: f.tracking_number, shipping_cost: N(f.shipping_cost), status: f.status, eta: f.eta || null, notes: f.notes } });
      onDone();
    } catch (e) { alert(e.message); setBusy(false); }
  };
  return (
    <Modal title={t(lang, "newShipment")} onClose={onClose} th={th} wide>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t(lang, "linkedTo")} th={th}><Sel th={th} value={refType} onChange={(e) => { setRefType(e.target.value); setRefId(""); }}><option value="sale">{t(lang, "customerSale")}</option><option value="po">{t(lang, "purchaseOrder")}</option></Sel></Field>
        <Field label={refType === "sale" ? t(lang, "sale") : t(lang, "purchaseOrder")} th={th}>
          <Sel th={th} value={refId} onChange={(e) => setRefId(e.target.value)}>
            <option value="">{t(lang, "select")}</option>
            {refType === "sale"
              ? d.sales.map((s) => <option key={s.id} value={s.id}>{s.customer_name} · {AED(s.total)} · {dstr(s.sale_date)}</option>)
              : d.pos.map((p) => <option key={p.id} value={p.id}>{p.po_number} · {p.supplier_name || "—"}</option>)}
          </Sel>
        </Field>
        <Field label={t(lang, "courierCompany")} th={th}><Inp th={th} value={f.courier} onChange={set("courier")} /></Field>
        <Field label={t(lang, "trackingNumber")} th={th}><Inp th={th} value={f.tracking_number} onChange={set("tracking_number")} /></Field>
        <Field label={t(lang, "shippingCostCurrency", { currency: config.client.currency })} th={th}><Inp th={th} type="number" value={f.shipping_cost} onChange={set("shipping_cost")} /></Field>
        <Field label={t(lang, "estimatedDelivery")} th={th}><Inp th={th} type="date" value={f.eta} onChange={set("eta")} /></Field>
        <div className="sm:col-span-2"><Field label={t(lang, "notes")} th={th}><TA th={th} value={f.notes} onChange={set("notes")} /></Field></div>
      </div>
      <div className="mt-4 flex justify-end gap-2"><Btn kind="ghost" th={th} onClick={onClose}>{t(lang, "cancel")}</Btn><Btn th={th} disabled={!refId || busy} onClick={save}>{busy ? t(lang, "savingEllipsis") : t(lang, "saveShipment")}</Btn></div>
    </Modal>
  );
}

function ExpenseForm({ th, lang, onDone, onClose }) {
  const [f, setF] = useState({ category: "shipping", amount: "", expense_date: today(), notes: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setBusy(true);
    try { await api("/api/expenses", { method: "POST", body: { ...f, amount: N(f.amount) } }); onDone(); }
    catch (e) { alert(e.message); setBusy(false); }
  };
  return (
    <Modal title={t(lang, "newExpense")} onClose={onClose} th={th}>
      <div className="space-y-3">
        <Field label={t(lang, "category")} th={th}><Sel th={th} value={f.category} onChange={set("category")}>{EXP_CATS.map((c) => <option key={c} value={c}>{statusLabel(lang, cap, c)}</option>)}</Sel></Field>
        <Field label={t(lang, "amountCurrency", { currency: config.client.currency })} th={th}><Inp th={th} type="number" value={f.amount} onChange={set("amount")} /></Field>
        <Field label={t(lang, "date")} th={th}><Inp th={th} type="date" value={f.expense_date} onChange={set("expense_date")} /></Field>
        <Field label={t(lang, "notes")} th={th}><TA th={th} value={f.notes} onChange={set("notes")} /></Field>
        <div className="flex justify-end gap-2"><Btn kind="ghost" th={th} onClick={onClose}>{t(lang, "cancel")}</Btn><Btn th={th} disabled={!f.amount || busy} onClick={save}>{busy ? t(lang, "savingEllipsis") : t(lang, "saveExpense")}</Btn></div>
      </div>
    </Modal>
  );
}

/* ---------------- detail modals ---------------- */
function ProductDetail({ th, lang, id, onClose, onEdit, onChanged, isAdmin }) {
  const [p, setP] = useState(null);
  const [sn, setSn] = useState("");
  const load = () => api("/api/products/" + id).then(setP).catch(() => onClose());
  useEffect(() => { load(); }, [id]);
  if (!p) return <Modal title={t(lang, "product")} onClose={onClose} th={th} wide><Spinner th={th} /></Modal>;
  const low = p.quantity <= p.min_stock;
  return (
    <Modal title={p.name} onClose={onClose} th={th} wide>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Pill v={p.category} label={catLabel(p.category)} />
        {low && <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 text-red-500 px-2 py-0.5 text-xs font-medium"><AlertTriangle size={11} />{t(lang, "lowStockBadge")}</span>}
        {p.created_by_ai && <AIBadge />}
      </div>
      <div className={"grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm " + th.text}>
        <div><div className={"text-xs " + th.sub}>{t(lang, "inStock")}</div><div className="font-semibold text-lg">{p.quantity}</div></div>
        {isAdmin && <div><div className={"text-xs " + th.sub}>{t(lang, "cost")}</div><div className="font-semibold">{AED(p.cost_price)}</div></div>}
        <div><div className={"text-xs " + th.sub}>{t(lang, "selling")}</div><div className="font-semibold">{AED(p.selling_price)}</div></div>
        {isAdmin && <div><div className={"text-xs " + th.sub}>{t(lang, "profitPerItemShort")}</div><div className="font-semibold text-emerald-500">{AED(N(p.selling_price) - N(p.cost_price))}</div></div>}
      </div>
      <div className={"mt-2 text-xs " + th.sub}>{t(lang, "skuMinStock", { sku: p.sku || "—", min: p.min_stock })}{p.notes ? " · " + p.notes : ""}</div>
      {p.track_serials && (
        <div className="mt-4">
          <div className={"text-xs font-medium mb-1 " + th.sub}>{t(lang, "serialNumbers")}</div>
          <div className="flex flex-wrap gap-1.5">
            {p.serials.map((s) => <span key={s.id} className={"rounded-md border px-2 py-1 text-xs " + th.bord + " " + (s.status === "sold" ? th.sub : th.text)}>{s.serial_number} · {statusLabel(lang, cap, s.status)}</span>)}
            {!p.serials.length && <span className={"text-xs " + th.sub}>{t(lang, "noneYet")}</span>}
          </div>
          <div className="mt-2 flex gap-2">
            <Inp th={th} placeholder={t(lang, "addSerialPlaceholder")} value={sn} onChange={(e) => setSn(e.target.value)} />
            <Btn th={th} small disabled={!sn} onClick={async () => { await api("/api/products/" + id + "/serials", { method: "POST", body: { serial_number: sn } }); setSn(""); load(); }}>{t(lang, "add")}</Btn>
          </div>
        </div>
      )}
      <div className="mt-4">
        <div className={"text-xs font-medium mb-1 " + th.sub}>{t(lang, "stockMovementHistory")}</div>
        <div className={"rounded-lg border divide-y " + th.bord + " " + th.divide}>
          {p.movements.slice(0, 8).map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className={th.text}>{statusLabel(lang, cap, m.reason)}{m.by_ai ? " · AI" : ""}</span>
              <span className={m.change > 0 ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>{m.change > 0 ? "+" : ""}{m.change}</span>
              <span className={"text-xs " + th.sub}>{dstr(m.created_at)}</span>
            </div>
          ))}
          {!p.movements.length && <Empty th={th} text={t(lang, "noMovementsYet")} />}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {isAdmin && <Btn kind="danger" th={th} small onClick={() => del("/api/products/" + id, "Delete " + p.name + "? Products with sales or order history can't be deleted.", () => { onClose(); onChanged(); })}><Trash2 size={14} />Delete</Btn>}
        <div className="ms-auto flex gap-2"><Btn kind="ghost" th={th} onClick={() => onEdit(p)}>{t(lang, "edit")}</Btn><Btn th={th} onClick={onClose}>{t(lang, "done")}</Btn></div>
      </div>
    </Modal>
  );
}

function CustomerDetail({ th, lang, id, onClose, onEdit, isAdmin, onChanged }) {
  const [c, setC] = useState(null);
  useEffect(() => { api("/api/customers/" + id).then(setC).catch(() => onClose()); }, [id]);
  if (!c) return <Modal title={t(lang, "customer")} onClose={onClose} th={th} wide><Spinner th={th} /></Modal>;
  return (
    <Modal title={c.name} onClose={onClose} th={th} wide>
      <div className="flex flex-wrap items-center gap-2 mb-3"><Pill v={c.type} label={custTypeLabel(c.type)} />{c.created_by_ai && <AIBadge />}</div>
      <div className={"text-sm space-y-0.5 " + th.sub}>
        {c.phone && <div>📞 {c.phone}</div>}{c.whatsapp && <div>💬 WhatsApp {c.whatsapp}</div>}{c.email && <div>✉️ {c.email}</div>}
        {(c.company || c.location) && <div>{[c.company, c.location].filter(Boolean).join(" · ")}</div>}
        {c.notes && <div className="italic">{c.notes}</div>}
      </div>
      <div className={"mt-3 grid grid-cols-2 gap-3 text-sm " + th.text}>
        <div><div className={"text-xs " + th.sub}>{t(lang, "totalSpent")}</div><div className="font-semibold text-lg">{AED(c.total_spent)}</div></div>
        <div><div className={"text-xs " + th.sub}>{t(lang, "outstandingBalance")}</div><div className={"font-semibold text-lg " + (N(c.outstanding) > 0 ? "text-red-500" : "text-emerald-500")}>{AED(c.outstanding)}</div></div>
      </div>
      <div className="mt-4">
        <div className={"text-xs font-medium mb-1 " + th.sub}>{t(lang, "purchaseHistory")}</div>
        <div className={"rounded-lg border divide-y " + th.bord + " " + th.divide}>
          {c.sales.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2 text-sm gap-2">
              <span className={th.sub}>{dstr(s.sale_date)}</span>
              <span className="flex items-center gap-2"><Pill v={s.payment_status} label={statusLabel(lang, cap, s.payment_status)} /><span className={"font-medium " + th.text}>{AED(s.total)}</span></span>
            </div>
          ))}
          {!c.sales.length && <Empty th={th} text={t(lang, "noPurchasesYet")} />}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {isAdmin && <Btn kind="danger" th={th} small onClick={() => del("/api/customers/" + id, "Delete " + c.name + "? Customers with sales history can't be deleted.", () => { onClose(); onChanged(); })}><Trash2 size={14} />Delete</Btn>}
        <div className="ms-auto flex gap-2"><Btn kind="ghost" th={th} onClick={() => onEdit(c)}>{t(lang, "edit")}</Btn><Btn th={th} onClick={onClose}>{t(lang, "done")}</Btn></div>
      </div>
    </Modal>
  );
}

function InvoiceView({ th, lang, d, id, onClose, onChanged, isAdmin, company }) {
  const inv = d.invoices.find((x) => x.id === id);
  if (!inv) return null;
  const tot = invoiceTotal(inv);
  const cust = inv.customer_snapshot || {};
  const shareText = encodeURIComponent(company + " — Invoice " + inv.invoice_number + "\nTotal: " + AED(tot.total) + (inv.vat_enabled ? " (incl. " + N(inv.vat_rate) + "% VAT)" : "") + "\nStatus: " + cap(inv.status) + "\nThank you for your business.");
  const patch = async (body) => { try { await api("/api/invoices/" + id, { method: "PATCH", body }); onChanged(); } catch (e) { alert(e.message); } };
  return (
    <Modal title={t(lang, "invoiceNumber", { number: inv.invoice_number })} onClose={onClose} th={th} wide>
      <div id="invoice-print" className="bg-white text-stone-900 rounded-xl p-5" dir="ltr">
        <div className="flex justify-between items-start">
          <div><div className="text-xl font-bold">{company}</div></div>
          <div className="text-right"><div className="font-semibold">{inv.invoice_number}</div><div className="text-xs text-stone-500">{dstr(inv.issued_at)}</div><div className="mt-1"><Pill v={inv.status} label={statusLabel(lang, cap, inv.status)} /></div></div>
        </div>
        <div className="mt-4 text-sm"><span className="text-stone-500">{t(lang, "billTo")} </span><span className="font-medium">{cust.name || "—"}</span>{cust.company ? " · " + cust.company : ""}{cust.phone ? " · " + cust.phone : ""}</div>
        <table className="mt-4 w-full text-sm">
          <thead><tr className="border-b border-stone-200 text-left text-xs text-stone-500"><th className="py-1.5">{t(lang, "item")}</th><th className="py-1.5 text-center">{t(lang, "qty")}</th><th className="py-1.5 text-right">{t(lang, "unitPrice")}</th><th className="py-1.5 text-right">{t(lang, "amountCol")}</th></tr></thead>
          <tbody>{(inv.items || []).map((i, k) => <tr key={k} className="border-b border-stone-100"><td className="py-2">{i.name}</td><td className="py-2 text-center">{i.quantity}</td><td className="py-2 text-right">{fmt(i.unit_price)}</td><td className="py-2 text-right">{fmt(N(i.quantity) * N(i.unit_price))}</td></tr>)}</tbody>
        </table>
        <div className="mt-3 ms-auto w-56 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-stone-500">{t(lang, "subtotal")}</span><span>{fmt(inv.subtotal)}</span></div>
          {N(inv.discount) > 0 && <div className="flex justify-between"><span className="text-stone-500">{t(lang, "discountCurrency", { currency: "" }).replace(/\s*\(\s*\)\s*$/, "")}</span><span>−{fmt(inv.discount)}</span></div>}
          {inv.vat_enabled && <div className="flex justify-between"><span className="text-stone-500">{t(lang, "vatPercent", { rate: N(inv.vat_rate) })}</span><span>{fmt(tot.vat)}</span></div>}
          <div className="flex justify-between border-t border-stone-200 pt-1 font-bold"><span>{t(lang, "total")}</span><span>{AED(tot.total)}</span></div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Btn th={th} small onClick={() => window.print()}><Printer size={14} />{t(lang, "printSavePdf")}</Btn>
        {isAdmin && <Btn kind="danger" th={th} small onClick={() => del("/api/invoices/" + id, "Delete " + inv.invoice_number + "? This also deletes its sale and puts the sold items back in stock.", () => { onClose(); onChanged(); })}><Trash2 size={14} /></Btn>}
        <a className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 text-xs font-medium" href={"https://wa.me/" + String(cust.whatsapp || cust.phone || "").replace(/\D/g, "") + "?text=" + shareText} target="_blank" rel="noreferrer">{t(lang, "shareWhatsapp")}</a>
        <a className={"inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium " + th.bord + " " + th.text} href={"mailto:" + (cust.email || "") + "?subject=Invoice " + inv.invoice_number + "&body=" + shareText}>{t(lang, "emailAction")}</a>
        {isAdmin && (
          <div className="ms-auto flex items-center gap-2">
            <label className={"flex items-center gap-1.5 text-xs " + th.sub}><input type="checkbox" checked={!!inv.vat_enabled} onChange={(e) => patch({ vat_enabled: e.target.checked })} className="accent-sand-500" />{t(lang, "vatPercent", { rate: N(inv.vat_rate) })}</label>
            <select value={inv.status} onChange={(e) => patch({ status: e.target.value })} className={inpCls(th)} style={{ width: 110 }}>
              {["draft", "unpaid", "partial", "paid", "void"].map((s) => <option key={s} value={s}>{statusLabel(lang, cap, s)}</option>)}
            </select>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ---------------- views ---------------- */
const PageHead = ({ th, title, action }) => (
  <div className="mb-3 flex items-center justify-between"><h2 className={"text-lg font-bold " + th.text}>{title}</h2>{action}</div>
);

function Dashboard({ th, lang, d, go, isAdmin }) {
  const s = d.dashboard;
  if (!s) return <Spinner th={th} />;
  const months = [...Array(6)].map((_, i) => { const dt = new Date(); dt.setMonth(dt.getMonth() - (5 - i)); return dt.toISOString().slice(0, 7); });
  const byMonth = months.map((m) => ({ m, v: N(s.monthly_sales.find((x) => x.month === m)?.revenue) }));
  const maxV = Math.max(...byMonth.map((b) => b.v), 1);
  const kpis = [
    { l: t(lang, "totalRevenue"), v: AED(s.revenue) },
    { l: t(lang, "totalSalesCount"), v: s.sales_count },
    ...(isAdmin ? [{ l: t(lang, "totalProfit"), v: AED(s.gross_profit), c: "text-emerald-500" }, { l: t(lang, "inventoryValue"), v: AED(s.inventory_value) }] : []),
    { l: t(lang, "pendingPOs"), v: s.pending_pos, go: "pos" },
    { l: t(lang, "pendingShipments"), v: s.pending_shipments, go: "shipping" },
    { l: t(lang, "unpaidInvoices"), v: s.unpaid_invoices.count + " · " + AED(s.unpaid_invoices.amount), c: s.unpaid_invoices.count ? "text-red-500" : "", go: "invoices" },
  ];
  return (
    <div>
      <PageHead th={th} title={t(lang, "navDashboard")} />
      {s.low_stock.length > 0 && (
        <button onClick={() => go("inventory")} className="mb-3 w-full text-left rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <span className="text-sm text-red-500 font-medium">{t(lang, "lowStockAlert", { list: s.low_stock.map((p) => p.name + " (" + p.quantity + ")").join(", ") })}</span>
        </button>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.l} th={th} className={"p-4 " + (k.go ? "cursor-pointer " + th.hov : "")}>
            <div onClick={() => k.go && go(k.go)}>
              <div className={"text-xs " + th.sub}>{k.l}</div>
              <div className={"mt-1 text-base sm:text-lg font-bold " + (k.c || th.text)}>{k.v}</div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card th={th} className="p-4">
          <div className={"text-sm font-semibold mb-3 " + th.text}>{t(lang, "monthlySales")}</div>
          <div className="flex items-end gap-2 h-36">
            {byMonth.map((b) => (
              <div key={b.m} className="flex-1 flex flex-col items-center gap-1">
                <div className={"text-xs " + th.sub}>{b.v ? fmt(Math.round(b.v / 1000)) + "k" : ""}</div>
                <div className="w-full rounded-t-md bg-sand-500" style={{ height: Math.max(3, (b.v / maxV) * 100) + "%" }} />
                <div className={"text-xs " + th.sub}>{new Date(b.m + "-02").toLocaleString("en", { month: "short" })}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card th={th} className="p-4">
          <div className={"text-sm font-semibold mb-2 " + th.text}>{t(lang, "bestSellingProducts")}</div>
          {s.best_sellers.map((b, i) => (
            <div key={b.name} className={"flex items-center justify-between py-1.5 text-sm border-b last:border-0 " + th.bord}>
              <span className={th.text}>{i + 1}. {b.name}</span><span className={"font-medium " + th.sub}>{t(lang, "soldCount", { n: b.qty_sold })}</span>
            </div>
          ))}
          {!s.best_sellers.length && <Empty th={th} text={t(lang, "noSalesYet")} />}
        </Card>
      </div>
    </div>
  );
}

function InventoryView({ th, lang, d, open }) {
  const [cat, setCat] = useState("all");
  const list = d.products.filter((p) => cat === "all" || p.category === cat);
  return (
    <div>
      <PageHead th={th} title={t(lang, "navInventory")} action={<Btn th={th} small onClick={() => open({ t: "productForm" })}><Plus size={14} />{t(lang, "product")}</Btn>} />
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">{["all", ...CATS].map((c) => <button key={c} onClick={() => setCat(c)} className={"rounded-full px-3 py-1 text-xs whitespace-nowrap border " + (cat === c ? "bg-sand-500 border-sand-500 text-stone-950 font-medium" : th.bord + " " + th.sub)}>{c === "all" ? t(lang, "all") : catLabel(c)}</button>)}</div>
      <Card th={th} className={"divide-y " + th.divide}>
        {list.map((p) => (
          <button key={p.id} onClick={() => open({ t: "productDetail", id: p.id })} className={"w-full text-left px-4 py-3 flex items-center gap-3 " + th.hov}>
            <div className="flex-1 min-w-0">
              <div className={"font-medium truncate " + th.text}>{p.name} {p.created_by_ai && <AIBadge />}</div>
              <div className={"text-xs " + th.sub}>{catLabel(p.category)} · {p.sku || t(lang, "noSku")} · {t(lang, "sellPrefix")} {fmt(p.selling_price)}</div>
            </div>
            <div className="text-right">
              <div className={"font-bold " + (p.quantity <= p.min_stock ? "text-red-500" : th.text)}>{p.quantity}</div>
              <div className={"text-xs " + th.sub}>{t(lang, "inStock")}</div>
            </div>
            <ChevronRight size={16} className={th.sub + " rtl:rotate-180"} />
          </button>
        ))}
        {!list.length && <Empty th={th} text={t(lang, "noProductsInCategory")} />}
      </Card>
    </div>
  );
}

function SalesView({ th, lang, d, open, reload, isAdmin }) {
  const setPay = async (s, status) => { try { await api("/api/sales/" + s.id, { method: "PATCH", body: { payment_status: status } }); reload(); } catch (e) { alert(e.message); } };
  return (
    <div>
      <PageHead th={th} title={t(lang, "navSales")} action={<Btn th={th} small onClick={() => open({ t: "saleForm" })}><Plus size={14} />{t(lang, "sale")}</Btn>} />
      <Card th={th} className={"divide-y " + th.divide}>
        {d.sales.map((s) => (
          <div key={s.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className={"font-medium " + th.text}>{s.customer_name} {s.created_by_ai && <AIBadge />}</div>
              <div className={"font-bold " + th.text}>{AED(s.total)}</div>
            </div>
            <div className={"mt-0.5 text-xs " + th.sub}>{(s.items || []).map((i) => i.quantity + "× " + i.name).join(", ")} · {dstr(s.sale_date)} · {statusLabel(lang, cap, s.payment_method)}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <select value={s.payment_status} onChange={(e) => setPay(s, e.target.value)} className={"rounded-full px-2 py-0.5 text-xs font-medium border " + th.bord + " " + th.inp} style={{ width: "auto" }}>
                {["paid", "partial", "unpaid"].map((x) => <option key={x} value={x}>{statusLabel(lang, cap, x)}</option>)}
              </select>
              {s.invoice_id && <button onClick={() => open({ t: "invoice", id: s.invoice_id })} className="rounded-full bg-sand-500/15 text-sand-500 px-2 py-0.5 text-xs font-medium">{s.invoice_number}</button>}
              {isAdmin && <button onClick={() => del("/api/sales/" + s.id, "Delete this sale to " + s.customer_name + "? Its invoice is removed and stock is restored.", reload)} className="ms-auto text-red-500/70 hover:text-red-500"><Trash2 size={15} /></button>}
            </div>
          </div>
        ))}
        {!d.sales.length && <Empty th={th} text={t(lang, "noSalesYetHint")} />}
      </Card>
    </div>
  );
}

function CustomersView({ th, lang, d, open }) {
  return (
    <div>
      <PageHead th={th} title={t(lang, "navCustomers")} action={<Btn th={th} small onClick={() => open({ t: "customerForm" })}><Plus size={14} />{t(lang, "customer")}</Btn>} />
      <Card th={th} className={"divide-y " + th.divide}>
        {d.customers.map((c) => (
          <button key={c.id} onClick={() => open({ t: "customerDetail", id: c.id })} className={"w-full text-left px-4 py-3 flex items-center gap-3 " + th.hov}>
            <div className="flex-1 min-w-0">
              <div className={"font-medium truncate " + th.text}>{c.name} {c.created_by_ai && <AIBadge />}</div>
              <div className={"text-xs " + th.sub}>{custTypeLabel(c.type)}{c.location ? " · " + c.location : ""}{c.phone ? " · " + c.phone : ""}</div>
            </div>
            <ChevronRight size={16} className={th.sub + " rtl:rotate-180"} />
          </button>
        ))}
        {!d.customers.length && <Empty th={th} text={t(lang, "noCustomersYet")} />}
      </Card>
    </div>
  );
}

function InvoicesView({ th, lang, d, open }) {
  return (
    <div>
      <PageHead th={th} title={t(lang, "navInvoices")} />
      <Card th={th} className={"divide-y " + th.divide}>
        {d.invoices.map((inv) => (
          <button key={inv.id} onClick={() => open({ t: "invoice", id: inv.id })} className={"w-full text-left px-4 py-3 flex items-center gap-3 " + th.hov}>
            <div className="flex-1"><div className={"font-medium " + th.text}>{inv.invoice_number}</div><div className={"text-xs " + th.sub}>{inv.customer_snapshot?.name || "—"} · {dstr(inv.issued_at)}</div></div>
            <Pill v={inv.status} label={statusLabel(lang, cap, inv.status)} />
            <div className={"font-semibold " + th.text}>{AED(invoiceTotal(inv).total)}</div>
          </button>
        ))}
        {!d.invoices.length && <Empty th={th} text={t(lang, "invoicesAutoHint")} />}
      </Card>
    </div>
  );
}

function POView({ th, lang, d, open, reload, isAdmin }) {
  const [receiving, setReceiving] = useState(null); // po id pending cost question
  const receive = async (po, updateCost) => {
    setReceiving(null);
    try { await api("/api/pos/" + po.id + "/receive", { method: "POST", body: { update_cost_price: updateCost } }); reload(); }
    catch (e) { alert(e.message); }
  };
  const setStatus = async (po, status) => {
    if (status === "received") return setReceiving(po.id);
    try { await api("/api/pos/" + po.id, { method: "PATCH", body: { status } }); reload(); } catch (e) { alert(e.message); }
  };
  return (
    <div>
      <PageHead th={th} title={t(lang, "navPOs")} action={<Btn th={th} small onClick={() => open({ t: "poForm" })}><Plus size={14} />{t(lang, "po")}</Btn>} />
      <div className="space-y-3">
        {d.pos.map((po) => (
          <Card key={po.id} th={th} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className={"font-semibold " + th.text}>{po.po_number} · {po.supplier_name || "—"} {po.created_by_ai && <AIBadge />}</div>
              <div className="flex items-center gap-2"><Pill v={po.status} label={statusLabel(lang, cap, po.status)} />
                {isAdmin && <button onClick={() => del("/api/pos/" + po.id, "Delete " + po.po_number + "?", reload)} className="text-red-500/70 hover:text-red-500"><Trash2 size={15} /></button>}
              </div>
            </div>
            <div className={"mt-1 text-xs " + th.sub}>{(po.items || []).map((i) => i.quantity + "× " + i.item_name + (isAdmin ? " @ " + fmt(i.unit_cost) : "")).join(", ")}</div>
            {isAdmin && <div className={"mt-2 text-sm " + th.text}>{t(lang, "shippingCostCurrency", { currency: "" }).replace(/\s*\(\s*\)\s*$/, "")} {AED(po.shipping_cost)} · <span className="font-bold">{AED(po.landed_cost)}</span></div>}
            {po.expected_arrival && <div className={"text-xs " + th.sub}>{t(lang, "expectedArrival")}: {dstr(po.expected_arrival)}</div>}
            {po.notes && <div className={"text-xs italic " + th.sub}>{po.notes}</div>}
            {receiving === po.id ? (
              <div className={"mt-3 rounded-lg border p-3 text-sm " + th.bord + " " + th.text}>
                {t(lang, "updateCostQuestion")}
                <div className="mt-2 flex gap-2">
                  <Btn th={th} small onClick={() => receive(po, true)}>{t(lang, "yesUpdateCosts")}</Btn>
                  <Btn kind="ghost" th={th} small onClick={() => receive(po, false)}>{t(lang, "noJustAddStock")}</Btn>
                  <Btn kind="ghost" th={th} small onClick={() => setReceiving(null)}>{t(lang, "cancel")}</Btn>
                </div>
              </div>
            ) : po.status !== "received" && po.status !== "cancelled" && (
              <div className="mt-3 flex items-center gap-2">
                <select value={po.status} onChange={(e) => setStatus(po, e.target.value)} className={inpCls(th)} style={{ maxWidth: 140 }}>
                  {PO_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(lang, cap, s)}</option>)}
                </select>
                <Btn th={th} small onClick={() => setReceiving(po.id)}><Check size={14} />{t(lang, "markReceivedToStock")}</Btn>
              </div>
            )}
          </Card>
        ))}
        {!d.pos.length && <Empty th={th} text={t(lang, "noPOsYet")} />}
      </div>
    </div>
  );
}

function ShippingView({ th, lang, d, open, reload, isAdmin }) {
  const setStatus = async (sh, status) => { try { await api("/api/shipments/" + sh.id, { method: "PATCH", body: { status } }); reload(); } catch (e) { alert(e.message); } };
  return (
    <div>
      <PageHead th={th} title={t(lang, "navShipping")} action={<Btn th={th} small onClick={() => open({ t: "shipForm" })}><Plus size={14} />{t(lang, "shipment")}</Btn>} />
      <Card th={th} className={"divide-y " + th.divide}>
        {d.shipments.map((sh) => (
          <div key={sh.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className={"font-medium " + th.text}>{sh.shipment_number} {sh.created_by_ai && <AIBadge />}</div>
              <div className="flex items-center gap-2">
                <select value={sh.status} onChange={(e) => setStatus(sh, e.target.value)} className={inpCls(th)} style={{ maxWidth: 130 }}>
                  {SHIP_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(lang, cap, s)}</option>)}
                </select>
                {isAdmin && <button onClick={() => del("/api/shipments/" + sh.id, "Delete " + sh.shipment_number + "?", reload)} className="text-red-500/70 hover:text-red-500"><Trash2 size={15} /></button>}
              </div>
            </div>
            <div className={"mt-0.5 text-xs " + th.sub}>
              {sh.customer_name ? t(lang, "sale") + " · " + sh.customer_name : sh.po_number ? t(lang, "po") + " · " + sh.po_number : ""}
              {sh.courier ? " · " + sh.courier : ""}{sh.tracking_number ? " · " + sh.tracking_number : ""}{sh.eta ? " · ETA " + dstr(sh.eta) : ""}{N(sh.shipping_cost) ? " · " + AED(sh.shipping_cost) : ""}
            </div>
          </div>
        ))}
        {!d.shipments.length && <Empty th={th} text={t(lang, "noShipmentsYet")} />}
      </Card>
    </div>
  );
}

function ExpensesView({ th, lang, d, open, reload, isAdmin }) {
  const total = d.expenses.reduce((a, e) => a + N(e.amount), 0);
  return (
    <div>
      <PageHead th={th} title={t(lang, "navExpenses")} action={<Btn th={th} small onClick={() => open({ t: "expForm" })}><Plus size={14} />{t(lang, "expense")}</Btn>} />
      <Card th={th} className="p-4 mb-3"><div className={"text-xs " + th.sub}>{t(lang, "totalExpenses")}</div><div className={"text-lg font-bold " + th.text}>{AED(total)}</div></Card>
      <Card th={th} className={"divide-y " + th.divide}>
        {d.expenses.map((e) => (
          <div key={e.id} className="px-4 py-3 flex items-center justify-between gap-2">
            <div><div className={"font-medium " + th.text}>{statusLabel(lang, cap, e.category)} {e.created_by_ai && <AIBadge />}</div><div className={"text-xs " + th.sub}>{dstr(e.expense_date)}{e.notes ? " · " + e.notes : ""}</div></div>
            <div className="flex items-center gap-2">
              <div className="font-semibold text-red-500">−{AED(e.amount)}</div>
              {isAdmin && <button onClick={() => del("/api/expenses/" + e.id, "Delete this " + cap(e.category) + " expense of " + AED(e.amount) + "?", reload)} className="text-red-500/70 hover:text-red-500"><Trash2 size={15} /></button>}
            </div>
          </div>
        ))}
        {!d.expenses.length && <Empty th={th} text={t(lang, "noExpensesRecorded")} />}
      </Card>
    </div>
  );
}

function ReportsView({ th, lang }) {
  const [month, setMonth] = useState(today().slice(0, 7));
  const [r, setR] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { setR(null); api("/api/reports/monthly?month=" + month).then(setR).catch((e) => setErr(e.message)); }, [month]);
  const exportCSV = () => {
    if (!r) return;
    let csv = config.client.business_name + " - Report " + r.month + "\n\nSummary\nRevenue," + r.revenue + "\nGross profit," + r.gross_profit + "\nExpenses," + r.expense_total + "\nNet profit," + r.net_profit + "\n\nSales by product\nProduct,Qty,Revenue,Profit,Margin %\n";
    r.by_product.forEach((p) => { csv += '"' + p.name + '",' + p.qty + "," + p.revenue + "," + p.profit + "," + (N(p.revenue) ? (N(p.profit) / N(p.revenue) * 100).toFixed(1) : 0) + "\n"; });
    csv += "\nSales by customer\nCustomer,Revenue\n";
    r.by_customer.forEach((c) => { csv += '"' + c.name + '",' + c.revenue + "\n"; });
    csv += "\nExpenses by category\nCategory,Amount\n";
    r.expenses_by_category.forEach((e) => { csv += e.category + "," + e.amount + "\n"; });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = config.client.slug + "-report-" + r.month + ".csv";
    a.click();
  };
  const Tbl = ({ title, rows }) => (
    <Card th={th} className="p-4">
      <div className={"text-sm font-semibold mb-2 " + th.text}>{title}</div>
      {rows.map(([l, v], i) => <div key={i} className={"flex justify-between py-1 text-sm border-b last:border-0 " + th.bord}><span className={th.sub + " truncate me-3"}>{l}</span><span className={"font-medium whitespace-nowrap " + th.text}>{v}</span></div>)}
      {!rows.length && <Empty th={th} text={t(lang, "noDataThisMonth")} />}
    </Card>
  );
  if (err) return <div className={"text-sm " + th.sub}>{err}</div>;
  return (
    <div>
      <PageHead th={th} title={t(lang, "navReports")} action={<Btn th={th} small onClick={exportCSV} disabled={!r}>{t(lang, "exportExcel")}</Btn>} />
      <div className="mb-3 flex items-center gap-2">
        <Inp th={th} type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ maxWidth: 170 }} />
        <Btn kind="ghost" th={th} small onClick={() => window.print()}><Printer size={14} />{t(lang, "pdf")}</Btn>
      </div>
      {!r ? <Spinner th={th} /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <Card th={th} className="p-4"><div className={"text-xs " + th.sub}>{t(lang, "revenue")}</div><div className={"font-bold " + th.text}>{AED(r.revenue)}</div></Card>
            <Card th={th} className="p-4"><div className={"text-xs " + th.sub}>{t(lang, "grossProfit")}</div><div className="font-bold text-emerald-500">{AED(r.gross_profit)}</div></Card>
            <Card th={th} className="p-4"><div className={"text-xs " + th.sub}>{t(lang, "expensesLabel")}</div><div className="font-bold text-red-500">{AED(r.expense_total)}</div></Card>
            <Card th={th} className="p-4"><div className={"text-xs " + th.sub}>{t(lang, "netProfit")}</div><div className={"font-bold " + (r.net_profit >= 0 ? "text-emerald-500" : "text-red-500")}>{AED(r.net_profit)}</div></Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Tbl title={t(lang, "salesByProductMargin")} rows={r.by_product.map((p) => [p.name, p.qty + " · " + fmt(p.revenue) + " · " + (N(p.revenue) ? (N(p.profit) / N(p.revenue) * 100).toFixed(0) : 0) + "%"])} />
            <Tbl title={t(lang, "salesByCustomer")} rows={r.by_customer.map((c) => [c.name, AED(c.revenue)])} />
            <Tbl title={t(lang, "expensesByCategory")} rows={r.expenses_by_category.map((e) => [statusLabel(lang, cap, e.category), AED(e.amount)])} />
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Hadad Agent ---------------- */
function AgentView({ th, lang, chat, setChat, reload }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);
  const endRef = useRef(null);
  useEffect(() => { api("/api/ai-log").then(setLog).catch(() => {}); }, [chat.length]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, busy]);
  const send = async (text) => {
    const m = (text ?? msg).trim();
    if (!m || busy) return;
    setMsg("");
    setChat((c) => [...c, { role: "user", text: m }]);
    setBusy(true);
    try {
      const r = await api("/api/agent/message", { method: "POST", body: { text: m } });
      setChat((c) => [...c, { role: "agent", text: r.reply }]);
      reload();
    } catch (e) {
      setChat((c) => [...c, { role: "agent", text: t(lang, "agentErrorPrefix", { error: e.message }) }]);
    }
    setBusy(false);
  };
  const last = chat[chat.length - 1];
  const askingConfirm = !busy && last?.role === "agent" && /reply yes/i.test(last.text);
  const chips = [
    ...(isModuleEnabled("sales") ? [`Sold 2 units to Ahmed for 650 ${config.client.currency} each, paid cash`] : []),
    ...(isModuleEnabled("purchase_orders") ? [`Ordered 30 units from a supplier, 120 ${config.client.currency} each, shipping 300`] : []),
    ...(isModuleEnabled("purchase_orders") ? ["Received the last shipment"] : []),
    ...(isModuleEnabled("inventory") ? ["How many are left in stock?"] : []),
    ...(isModuleEnabled("customers") ? ["Add customer Khalid, 0551112222"] : []),
  ];
  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 200px)", minHeight: 420 }}>
      <PageHead th={th} title={t(lang, "navAgent")} />
      <div className={"text-xs mb-2 " + th.sub}>{t(lang, "agentHint")}</div>
      <Card th={th} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!chat.length && (
            <div className="space-y-2">
              <div className={"text-sm " + th.sub}>{t(lang, "tryOneOfThese")}</div>
              {chips.map((c) => <button key={c} onClick={() => send(c)} className={"block w-full text-left rounded-lg border px-3 py-2 text-sm " + th.bord + " " + th.text + " " + th.hov}>{c}</button>)}
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={"max-w-xs sm:max-w-md rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap " + (m.role === "user" ? "bg-sand-500 text-stone-950 rounded-br-sm" : "rounded-bl-sm " + (th.dark ? "bg-violet-500/15 text-violet-200" : "bg-violet-100 text-violet-900"))}>
                {m.role === "agent" && <div className="flex items-center gap-1 mb-1 text-xs font-semibold opacity-80"><Bot size={12} />{t(lang, "navAgent")}</div>}
                {m.text}
              </div>
            </div>
          ))}
          {askingConfirm && (
            <div className="flex gap-2 ps-1">
              <button onClick={() => send("yes")} className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-medium">{t(lang, "confirmYes")}</button>
              <button onClick={() => send("no")} className="rounded-lg bg-red-600 text-white px-3 py-1.5 text-xs font-medium">{t(lang, "cancelNo")}</button>
            </div>
          )}
          {busy && <div className={"text-sm " + th.sub}>{t(lang, "agentThinking")}</div>}
          <div ref={endRef} />
        </div>
        <div className={"border-t p-3 flex gap-2 " + th.bord}>
          <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={t(lang, "agentPlaceholder")} className={inpCls(th)} />
          <Btn th={th} disabled={busy || !msg.trim()} onClick={() => send()}><Send size={15} /></Btn>
        </div>
      </Card>
      {log.length > 0 && (
        <div className="mt-3">
          <div className={"text-xs font-medium mb-1 " + th.sub}>{t(lang, "aiActivityLog")}</div>
          <Card th={th} className={"divide-y max-h-40 overflow-y-auto " + th.divide}>
            {log.map((l) => (
              <div key={l.id} className="px-3 py-2 text-xs">
                <div className="flex justify-between gap-2"><span className={"font-medium truncate " + th.text}>{l.message_text}</span><Pill v={l.status} label={statusLabel(lang, cap, l.status)} /></div>
                <div className={"truncate " + th.sub}>{dstr(l.created_at)} · {statusLabel(lang, cap, l.source)}{l.reply_sent ? " · " + l.reply_sent.split("\n")[0] : ""}</div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

/* ---------------- change own password (any role) ---------------- */
function ChangePasswordCard({ th, lang }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setMsg(""); setOk(false);
    if (next.length < 8) { setMsg(t(lang, "passwordMinLength")); return; }
    if (next !== confirm) { setMsg(t(lang, "passwordsDontMatch")); return; }
    setBusy(true);
    try {
      await api("/api/auth/change-password", { method: "POST", body: { current_password: cur, new_password: next } });
      setCur(""); setNext(""); setConfirm(""); setMsg(t(lang, "passwordChanged")); setOk(true);
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  };
  return (
    <Card th={th} className="p-4 space-y-3">
      <div className={"text-sm font-semibold flex items-center gap-2 " + th.text}><Lock size={14} />{t(lang, "changePassword")}</div>
      <Field label={t(lang, "currentPassword")} th={th}><Inp th={th} type="password" value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
      <Field label={t(lang, "newPassword")} th={th}><Inp th={th} type="password" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
      <Field label={t(lang, "confirmNewPassword")} th={th}><Inp th={th} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
      {msg && <div className={"text-xs " + (ok ? "text-emerald-500" : "text-red-500")}>{msg}</div>}
      <Btn th={th} small disabled={busy || !cur || next.length < 8 || next !== confirm} onClick={submit}><Lock size={14} />{t(lang, "changePassword")}</Btn>
    </Card>
  );
}

/* ---------------- settings (admin) ---------------- */
function SettingsView({ th, lang, setLang, user, onLogout }) {
  const [s, setS] = useState(null);
  const [users, setUsers] = useState([]);
  const [nu, setNu] = useState({ email: "", password: "", name: "", role: "staff" });
  const isAdmin = user.role === "admin";
  const load = () => {
    api("/api/settings").then(setS).catch(() => {});
    if (isAdmin) api("/api/users").then(setUsers).catch(() => {});
  };
  useEffect(load, []);
  const patch = async (body) => { try { setS(await api("/api/settings", { method: "PATCH", body })); } catch (e) { alert(e.message); } };
  const addUser = async () => {
    try { await api("/api/users", { method: "POST", body: nu }); setNu({ email: "", password: "", name: "", role: "staff" }); load(); }
    catch (e) { alert(e.message); }
  };
  const toggleUser = async (u) => { try { await api("/api/users/" + u.id, { method: "PATCH", body: { is_active: !u.is_active } }); load(); } catch (e) { alert(e.message); } };
  return (
    <div>
      <PageHead th={th} title={t(lang, "navSettings")} />
      <div className="space-y-3 max-w-lg">
        <Card th={th} className="p-4 space-y-3">
          <div className={"text-sm font-semibold " + th.text}>{t(lang, "signedInAs")}</div>
          <div className={"text-sm " + th.sub}>{user.name} · {user.email} · <Pill v={user.role} label={statusLabel(lang, cap, user.role)} /></div>
          <div className="flex items-center gap-2">
            <Btn kind="ghost" th={th} small onClick={onLogout}><LogOut size={14} />{t(lang, "signOut")}</Btn>
            <Btn kind="ghost" th={th} small onClick={() => setLang(lang === "ar" ? "en" : "ar")}><Languages size={14} />{t(lang, "languageToggle")}</Btn>
          </div>
        </Card>
        <ChangePasswordCard th={th} lang={lang} />
        {isAdmin && s && (
          <Card th={th} className="p-4 space-y-3">
            <div className={"text-sm font-semibold " + th.text}>{t(lang, "companyVat")}</div>
            <Field label={t(lang, "companyName")} th={th}><Inp th={th} defaultValue={s.company_name} onBlur={(e) => e.target.value !== s.company_name && patch({ company_name: e.target.value })} /></Field>
            <label className={"flex items-center gap-2 text-sm " + th.text}>
              <input type="checkbox" checked={!!s.vat_enabled_default} onChange={(e) => patch({ vat_enabled_default: e.target.checked })} className="accent-sand-500" />
              {t(lang, "applyVatDefault", { rate: N(s.vat_rate) })}
            </label>
            <Field label={t(lang, "vatRatePercent")} th={th}><Inp th={th} type="number" defaultValue={s.vat_rate} onBlur={(e) => N(e.target.value) !== N(s.vat_rate) && patch({ vat_rate: N(e.target.value) })} /></Field>
          </Card>
        )}
        {isAdmin && (
          <Card th={th} className="p-4 space-y-3">
            <div className={"text-sm font-semibold " + th.text}>{t(lang, "teamAccounts")}</div>
            {users.map((u) => (
              <div key={u.id} className={"flex items-center justify-between text-sm border-b last:border-0 pb-2 " + th.bord}>
                <div><span className={th.text}>{u.name}</span> <span className={"text-xs " + th.sub}>{u.email}</span> <Pill v={u.role} label={statusLabel(lang, cap, u.role)} /></div>
                {u.id !== user.id && (
                  <div className="flex gap-1.5">
                    <Btn kind="ghost" th={th} small onClick={() => toggleUser(u)}>{u.is_active ? t(lang, "deactivate") : t(lang, "activate")}</Btn>
                    <Btn kind="danger" th={th} small onClick={() => del("/api/users/" + u.id, "Delete the account for " + u.name + " (" + u.email + ")? They will no longer be able to sign in.", load)}><Trash2 size={13} /></Btn>
                  </div>
                )}
              </div>
            ))}
            <div className={"text-xs font-medium pt-1 " + th.sub}>{t(lang, "addTeamMember")}</div>
            <div className="grid grid-cols-2 gap-2">
              <Inp th={th} placeholder={t(lang, "namePlaceholder")} value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} />
              <Inp th={th} placeholder={t(lang, "email")} value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} />
              <Inp th={th} placeholder={t(lang, "passwordPlaceholderMin")} type="password" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} />
              <Sel th={th} value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}><option value="staff">{statusLabel(lang, cap, "staff")}</option><option value="admin">{statusLabel(lang, cap, "admin")}</option></Sel>
            </div>
            <Btn th={th} small disabled={!nu.email || !nu.name || nu.password.length < 8} onClick={addUser}><UserPlus size={14} />{t(lang, "addAccount")}</Btn>
            <div className={"text-xs " + th.sub}>{t(lang, "staffPermissionHint")}</div>
          </Card>
        )}
        <div className={"text-xs text-center " + th.sub}>{t(lang, "appVersion", { v: config.template_version })}</div>
      </div>
    </div>
  );
}

/* ---------------- app shell ---------------- */
const NAV = [
  { id: "dashboard", labelKey: "navDashboard", icon: LayoutDashboard },
  { id: "sales", labelKey: "navSales", icon: ShoppingCart, module: "sales" },
  { id: "inventory", labelKey: "navInventory", icon: Package, module: "inventory" },
  { id: "customers", labelKey: "navCustomers", icon: Users, module: "customers" },
  { id: "invoices", labelKey: "navInvoices", icon: FileText, module: "invoices" },
  { id: "pos", labelKey: "navPOs", icon: ClipboardList, module: "purchase_orders" },
  { id: "shipping", labelKey: "navShipping", icon: Truck, module: "shipping" },
  { id: "expenses", labelKey: "navExpenses", icon: Wallet, module: "expenses" },
  { id: "reports", labelKey: "navReports", icon: BarChart3, admin: true, module: "reports" },
  { id: "agent", labelKey: "navAgent", icon: Bot, module: "agent" },
  { id: "settings", labelKey: "navSettings", icon: Settings },
];
const MOBILE_TABS = ["dashboard", "sales", "inventory", "agent"];

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(hasToken());
  const [d, setD] = useState(null);
  const [view, setView] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [chat, setChat] = useState([]);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("ahq_theme");
    return stored ? stored !== "light" : config.branding.theme_default !== "light";
  });
  const [lang, setLangState] = useState(() => localStorage.getItem(LANG_KEY) || "en");
  const setLang = (l) => { setLangState(l); try { localStorage.setItem(LANG_KEY, l); } catch {} };
  const [loadErr, setLoadErr] = useState("");
  const searchTimer = useRef(null);

  // Branding (Factory Spec §3): override the Tailwind CSS variables the
  // "sand"/"stone-950" utility classes read from, so a config swap changes
  // the whole app's look with no rebuild.
  useEffect(() => {
    const shades = brandShades(config.branding.color_primary);
    const root = document.documentElement.style;
    root.setProperty("--color-sand-100", shades[100]);
    root.setProperty("--color-sand-400", shades[400]);
    root.setProperty("--color-sand-500", shades[500]);
    root.setProperty("--color-sand-600", shades[600]);
    root.setProperty("--color-stone-950", config.branding.color_bg_dark);
    document.title = config.client.business_name;
  }, []);

  // RTL (Factory Spec bilingual support): dir on the root drives CSS
  // logical-property utilities (ms-/me-/ps-/pe-/border-e/start-/end-)
  // used throughout this file, and flexbox's `row` main-axis direction
  // mirrors automatically under RTL — physical utilities were
  // deliberately replaced with logical ones so this one attribute is
  // enough, no per-component conditional classes needed.
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!hasToken()) return;
    api("/api/auth/me").then((u) => { setUser(u); setChecking(false); }).catch(() => { clearToken(); setChecking(false); });
  }, []);

  const reload = async () => {
    try {
      // Dashboard is the one hard dependency (its failure means "can't reach
      // the server" — show the retry screen). Everything else is fetched
      // sequentially, not as one big Promise.all burst: firing ~9 concurrent
      // cross-origin requests (each needing its own CORS preflight) at once
      // can overwhelm a free-tier backend dyno and cause a handful to fail —
      // and each is independently non-fatal here, so one flaky endpoint no
      // longer blanks the entire app behind a "couldn't reach server" screen.
      const dashboard = await api("/api/dashboard");
      const settings = await api("/api/settings").catch(() => ({ company_name: config.client.business_name }));
      const out = { dashboard, settings };
      const optional = [];
      if (isModuleEnabled("inventory")) optional.push(["products", "/api/products"], ["suppliers", "/api/suppliers"]);
      if (isModuleEnabled("customers")) optional.push(["customers", "/api/customers"]);
      if (isModuleEnabled("sales")) optional.push(["sales", "/api/sales"]);
      if (isModuleEnabled("invoices")) optional.push(["invoices", "/api/invoices"]);
      if (isModuleEnabled("purchase_orders")) optional.push(["pos", "/api/pos"]);
      if (isModuleEnabled("shipping")) optional.push(["shipments", "/api/shipments"]);
      if (isModuleEnabled("expenses")) optional.push(["expenses", "/api/expenses"]);
      for (const [key, path] of optional) {
        try { out[key] = await api(path); } catch { /* leave the default below — a single flaky endpoint shouldn't blank the app */ }
      }
      setD({ products: [], customers: [], suppliers: [], sales: [], invoices: [], pos: [], shipments: [], expenses: [], ...out });
      setLoadErr("");
    } catch (e) { setLoadErr(e.message); }
  };
  useEffect(() => { if (user) reload(); }, [user]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (q.trim().length < 2) { setResults([]); return; }
    searchTimer.current = setTimeout(() => api("/api/search?q=" + encodeURIComponent(q.trim())).then(setResults).catch(() => {}), 250);
  }, [q]);

  const th = dark
    ? { dark: true, bg: "bg-stone-950", card: "bg-stone-900", bord: "border-stone-800", divide: "divide-stone-800", text: "text-stone-100", sub: "text-stone-400", inp: "bg-stone-800 border-stone-700 text-stone-100 placeholder-stone-500", hov: "hover:bg-stone-800" }
    : { dark: false, bg: "bg-stone-100", card: "bg-white", bord: "border-stone-200", divide: "divide-stone-200", text: "text-stone-900", sub: "text-stone-500", inp: "bg-white border-stone-300 text-stone-900 placeholder-stone-400", hov: "hover:bg-stone-50" };

  if (checking) return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400 text-sm">{t(lang, "loading")}</div>;
  if (!user) return <Login onLogin={setUser} lang={lang} setLang={setLang} />;

  const isAdmin = user.role === "admin";
  const go = (v) => { setView(v); setMoreOpen(false); };
  const open = (m) => setModal(m);
  const openResult = (r) => {
    setQ(""); setResults([]);
    if (r.kind === "customer") setModal({ t: "customerDetail", id: r.id });
    else if (r.kind === "product") setModal({ t: "productDetail", id: r.id });
    else if (r.kind === "invoice") setModal({ t: "invoice", id: r.id });
    else if (r.kind === "po") go("pos");
    else if (r.kind === "shipment") go("shipping");
  };
  const nav = [...NAV.filter((n) => (!n.admin || isAdmin) && (!n.module || isModuleEnabled(n.module))), ...customNav];
  const mobileTabIds = MOBILE_TABS.filter((id) => nav.some((n) => n.id === id));

  // Factory suspension gate (Factory Spec §9): once the orchestrator flips
  // subscription_status to 'suspended', the whole app is replaced by a
  // friendly paywall screen. The backend independently blocks every write.
  if (d?.settings?.subscription_status === "suspended") {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-stone-800 bg-stone-900 p-6 text-center">
          <Lock size={28} className="mx-auto mb-3 text-sand-500" />
          <div className="font-bold text-stone-100 mb-1">{t(lang, "subscriptionSuspended")}</div>
          <div className="text-sm text-stone-400 mb-4">{t(lang, "subscriptionSuspendedHint", { business: config.client.business_name })}</div>
          <Btn th={{ bord: "border-stone-800", text: "text-stone-100", hov: "hover:bg-stone-800" }} kind="ghost" onClick={() => { clearToken(); location.reload(); }}><LogOut size={14} />{t(lang, "signOut")}</Btn>
        </div>
      </div>
    );
  }

  const body = !d ? (loadErr
    ? <div className="py-16 text-center"><div className={"text-sm mb-3 " + th.sub}>{t(lang, "couldntReachServer", { error: loadErr })}</div><Btn th={th} onClick={reload}>{t(lang, "retry")}</Btn></div>
    : <Spinner th={th} />)
    : {
      dashboard: <Dashboard th={th} lang={lang} d={d} go={go} isAdmin={isAdmin} />,
      ...(isModuleEnabled("inventory") && { inventory: <InventoryView th={th} lang={lang} d={d} open={open} /> }),
      ...(isModuleEnabled("sales") && { sales: <SalesView th={th} lang={lang} d={d} open={open} reload={reload} isAdmin={isAdmin} /> }),
      ...(isModuleEnabled("customers") && { customers: <CustomersView th={th} lang={lang} d={d} open={open} /> }),
      ...(isModuleEnabled("invoices") && { invoices: <InvoicesView th={th} lang={lang} d={d} open={open} /> }),
      ...(isModuleEnabled("purchase_orders") && { pos: <POView th={th} lang={lang} d={d} open={open} reload={reload} isAdmin={isAdmin} /> }),
      ...(isModuleEnabled("shipping") && { shipping: <ShippingView th={th} lang={lang} d={d} open={open} reload={reload} isAdmin={isAdmin} /> }),
      ...(isModuleEnabled("expenses") && { expenses: <ExpensesView th={th} lang={lang} d={d} open={open} reload={reload} isAdmin={isAdmin} /> }),
      reports: isAdmin && isModuleEnabled("reports") ? <ReportsView th={th} lang={lang} /> : null,
      ...(isModuleEnabled("agent") && { agent: <AgentView th={th} lang={lang} chat={chat} setChat={setChat} reload={reload} /> }),
      settings: <SettingsView th={th} lang={lang} setLang={setLang} user={user} onLogout={() => { clearToken(); location.reload(); }} />,
      ...Object.fromEntries(Object.entries(customRoutes).map(([id, render]) => [id, render({ th, d, open, reload, isAdmin, user })])),
    }[view];

  return (
    <div className={"min-h-screen " + th.bg}>
      {/* header */}
      <header className={"sticky top-0 z-40 border-b " + th.bord + " " + th.card}>
        <div className="mx-auto max-w-6xl px-4 py-2.5 flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <img src={"/" + config.branding.logo_file} alt={config.client.business_name} className="h-8 w-auto" />
            <div className="hidden sm:block">
              <div className={"text-sm font-bold leading-tight " + th.text}>{d?.settings?.company_name || config.client.business_name}</div>
              <div className={"text-xs leading-tight " + th.sub}>{t(lang, "manager")}</div>
            </div>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search size={15} className={"absolute start-3 top-1/2 -translate-y-1/2 " + th.sub} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, "search")} className={"w-full rounded-lg border ps-9 pe-3 py-2 text-sm outline-none focus:border-sand-500 " + th.inp} />
            {results.length > 0 && (
              <div className={"absolute mt-1 w-full rounded-xl border shadow-xl overflow-hidden z-50 " + th.bord + " " + th.card}>
                {results.map((r, i) => (
                  <button key={i} onClick={() => openResult(r)} className={"w-full text-left px-3 py-2 text-sm flex justify-between " + th.hov}>
                    <span className={th.text}>{r.name || r.invoice_number || r.po_number || r.shipment_number}</span>
                    <span className={"text-xs " + th.sub}>{statusLabel(lang, cap, r.kind)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} title={t(lang, "languageToggle")} className={"shrink-0 " + th.sub}><Languages size={18} /></button>
          <button onClick={() => { setDark(!dark); localStorage.setItem("ahq_theme", dark ? "light" : "dark"); }} className={"shrink-0 " + th.sub}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button title={t(lang, "signOut")} onClick={() => { if (window.confirm(t(lang, "confirmSignOut", { name: user?.name || "" }))) { clearToken(); location.reload(); } }} className={"shrink-0 " + th.sub}><LogOut size={18} /></button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl flex">
        {/* desktop sidebar */}
        <nav className={"hidden md:block w-52 shrink-0 border-e min-h-screen p-3 " + th.bord}>
          {nav.map((n) => (
            <button key={n.id} onClick={() => go(n.id)} className={"w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm mb-0.5 " + (view === n.id ? "bg-sand-500/15 text-sand-500 font-medium" : th.sub + " " + th.hov)}>
              <n.icon size={16} />{n.labelKey ? t(lang, n.labelKey) : n.label}
            </button>
          ))}
        </nav>
        <main className="flex-1 min-w-0 p-4 pb-24 md:pb-6">{body}</main>
      </div>

      {/* mobile bottom tabs */}
      <nav className={"md:hidden fixed bottom-0 inset-x-0 z-40 border-t flex pb-safe " + th.bord + " " + th.card} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {mobileTabIds.map((id) => {
          const n = nav.find((x) => x.id === id);
          return (
            <button key={id} onClick={() => go(id)} className={"flex-1 flex flex-col items-center gap-0.5 py-2 text-xs " + (view === id ? "text-sand-500 font-medium" : th.sub)}>
              <n.icon size={19} />{n.labelKey ? t(lang, n.labelKey) : n.label}
            </button>
          );
        })}
        <button onClick={() => setMoreOpen(true)} className={"flex-1 flex flex-col items-center gap-0.5 py-2 text-xs " + (!mobileTabIds.includes(view) ? "text-sand-500 font-medium" : th.sub)}>
          <MoreHorizontal size={19} />{t(lang, "more")}
        </button>
      </nav>

      {/* mobile "more" sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setMoreOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className={"w-full rounded-t-2xl border-t p-4 grid grid-cols-3 gap-3 " + th.bord + " " + th.card} style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
            {nav.filter((n) => !mobileTabIds.includes(n.id)).map((n) => (
              <button key={n.id} onClick={() => go(n.id)} className={"flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs " + th.bord + " " + th.text + " " + th.hov}>
                <n.icon size={20} className="text-sand-500" />{n.labelKey ? t(lang, n.labelKey) : n.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* modals */}
      {d && modal?.t === "productForm" && <ProductForm th={th} lang={lang} d={d} edit={modal.edit} isAdmin={isAdmin} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
      {d && modal?.t === "customerForm" && <CustomerForm th={th} lang={lang} edit={modal.edit} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
      {d && modal?.t === "saleForm" && <SaleForm th={th} lang={lang} d={d} onClose={() => setModal(null)} onDone={(invId) => { reload().then(() => setModal(invId ? { t: "invoice", id: invId } : null)); }} />}
      {d && modal?.t === "poForm" && <POForm th={th} lang={lang} d={d} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
      {d && modal?.t === "shipForm" && <ShipmentForm th={th} lang={lang} d={d} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
      {d && modal?.t === "expForm" && <ExpenseForm th={th} lang={lang} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
      {modal?.t === "productDetail" && <ProductDetail th={th} lang={lang} id={modal.id} isAdmin={isAdmin} onClose={() => setModal(null)} onChanged={reload} onEdit={(p) => setModal({ t: "productForm", edit: p })} />}
      {modal?.t === "customerDetail" && <CustomerDetail th={th} lang={lang} id={modal.id} isAdmin={isAdmin} onChanged={reload} onClose={() => setModal(null)} onEdit={(c) => setModal({ t: "customerForm", edit: c })} />}
      {d && modal?.t === "invoice" && <InvoiceView th={th} lang={lang} d={d} id={modal.id} isAdmin={isAdmin} company={d.settings?.company_name || config.client.business_name} onClose={() => setModal(null)} onChanged={reload} />}
    </div>
  );
}
