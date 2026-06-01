import { useState, useEffect, useRef } from "react";

// ============================================================
// SUPABASE CONFIG — Replace with your own values
// ============================================================
const SUPABASE_URL = "https://inaateffjyujbvcabpyy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYWF0ZWZmanl1amJ2Y2FicHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDI0ODEsImV4cCI6MjA5NTg3ODQ4MX0.Xz04E-vp5HRivAxkMsD_6coTV7nrm2WavoqjLxFt0JI";

// ============================================================
// Minimal Supabase client (no npm needed)
// ============================================================
const supabase = (() => {
  const headers = {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
  const db = (table) => ({
    select: (cols = "*") => ({
      order: (col, opts = {}) => fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${cols}&order=${col}${opts.ascending === false ? ".desc" : ""}`, { headers }).then(r => r.json()),
      eq: (col, val) => fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${cols}&${col}=eq.${val}`, { headers }).then(r => r.json()),
      then: (fn) => fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${cols}`, { headers }).then(r => r.json()).then(fn),
    }),
    insert: (data) => fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify(data) }).then(r => r.json()),
    update: (data) => ({ eq: (col, val) => fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${val}`, { method: "PATCH", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify(data) }).then(r => r.json()) }),
    delete: () => ({ eq: (col, val) => fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${val}`, { method: "DELETE", headers }).then(r => r.json()) }),
  });
  const auth = {
    signInWithPassword: ({ email, password }) =>
      fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers, body: JSON.stringify({ email, password }) }).then(r => r.json()),
    signOut: () => fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers }).then(r => r.json()),
  };
  return { from: db, auth };
})();

// ============================================================
// DEMO DATA (used when Supabase not configured)
// ============================================================
const DEMO_PRODUCTS = [
  { id: 1, name: "Rice (1kg)", category: "Groceries", price: 60, stock: 150, unit: "kg" },
  { id: 2, name: "Sugar (1kg)", category: "Groceries", price: 45, stock: 200, unit: "kg" },
  { id: 3, name: "Cooking Oil (1L)", category: "Groceries", price: 120, stock: 80, unit: "L" },
  { id: 4, name: "Soap Bar", category: "Personal Care", price: 30, stock: 300, unit: "pcs" },
  { id: 5, name: "Shampoo 200ml", category: "Personal Care", price: 85, stock: 60, unit: "pcs" },
  { id: 6, name: "Notebook A4", category: "Stationery", price: 40, stock: 120, unit: "pcs" },
  { id: 7, name: "Pen (Blue)", category: "Stationery", price: 10, stock: 500, unit: "pcs" },
  { id: 8, name: "Bread Loaf", category: "Bakery", price: 35, stock: 40, unit: "pcs" },
];
const DEMO_CUSTOMERS = [
  { id: 1, name: "Walk-in Customer", phone: "", email: "", total_purchases: 0 },
  { id: 2, name: "Rahul Sharma", phone: "9876543210", email: "rahul@email.com", total_purchases: 4500 },
  { id: 3, name: "Priya Patel", phone: "8765432109", email: "priya@email.com", total_purchases: 2300 },
];
const DEMO_SALES = [
  { id: 1, bill_no: "INV-001", customer_name: "Rahul Sharma", total: 350, items: 3, created_at: new Date(Date.now() - 86400000).toISOString(), status: "paid" },
  { id: 2, bill_no: "INV-002", customer_name: "Walk-in Customer", total: 120, items: 2, created_at: new Date(Date.now() - 3600000).toISOString(), status: "paid" },
  { id: 3, bill_no: "INV-003", customer_name: "Priya Patel", total: 890, items: 5, created_at: new Date().toISOString(), status: "paid" },
];

const isDemo = SUPABASE_URL === "YOUR_SUPABASE_URL";

// ============================================================
// STYLES
// ============================================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f0f14;
    --surface: #17171f;
    --surface2: #1e1e28;
    --border: #2a2a38;
    --accent: #f5a623;
    --accent2: #e8485a;
    --green: #2ecc71;
    --blue: #4a9eff;
    --text: #f0f0f5;
    --muted: #8888a0;
    --font-head: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --radius: 12px;
    --shadow: 0 8px 32px rgba(0,0,0,0.4);
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-body); min-height: 100vh; }

  .app { display: flex; height: 100vh; overflow: hidden; }

  /* SIDEBAR */
  .sidebar {
    width: 220px; background: var(--surface); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; padding: 0; flex-shrink: 0;
  }
  .sidebar-logo {
    padding: 24px 20px 20px; border-bottom: 1px solid var(--border);
    font-family: var(--font-head); font-size: 20px; font-weight: 800; color: var(--accent);
    display: flex; align-items: center; gap: 10px;
  }
  .sidebar-logo span { color: var(--text); font-weight: 400; font-size: 14px; display: block; margin-top: 2px; }
  .logo-icon { width: 36px; height: 36px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
  .nav-item {
    display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px;
    cursor: pointer; font-size: 14px; font-weight: 500; color: var(--muted);
    transition: all 0.15s; border: none; background: none; width: 100%; text-align: left;
  }
  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active { background: rgba(245,166,35,0.15); color: var(--accent); }
  .nav-item .icon { font-size: 18px; width: 22px; text-align: center; }
  .sidebar-bottom { padding: 16px 12px; border-top: 1px solid var(--border); }
  .user-badge {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    background: var(--surface2); border-radius: 8px;
  }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #000; }
  .user-info { flex: 1; min-width: 0; }
  .user-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-role { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .logout-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 16px; padding: 4px; }
  .logout-btn:hover { color: var(--accent2); }

  /* MAIN */
  .main { flex: 1; overflow-y: auto; background: var(--bg); }
  .page { padding: 28px 32px; animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
  .page-title { font-family: var(--font-head); font-size: 26px; font-weight: 700; }
  .page-title span { color: var(--accent); }

  /* CARDS */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 20px; position: relative; overflow: hidden;
  }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .stat-card.yellow::before { background: var(--accent); }
  .stat-card.red::before { background: var(--accent2); }
  .stat-card.green::before { background: var(--green); }
  .stat-card.blue::before { background: var(--blue); }
  .stat-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .stat-value { font-family: var(--font-head); font-size: 28px; font-weight: 700; }
  .stat-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }

  /* TABLES */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--border); font-weight: 600; }
  td { padding: 12px 14px; border-bottom: 1px solid rgba(42,42,56,0.5); font-size: 14px; }
  tr:hover td { background: var(--surface2); }
  .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-green { background: rgba(46,204,113,0.15); color: var(--green); }
  .badge-yellow { background: rgba(245,166,35,0.15); color: var(--accent); }
  .badge-red { background: rgba(232,72,90,0.15); color: var(--accent2); }

  /* BUTTONS */
  .btn {
    display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px;
    border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
    border: none; transition: all 0.15s; font-family: var(--font-body);
  }
  .btn-primary { background: var(--accent); color: #000; }
  .btn-primary:hover { background: #e8952a; transform: translateY(-1px); }
  .btn-danger { background: var(--accent2); color: #fff; }
  .btn-danger:hover { background: #d63344; }
  .btn-ghost { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-icon { padding: 8px; border-radius: 6px; }

  /* FORM */
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted); margin-bottom: 6px; }
  .form-input {
    width: 100%; padding: 10px 14px; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); font-size: 14px; font-family: var(--font-body);
    outline: none; transition: border-color 0.15s;
  }
  .form-input:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--muted); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  /* MODAL */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    backdrop-filter: blur(4px);
  }
  .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .modal-title { font-family: var(--font-head); font-size: 20px; font-weight: 700; }
  .modal-close { background: none; border: none; color: var(--muted); font-size: 20px; cursor: pointer; }
  .modal-close:hover { color: var(--text); }

  /* POS */
  .pos-layout { display: grid; grid-template-columns: 1fr 360px; gap: 20px; height: calc(100vh - 80px); }
  .product-search { position: relative; margin-bottom: 16px; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 16px; }
  .search-input { width: 100%; padding: 11px 14px 11px 38px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px; font-family: var(--font-body); outline: none; }
  .search-input:focus { border-color: var(--accent); }
  .cat-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .cat-tab { padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--surface2); color: var(--muted); transition: all 0.15s; }
  .cat-tab.active { background: var(--accent); color: #000; border-color: var(--accent); }
  .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; overflow-y: auto; max-height: calc(100vh - 260px); padding-right: 4px; }
  .product-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 14px 12px; cursor: pointer; transition: all 0.15s; text-align: left;
  }
  .product-card:hover { border-color: var(--accent); transform: translateY(-2px); background: var(--surface2); }
  .product-card:active { transform: translateY(0); }
  .product-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; line-height: 1.3; }
  .product-price { font-family: var(--font-head); font-size: 16px; font-weight: 700; color: var(--accent); }
  .product-stock { font-size: 11px; color: var(--muted); margin-top: 4px; }
  .product-stock.low { color: var(--accent2); }

  /* CART */
  .cart { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); display: flex; flex-direction: column; overflow: hidden; }
  .cart-header { padding: 16px 18px; border-bottom: 1px solid var(--border); }
  .cart-title { font-family: var(--font-head); font-size: 17px; font-weight: 700; display: flex; align-items: center; justify-content: space-between; }
  .cart-count { background: var(--accent); color: #000; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
  .cart-items { flex: 1; overflow-y: auto; padding: 10px; }
  .cart-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; margin-bottom: 6px; background: var(--surface2); }
  .cart-item-name { flex: 1; font-size: 13px; font-weight: 500; line-height: 1.2; }
  .cart-item-price { font-size: 12px; color: var(--muted); }
  .qty-ctrl { display: flex; align-items: center; gap: 6px; }
  .qty-btn { width: 24px; height: 24px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
  .qty-btn:hover { background: var(--accent); color: #000; border-color: var(--accent); }
  .qty-num { font-size: 13px; font-weight: 600; min-width: 20px; text-align: center; }
  .remove-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 14px; padding: 2px; }
  .remove-btn:hover { color: var(--accent2); }
  .cart-footer { padding: 14px 16px; border-top: 1px solid var(--border); }
  .cart-line { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: var(--muted); }
  .cart-total { display: flex; justify-content: space-between; font-family: var(--font-head); font-size: 20px; font-weight: 700; margin: 10px 0; }
  .cart-total span:last-child { color: var(--accent); }

  /* LOGIN */
  .login-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg);
    background-image: radial-gradient(ellipse at 20% 50%, rgba(245,166,35,0.06) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(74,158,255,0.06) 0%, transparent 60%);
  }
  .login-box { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 40px; width: 100%; max-width: 400px; box-shadow: var(--shadow); }
  .login-logo { text-align: center; margin-bottom: 32px; }
  .login-logo-icon { width: 56px; height: 56px; background: var(--accent); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 12px; }
  .login-title { font-family: var(--font-head); font-size: 24px; font-weight: 800; }
  .login-sub { font-size: 13px; color: var(--muted); margin-top: 4px; }
  .demo-notice { background: rgba(245,166,35,0.1); border: 1px solid rgba(245,166,35,0.3); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: var(--accent); margin-bottom: 20px; text-align: center; }

  /* RECEIPT */
  .receipt { background: #fff; color: #000; padding: 24px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 12px; max-width: 300px; margin: 0 auto; }
  .receipt-center { text-align: center; }
  .receipt-divider { border-top: 1px dashed #000; margin: 10px 0; }
  .receipt-row { display: flex; justify-content: space-between; margin-bottom: 4px; }

  /* MISC */
  .empty-state { text-align: center; padding: 48px 20px; color: var(--muted); }
  .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.4; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; background: var(--surface2); border: 1px solid var(--border); color: var(--muted); }
  .section-title { font-family: var(--font-head); font-size: 16px; font-weight: 700; margin-bottom: 14px; color: var(--text); }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .flex-between { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .gap-2 { display: flex; gap: 8px; }
  .alert { padding: 10px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
  .alert-error { background: rgba(232,72,90,0.15); border: 1px solid rgba(232,72,90,0.3); color: var(--accent2); }
  .alert-success { background: rgba(46,204,113,0.15); border: 1px solid rgba(46,204,113,0.3); color: var(--green); }

  @media (max-width: 768px) {
    .sidebar { width: 60px; }
    .sidebar-logo .logo-text, .nav-item span, .user-info { display: none; }
    .nav-item { justify-content: center; padding: 10px; }
    .stat-grid { grid-template-columns: 1fr 1fr; }
    .pos-layout { grid-template-columns: 1fr; }
    .product-grid { max-height: 40vh; }
  }

  @media print {
    body * { visibility: hidden; }
    .print-area, .print-area * { visibility: visible; }
    .print-area { position: fixed; left: 0; top: 0; width: 100%; }
  }
`;

// ============================================================
// HELPER
// ============================================================
const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateStr = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const timeStr = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
let billCounter = 4;
const newBillNo = () => `INV-${String(billCounter++).padStart(3, "0")}`;

// ============================================================
// SUBCOMPONENTS
// ============================================================

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter email and password"); return; }
    setLoading(true); setError("");
    if (isDemo) {
      setTimeout(() => { onLogin({ email, name: "Admin User", role: "admin" }); setLoading(false); }, 800);
      return;
    }
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) { setError(res.error.message); setLoading(false); }
    else { onLogin({ email, name: email.split("@")[0], role: "admin", token: res.access_token }); setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <div className="login-logo-icon">🧾</div>
          <div className="login-title">BillPro POS</div>
          <div className="login-sub">Smart Billing for Every Business</div>
        </div>
        {isDemo && <div className="demo-notice">🟡 Demo Mode — Connect Supabase for live data</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@yourstore.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••" />
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }} onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in…" : "Sign In →"}
        </button>
      </div>
    </div>
  );
}

function Dashboard({ sales, products, customers }) {
  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.created_at).toDateString() === today);
  const todayRevenue = todaySales.reduce((a, s) => a + s.total, 0);
  const totalRevenue = sales.reduce((a, s) => a + s.total, 0);
  const lowStock = products.filter(p => p.stock < 20);
  const topProducts = [...products].sort((a, b) => b.price - a.price).slice(0, 5);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Dashboard <span>Overview</span></div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
      </div>

      <div className="stat-grid">
        <div className="stat-card yellow">
          <div className="stat-label">Today's Revenue</div>
          <div className="stat-value">{fmt(todayRevenue)}</div>
          <div className="stat-sub">{todaySales.length} bills today</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">{fmt(totalRevenue)}</div>
          <div className="stat-sub">{sales.length} total bills</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Products</div>
          <div className="stat-value">{products.length}</div>
          <div className="stat-sub">{lowStock.length} low stock</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Customers</div>
          <div className="stat-value">{customers.length}</div>
          <div className="stat-sub">Registered</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="section-title">Recent Bills</div>
          <table>
            <thead><tr><th>Bill No</th><th>Customer</th><th>Amount</th><th>Time</th></tr></thead>
            <tbody>
              {sales.slice(-5).reverse().map(s => (
                <tr key={s.id}>
                  <td><span className="tag">{s.bill_no}</span></td>
                  <td>{s.customer_name}</td>
                  <td style={{ color: "var(--accent)", fontWeight: 600 }}>{fmt(s.total)}</td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{timeStr(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="section-title">⚠️ Low Stock Alert</div>
          {lowStock.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>✅ All products well stocked!</div>
          ) : (
            <table>
              <thead><tr><th>Product</th><th>Stock</th></tr></thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td><span className="badge badge-red">{p.stock} {p.unit}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function POSPage({ products, customers, onSale, setProducts }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]);
  const [discount, setDiscount] = useState(0);
  const [showBill, setShowBill] = useState(null);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const printRef = useRef();

  const categories = ["All", ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p => (category === "All" || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase()));

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const discountAmt = (subtotal * discount) / 100;
  const tax = (subtotal - discountAmt) * 0.05;
  const total = subtotal - discountAmt + tax;

  const checkout = () => {
    if (cart.length === 0) return;
    const billNo = newBillNo();
    const bill = {
      id: Date.now(), bill_no: billNo, customer_name: selectedCustomer.name,
      customer_id: selectedCustomer.id, items: cart, subtotal, discount: discountAmt,
      tax, total, payment_mode: paymentMode, created_at: new Date().toISOString(), status: "paid"
    };
    setProducts(prev => prev.map(p => {
      const ci = cart.find(c => c.id === p.id);
      return ci ? { ...p, stock: p.stock - ci.qty } : p;
    }));
    onSale(bill);
    setShowBill(bill);
    setCart([]);
    setDiscount(0);
  };

  const printReceipt = () => {
    const w = window.open("", "_blank", "width=400,height=600");
    w.document.write(`<html><head><title>Receipt</title><style>body{font-family:monospace;font-size:12px;padding:16px;} .r{display:flex;justify-content:space-between;} hr{border:1px dashed #000;}</style></head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-title">Point of <span>Sale</span></div>
        <select className="form-input" style={{ width: "auto", paddingRight: 32 }} value={selectedCustomer.id} onChange={e => setSelectedCustomer(customers.find(c => c.id == e.target.value))}>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="pos-layout">
        <div>
          <div className="product-search">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="cat-tabs">
            {categories.map(c => <button key={c} className={`cat-tab ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{c}</button>)}
          </div>
          <div className="product-grid">
            {filtered.map(p => (
              <button key={p.id} className="product-card" onClick={() => addToCart(p)} disabled={p.stock === 0}>
                <div className="product-name">{p.name}</div>
                <div className="product-price">{fmt(p.price)}</div>
                <div className={`product-stock ${p.stock < 20 ? "low" : ""}`}>Stock: {p.stock} {p.unit}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="cart">
          <div className="cart-header">
            <div className="cart-title">Cart <span className="cart-count">{cart.reduce((a, i) => a + i.qty, 0)}</span></div>
          </div>
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🛒</div><div>Tap a product to add</div></div>
            ) : cart.map(item => (
              <div key={item.id} className="cart-item">
                <div style={{ flex: 1 }}>
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{fmt(item.price)} × {item.qty} = {fmt(item.price * item.qty)}</div>
                </div>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                  <span className="qty-num">{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                  <button className="remove-btn" onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-footer">
            <div className="cart-line"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="cart-line">
              <span>Discount (%)</span>
              <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(Number(e.target.value))}
                style={{ width: 60, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 6, padding: "2px 8px", fontSize: 13, textAlign: "right" }} />
            </div>
            <div className="cart-line"><span>Tax (5%)</span><span>{fmt(tax)}</span></div>
            <div className="cart-total"><span>Total</span><span>{fmt(total)}</span></div>
            <div style={{ marginBottom: 10 }}>
              <div className="form-label" style={{ marginBottom: 6 }}>Payment Mode</div>
              <div className="gap-2">
                {["Cash", "UPI", "Card"].map(m => (
                  <button key={m} className={`btn btn-sm ${paymentMode === m ? "btn-primary" : "btn-ghost"}`} onClick={() => setPaymentMode(m)}>{m}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }} onClick={checkout} disabled={cart.length === 0}>
              🧾 Generate Bill
            </button>
          </div>
        </div>
      </div>

      {showBill && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div className="modal-title">✅ Bill Generated!</div>
              <button className="modal-close" onClick={() => setShowBill(null)}>✕</button>
            </div>
            <div ref={printRef} className="receipt">
              <div className="receipt-center" style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>🧾 BillPro POS</div>
                <div>Your Store Name</div>
                <div>{dateStr(showBill.created_at)} {timeStr(showBill.created_at)}</div>
              </div>
              <hr className="receipt-divider" />
              <div className="receipt-row"><span>Bill No:</span><span>{showBill.bill_no}</span></div>
              <div className="receipt-row"><span>Customer:</span><span>{showBill.customer_name}</span></div>
              <div className="receipt-row"><span>Payment:</span><span>{showBill.payment_mode}</span></div>
              <hr className="receipt-divider" />
              {showBill.items.map(i => (
                <div key={i.id} className="receipt-row" style={{ marginBottom: 4 }}>
                  <span>{i.name} ×{i.qty}</span>
                  <span>{fmt(i.price * i.qty)}</span>
                </div>
              ))}
              <hr className="receipt-divider" />
              <div className="receipt-row"><span>Subtotal:</span><span>{fmt(showBill.subtotal)}</span></div>
              {showBill.discount > 0 && <div className="receipt-row"><span>Discount:</span><span>-{fmt(showBill.discount)}</span></div>}
              <div className="receipt-row"><span>Tax (5%):</span><span>{fmt(showBill.tax)}</span></div>
              <div className="receipt-row" style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}><span>TOTAL:</span><span>{fmt(showBill.total)}</span></div>
              <hr className="receipt-divider" />
              <div className="receipt-center">Thank you for shopping! Visit again.</div>
            </div>
            <div className="gap-2" style={{ marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={printReceipt}>🖨️ Print Receipt</button>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowBill(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsPage({ products, setProducts }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", price: "", stock: "", unit: "pcs" });
  const [search, setSearch] = useState("");

  const openAdd = () => { setEditing(null); setForm({ name: "", category: "", price: "", stock: "", unit: "pcs" }); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock, unit: p.unit }); setShowModal(true); };

  const save = () => {
    if (!form.name || !form.price) return;
    if (editing) {
      setProducts(prev => prev.map(p => p.id === editing.id ? { ...p, ...form, price: Number(form.price), stock: Number(form.stock) } : p));
    } else {
      setProducts(prev => [...prev, { ...form, id: Date.now(), price: Number(form.price), stock: Number(form.stock) }]);
    }
    setShowModal(false);
  };

  const del = (id) => { if (window.confirm("Delete this product?")) setProducts(prev => prev.filter(p => p.id !== id)); };
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Product <span>Inventory</span></div>
        <div className="gap-2">
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>🔍</span>
            <input className="form-input" style={{ paddingLeft: 32, width: 220 }} placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Unit</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td><span className="tag">{p.category}</span></td>
                  <td style={{ color: "var(--accent)", fontWeight: 600 }}>{fmt(p.price)}</td>
                  <td>{p.stock}</td>
                  <td style={{ color: "var(--muted)" }}>{p.unit}</td>
                  <td><span className={`badge ${p.stock > 20 ? "badge-green" : p.stock > 0 ? "badge-yellow" : "badge-red"}`}>{p.stock > 20 ? "In Stock" : p.stock > 0 ? "Low Stock" : "Out of Stock"}</span></td>
                  <td>
                    <div className="gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(p.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? "Edit Product" : "Add New Product"}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Product Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rice 1kg" /></div>
              <div className="form-group"><label className="form-label">Category</label><input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Groceries" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Price (₹) *</label><input className="form-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" /></div>
              <div className="form-group"><label className="form-label">Stock Quantity</label><input className="form-input" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" /></div>
            </div>
            <div className="form-group"><label className="form-label">Unit</label>
              <select className="form-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                {["pcs", "kg", "g", "L", "ml", "box", "pack", "dozen"].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="gap-2" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editing ? "Save Changes" : "Add Product"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersPage({ customers, setCustomers, sales }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [search, setSearch] = useState("");

  const save = () => {
    if (!form.name) return;
    setCustomers(prev => [...prev, { ...form, id: Date.now(), total_purchases: 0 }]);
    setForm({ name: "", phone: "", email: "" }); setShowModal(false);
  };

  const getCustTotal = (name) => sales.filter(s => s.customer_name === name).reduce((a, s) => a + s.total, 0);
  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Customer <span>Management</span></div>
        <div className="gap-2">
          <input className="form-input" style={{ width: 220 }} placeholder="🔍 Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Customer</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Total Bills</th><th>Total Spent</th></tr></thead>
            <tbody>
              {filtered.map(c => {
                const total = getCustTotal(c.name);
                const bills = sales.filter(s => s.customer_name === c.name).length;
                return (
                  <tr key={c.id}>
                    <td><div style={{ fontWeight: 600 }}>{c.name}</div></td>
                    <td style={{ color: "var(--muted)" }}>{c.phone || "—"}</td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{c.email || "—"}</td>
                    <td><span className="badge badge-yellow">{bills} bills</span></td>
                    <td style={{ color: "var(--accent)", fontWeight: 600 }}>{fmt(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add New Customer</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Customer name" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></div>
            </div>
            <div className="gap-2" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Add Customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SalesPage({ sales }) {
  const [search, setSearch] = useState("");
  const [viewBill, setViewBill] = useState(null);
  const filtered = sales.filter(s => s.bill_no?.toLowerCase().includes(search.toLowerCase()) || s.customer_name?.toLowerCase().includes(search.toLowerCase()));
  const totalRevenue = sales.reduce((a, s) => a + s.total, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Sales <span>Reports</span></div>
        <input className="form-input" style={{ width: 240 }} placeholder="🔍 Search bills…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 24 }}>
        <div className="stat-card yellow"><div className="stat-label">Total Revenue</div><div className="stat-value">{fmt(totalRevenue)}</div></div>
        <div className="stat-card green"><div className="stat-label">Total Bills</div><div className="stat-value">{sales.length}</div></div>
        <div className="stat-card blue"><div className="stat-label">Avg Bill Value</div><div className="stat-value">{fmt(sales.length ? totalRevenue / sales.length : 0)}</div></div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Bill No</th><th>Date & Time</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {[...filtered].reverse().map(s => (
                <tr key={s.id}>
                  <td><span className="tag">{s.bill_no}</span></td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{dateStr(s.created_at)}<br />{timeStr(s.created_at)}</td>
                  <td style={{ fontWeight: 500 }}>{s.customer_name}</td>
                  <td style={{ color: "var(--muted)" }}>{s.items?.length || s.items} items</td>
                  <td style={{ color: "var(--accent)", fontWeight: 700 }}>{fmt(s.total)}</td>
                  <td><span className="tag">{s.payment_mode || "Cash"}</span></td>
                  <td><span className="badge badge-green">{s.status}</span></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => setViewBill(s)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewBill && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div className="modal-title">Bill — {viewBill.bill_no}</div>
              <button className="modal-close" onClick={() => setViewBill(null)}>✕</button>
            </div>
            <div style={{ fontSize: 14 }}>
              <div className="cart-line"><span>Customer:</span><span>{viewBill.customer_name}</span></div>
              <div className="cart-line"><span>Date:</span><span>{dateStr(viewBill.created_at)} {timeStr(viewBill.created_at)}</span></div>
              <div className="cart-line"><span>Payment:</span><span>{viewBill.payment_mode || "Cash"}</span></div>
              <hr style={{ border: "1px solid var(--border)", margin: "12px 0" }} />
              {Array.isArray(viewBill.items) && viewBill.items.map(i => (
                <div key={i.id} className="cart-line"><span>{i.name} ×{i.qty}</span><span>{fmt(i.price * i.qty)}</span></div>
              ))}
              <hr style={{ border: "1px solid var(--border)", margin: "12px 0" }} />
              <div className="cart-line"><span>Subtotal:</span><span>{fmt(viewBill.subtotal || viewBill.total)}</span></div>
              {viewBill.discount > 0 && <div className="cart-line"><span>Discount:</span><span>-{fmt(viewBill.discount)}</span></div>}
              <div className="cart-line"><span>Tax:</span><span>{fmt(viewBill.tax || 0)}</span></div>
              <div className="cart-total"><span>Total</span><span>{fmt(viewBill.total)}</span></div>
            </div>
            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={() => setViewBill(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SetupPage() {
  const sql = `-- Run this in Supabase SQL Editor
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  total_purchases DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales (
  id BIGSERIAL PRIMARY KEY,
  bill_no TEXT NOT NULL,
  customer_id BIGINT REFERENCES customers(id),
  customer_name TEXT,
  items JSONB,
  subtotal DECIMAL(10,2),
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_mode TEXT DEFAULT 'Cash',
  status TEXT DEFAULT 'paid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert a default customer
INSERT INTO customers (name) VALUES ('Walk-in Customer');

-- Enable Row Level Security (optional for multi-user)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write
CREATE POLICY "allow_all" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sales FOR ALL TO authenticated USING (true) WITH CHECK (true);`;

  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(sql); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="page">
      <div className="page-header"><div className="page-title">⚙️ Setup <span>Guide</span></div></div>
      <div style={{ maxWidth: 720 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">Step 1 — Create a Supabase Project</div>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12, lineHeight: 1.7 }}>
            Go to <a href="https://supabase.com" target="_blank" style={{ color: "var(--accent)" }}>supabase.com</a> → Sign up free → Create new project → Choose a region near you → Set a database password.
          </p>
        </div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="flex-between">
            <div className="section-title">Step 2 — Run this SQL Script</div>
            <button className="btn btn-ghost btn-sm" onClick={copy}>{copied ? "✅ Copied!" : "📋 Copy SQL"}</button>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>In your Supabase dashboard → go to SQL Editor → paste and run:</p>
          <pre style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, fontSize: 11, overflowX: "auto", color: "#a0ffb0", lineHeight: 1.6, maxHeight: 300, overflow: "auto" }}>{sql}</pre>
        </div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">Step 3 — Add Your Supabase Keys</div>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 10, lineHeight: 1.7 }}>
            Go to <b>Settings → API</b> in your Supabase project. Copy:<br />
            • <b>Project URL</b> → paste as <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4, color: "var(--accent)" }}>SUPABASE_URL</code><br />
            • <b>anon public key</b> → paste as <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4, color: "var(--accent)" }}>SUPABASE_KEY</code><br />
            These are at the very top of this file (lines 5–6).
          </p>
        </div>
        <div className="card">
          <div className="section-title">Step 4 — Deploy to Vercel (Free Hosting)</div>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
            1. Download this code → push to GitHub<br />
            2. Go to <a href="https://vercel.com" target="_blank" style={{ color: "var(--accent)" }}>vercel.com</a> → Import from GitHub → Deploy<br />
            3. Your app is now LIVE on the internet! Share the URL with your staff 🎉<br />
            4. On mobile: open in browser → tap "Add to Home Screen" → works like an app!
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROOT APP
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [customers, setCustomers] = useState(DEMO_CUSTOMERS);
  const [sales, setSales] = useState(DEMO_SALES);

  const onSale = (bill) => setSales(prev => [...prev, bill]);

  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "pos", icon: "🧾", label: "Billing / POS" },
    { id: "products", icon: "📦", label: "Products" },
    { id: "customers", icon: "👥", label: "Customers" },
    { id: "sales", icon: "📈", label: "Sales Report" },
    { id: "setup", icon: "⚙️", label: "Setup Guide" },
  ];

  if (!user) return (
    <>
      <style>{styles}</style>
      <LoginPage onLogin={setUser} />
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">🧾</div>
            <div className="logo-text">
              BillPro
              <span>POS System</span>
            </div>
          </div>
          <nav className="nav">
            {navItems.map(n => (
              <button key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
                <span className="icon">{n.icon}</span>
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="user-badge">
              <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role}</div>
              </div>
              <button className="logout-btn" onClick={() => setUser(null)} title="Logout">⏏</button>
            </div>
          </div>
        </div>
        <div className="main">
          {page === "dashboard" && <Dashboard sales={sales} products={products} customers={customers} />}
          {page === "pos" && <POSPage products={products} customers={customers} onSale={onSale} setProducts={setProducts} />}
          {page === "products" && <ProductsPage products={products} setProducts={setProducts} />}
          {page === "customers" && <CustomersPage customers={customers} setCustomers={setCustomers} sales={sales} />}
          {page === "sales" && <SalesPage sales={sales} />}
          {page === "setup" && <SetupPage />}
        </div>
      </div>
    </>
  );
}
