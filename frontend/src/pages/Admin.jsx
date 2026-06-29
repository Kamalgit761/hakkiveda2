import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import api, { API } from "@/lib/api";
import { resolveImage } from "@/lib/image";
import { toast } from "sonner";
import { LayoutDashboard, Package, ShoppingCart, Users, Tag, Mail, MessageSquare, Star, FileText, Image as ImageIcon, Settings, LogOut, Plus, Trash2, Edit3, Upload, X } from "lucide-react";

const TABS = [
  { k: "dashboard", l: "Dashboard", icon: LayoutDashboard },
  { k: "products", l: "Products", icon: Package },
  { k: "orders", l: "Orders", icon: ShoppingCart },
  { k: "customers", l: "Customers", icon: Users },
  { k: "coupons", l: "Coupons", icon: Tag },
  { k: "newsletter", l: "Newsletter", icon: Mail },
  { k: "messages", l: "Messages", icon: MessageSquare },
  { k: "reviews", l: "Reviews", icon: Star },
  { k: "blog", l: "Blog", icon: FileText },
  { k: "homepage", l: "Homepage / SEO", icon: ImageIcon },
  { k: "profile", l: "Profile", icon: Settings },
];

const AdminLogin = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("hakkiveda@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      if (!u.is_admin) toast.error("This account is not an admin");
      else toast.success("Welcome, Admin");
    } catch (err) { toast.error(err.response?.data?.detail || "Login failed"); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-hk-ivory" data-testid="admin-login-page">
      <form onSubmit={submit} className="bg-white rounded-2xl p-8 border border-hk-green/15 w-full max-w-md">
        <p className="overline mb-2">HAKKIVEDA</p>
        <h1 className="font-serif text-3xl mb-6">Admin Sign In</h1>
        <input required type="email" placeholder="Admin email" value={email} onChange={(e)=>setEmail(e.target.value)} data-testid="admin-login-email" className="w-full px-4 py-3 rounded-lg border border-hk-green/20 bg-hk-ivory text-sm mb-3 focus:outline-none focus:border-hk-green"/>
        <input required type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} data-testid="admin-login-password" className="w-full px-4 py-3 rounded-lg border border-hk-green/20 bg-hk-ivory text-sm mb-5 focus:outline-none focus:border-hk-green"/>
        <button type="submit" disabled={loading} data-testid="admin-login-submit" className="hk-btn-primary w-full disabled:opacity-50">{loading?"Signing in…":"Sign In to Dashboard"}</button>
        <p className="text-xs text-hk-charcoal/55 mt-4 text-center">Default: hakkiveda@gmail.com / Hakki@Admin2026</p>
      </form>
    </div>
  );
};

const Admin = () => {
  const { user, logout, refreshUser } = useAuth();
  const { loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(new URLSearchParams(location.search).get("tab") || "dashboard");

  useEffect(() => {
    if (authLoading) return;
    if (user && !user.is_admin) { localStorage.removeItem("hk_token"); logout(); toast.info("Please sign in as admin"); return; }
    if (user?.is_admin) { refreshUser(); if (user.must_change_password) { toast.warning("Please change your default password in Profile."); setTab("profile"); } }
    // eslint-disable-next-line
  }, [user, authLoading]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-hk-charcoal/55">Loading…</div>;
  if (!user || !user.is_admin) return <AdminLogin />;

  return (
    <div className="min-h-screen bg-hk-ivory flex" data-testid="admin-dashboard">
      <aside className="w-64 bg-[#0a3d27] text-[#FAF8F3] flex flex-col py-6 sticky top-0 h-screen">
        <div className="px-5 mb-6">
          <p className="overline text-hk-gold" style={{color:"#C9A227"}}>HAKKIVEDA</p>
          <h2 className="font-serif text-2xl mt-1">Admin Panel</h2>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {TABS.map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} data-testid={`admin-tab-${t.k}`} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${tab===t.k?"bg-hk-gold text-[#222]":"text-[#FAF8F3]/80 hover:bg-[#0F5B3A]"}`}>
              <t.icon size={16}/> {t.l}
            </button>
          ))}
        </nav>
        <div className="px-3 mt-4 space-y-1">
          <button onClick={() => navigate("/")} className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#FAF8F3]/60 hover:bg-[#0F5B3A]">← Back to Site</button>
          <button onClick={() => { logout(); navigate("/"); }} data-testid="admin-logout" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-200 hover:bg-red-900/40"><LogOut size={14}/> Logout</button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-x-hidden">
        {tab === "dashboard" && <Dashboard/>}
        {tab === "products" && <Products/>}
        {tab === "orders" && <Orders/>}
        {tab === "customers" && <Customers/>}
        {tab === "coupons" && <Coupons/>}
        {tab === "newsletter" && <SimpleList endpoint="/admin/newsletter" title="Newsletter Subscribers" cols={["email","subscribed_at"]}/>}
        {tab === "messages" && <SimpleList endpoint="/admin/contact-messages" title="Contact Messages" cols={["name","email","subject","message","created_at"]}/>}
        {tab === "reviews" && <Reviews/>}
        {tab === "blog" && <Blog/>}
        {tab === "homepage" && <Homepage/>}
        {tab === "profile" && <Profile/>}
      </main>
    </div>
  );
};

const Dashboard = () => {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/admin/stats").then(r => setS(r.data)); }, []);
  if (!s) return <p>Loading…</p>;
  return (
    <div data-testid="admin-dashboard-section">
      <h1 className="font-serif text-4xl mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { l: "Total Revenue", v: `₹${s.total_revenue.toLocaleString()}` },
          { l: "Orders", v: s.total_orders },
          { l: "Customers", v: s.total_customers },
          { l: "Products", v: s.total_products },
        ].map(c => (
          <div key={c.l} className="bg-white p-6 rounded-2xl border border-hk-green/10">
            <p className="overline text-hk-olive">{c.l}</p>
            <p className="font-serif text-3xl text-hk-green mt-1">{c.v}</p>
          </div>
        ))}
      </div>
      <h2 className="font-serif text-2xl mb-4">Recent Orders</h2>
      <div className="bg-white rounded-2xl border border-hk-green/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-hk-ivory-warm"><tr><th className="text-left p-3">Order ID</th><th className="text-left p-3">Total</th><th className="text-left p-3">Status</th><th className="text-left p-3">Date</th></tr></thead>
          <tbody>{s.recent_orders.map(o => <tr key={o.id} className="border-t border-hk-green/5"><td className="p-3 font-mono text-xs">{o.id}</td><td className="p-3">₹{o.total}</td><td className="p-3">{o.status}</td><td className="p-3 text-hk-charcoal/55">{new Date(o.created_at).toLocaleDateString()}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
};

const Products = () => {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const load = () => api.get("/products").then(r => setItems(r.data));
  useEffect(() => { load(); }, []);
  const del = async (id) => { if (!window.confirm("Delete this product?")) return; await api.delete(`/admin/products/${id}`); toast.success("Deleted"); load(); };
  return (
    <div data-testid="admin-products">
      <div className="flex justify-between mb-6"><h1 className="font-serif text-4xl">Products</h1><button onClick={() => setEditing({})} data-testid="add-product-btn" className="hk-btn-primary"><Plus size={16}/> Add Product</button></div>
      <div className="grid gap-3">
        {items.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-4 border border-hk-green/10 flex items-center gap-4">
            <img src={resolveImage(p.images?.[0])} alt={p.name} className="w-16 h-16 rounded-lg object-cover bg-hk-ivory-warm"/>
            <div className="flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-hk-charcoal/55">{p.category} · ₹{p.price} · Stock: {p.stock ?? "—"}</p>
            </div>
            <button onClick={() => setEditing(p)} data-testid={`edit-${p.slug}`} className="p-2 hover:text-hk-green"><Edit3 size={16}/></button>
            <button onClick={() => del(p.id)} data-testid={`delete-${p.slug}`} className="p-2 hover:text-red-600"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
      {editing && <ProductForm product={editing} onClose={() => { setEditing(null); load(); }}/>}
    </div>
  );
};

const ProductForm = ({ product, onClose }) => {
  const [f, setF] = useState({
    name: product.name || "", slug: product.slug || "", subtitle: product.subtitle || "",
    category: product.category || "hair-care", price: product.price || 0, mrp: product.mrp || 0,
    stock: product.stock ?? 100, tagline: product.tagline || "", short_description: product.short_description || "",
    ingredients: (product.ingredients || []).join(", "),
    benefits: (product.benefits || []).join(", "),
    directions: product.directions || "", suitable_for: product.suitable_for || "",
    images: product.images || [], featured: product.featured || false, best_seller: product.best_seller || false,
  });
  const fileRef = useRef();
  const save = async (e) => {
    e.preventDefault();
    const body = { ...f, price: Number(f.price), mrp: Number(f.mrp), stock: Number(f.stock),
      ingredients: f.ingredients.split(",").map(s=>s.trim()).filter(Boolean),
      benefits: f.benefits.split(",").map(s=>s.trim()).filter(Boolean),
    };
    try {
      if (product.id) await api.put(`/admin/products/${product.id}`, body);
      else await api.post("/admin/products", body);
      toast.success("Saved"); onClose();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };
  const upload = async (e) => {
    const files = e.target.files;
    for (const file of files) {
      const fd = new FormData(); fd.append("file", file);
      const tok = localStorage.getItem("hk_token");
      const res = await fetch(`${API}/admin/upload`, { method: "POST", headers: { Authorization: `Bearer ${tok}` }, body: fd });
      const data = await res.json();
      if (data.url) setF(prev => ({ ...prev, images: [...prev.images, data.url] }));
    }
    toast.success("Uploaded");
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="product-form-modal">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between mb-5"><h2 className="font-serif text-2xl">{product.id ? "Edit" : "Add"} Product</h2><button onClick={onClose}><X/></button></div>
        <form onSubmit={save} className="grid grid-cols-2 gap-3 text-sm">
          {[["name","Name"],["slug","Slug"],["subtitle","Subtitle"],["tagline","Tagline"]].map(([k,l])=>(
            <input key={k} required placeholder={l} value={f[k]} onChange={(e)=>setF({...f,[k]:e.target.value})} data-testid={`f-${k}`} className="px-3 py-2 border rounded-lg col-span-2"/>
          ))}
          <select value={f.category} onChange={(e)=>setF({...f,category:e.target.value})} data-testid="f-category" className="px-3 py-2 border rounded-lg">
            <option value="hair-care">Hair Care</option><option value="skin-care">Skin Care</option><option value="wellness">Wellness</option>
          </select>
          <input type="number" placeholder="Stock" value={f.stock} onChange={(e)=>setF({...f,stock:e.target.value})} data-testid="f-stock" className="px-3 py-2 border rounded-lg"/>
          <input type="number" placeholder="Price ₹" value={f.price} onChange={(e)=>setF({...f,price:e.target.value})} data-testid="f-price" className="px-3 py-2 border rounded-lg"/>
          <input type="number" placeholder="MRP ₹" value={f.mrp} onChange={(e)=>setF({...f,mrp:e.target.value})} data-testid="f-mrp" className="px-3 py-2 border rounded-lg"/>
          <textarea required placeholder="Short description" value={f.short_description} onChange={(e)=>setF({...f,short_description:e.target.value})} className="px-3 py-2 border rounded-lg col-span-2" rows={2}/>
          <input placeholder="Ingredients (comma-sep)" value={f.ingredients} onChange={(e)=>setF({...f,ingredients:e.target.value})} className="px-3 py-2 border rounded-lg col-span-2"/>
          <input placeholder="Benefits (comma-sep)" value={f.benefits} onChange={(e)=>setF({...f,benefits:e.target.value})} className="px-3 py-2 border rounded-lg col-span-2"/>
          <textarea placeholder="Directions" value={f.directions} onChange={(e)=>setF({...f,directions:e.target.value})} className="px-3 py-2 border rounded-lg col-span-2" rows={2}/>
          <input placeholder="Suitable for" value={f.suitable_for} onChange={(e)=>setF({...f,suitable_for:e.target.value})} className="px-3 py-2 border rounded-lg col-span-2"/>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.featured} onChange={(e)=>setF({...f,featured:e.target.checked})}/> Featured</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.best_seller} onChange={(e)=>setF({...f,best_seller:e.target.checked})}/> Best Seller</label>
          <div className="col-span-2">
            <p className="font-medium mb-2">Images</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {f.images.map((img,i)=>(<div key={i} className="relative"><img src={resolveImage(img)} alt="" className="w-20 h-20 rounded object-cover bg-hk-ivory-warm"/><button type="button" onClick={()=>setF({...f,images:f.images.filter((_,j)=>j!==i)})} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs">×</button></div>))}
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*" onChange={upload} data-testid="f-upload" className="hidden"/>
            <button type="button" onClick={()=>fileRef.current.click()} className="hk-btn-secondary text-xs"><Upload size={13}/> Upload Images</button>
          </div>
          <div className="col-span-2 flex gap-3 pt-3">
            <button type="submit" data-testid="save-product" className="hk-btn-primary flex-1">Save Product</button>
            <button type="button" onClick={onClose} className="hk-btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const load = () => api.get("/admin/orders").then(r => setOrders(r.data));
  useEffect(() => { load(); }, []);
  const advance = async (o) => {
    const cur = o.tracking_stages.findIndex(s => !s.completed);
    const next = cur === -1 ? o.tracking_stages.length - 1 : cur;
    const status = ["confirmed","processing","shipped","out_for_delivery","delivered"][next];
    await api.put(`/admin/orders/${o.id}/status`, { status, stage_idx: next });
    toast.success("Status advanced"); load();
  };
  return (
    <div data-testid="admin-orders-section">
      <h1 className="font-serif text-4xl mb-6">Orders</h1>
      <div className="bg-white rounded-2xl border border-hk-green/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-hk-ivory-warm"><tr><th className="text-left p-3">ID</th><th className="text-left p-3">Total</th><th className="text-left p-3">Items</th><th className="text-left p-3">Status</th><th className="text-left p-3">Date</th><th className="p-3"></th></tr></thead>
          <tbody>{orders.map(o=>(<tr key={o.id} className="border-t border-hk-green/5"><td className="p-3 font-mono text-xs">{o.id}</td><td className="p-3">₹{o.total}</td><td className="p-3">{o.items.length}</td><td className="p-3"><span className="text-xs uppercase tracking-wider px-2 py-1 bg-hk-ivory-warm rounded">{o.status}</span></td><td className="p-3 text-hk-charcoal/55">{new Date(o.created_at).toLocaleDateString()}</td><td className="p-3"><button onClick={()=>advance(o)} data-testid={`advance-${o.id}`} className="text-xs text-hk-green hover:text-hk-gold">Advance →</button></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};

const Customers = () => {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/admin/customers").then(r => setItems(r.data)); }, []);
  return (
    <div data-testid="admin-customers">
      <h1 className="font-serif text-4xl mb-6">Customers</h1>
      <div className="bg-white rounded-2xl border border-hk-green/10 overflow-hidden"><table className="w-full text-sm"><thead className="bg-hk-ivory-warm"><tr><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Points</th><th className="text-left p-3">Joined</th></tr></thead><tbody>{items.map(c=>(<tr key={c.id} className="border-t border-hk-green/5"><td className="p-3">{c.name}</td><td className="p-3">{c.email}</td><td className="p-3">{c.reward_points}</td><td className="p-3 text-hk-charcoal/55">{new Date(c.created_at).toLocaleDateString()}</td></tr>))}</tbody></table></div>
    </div>
  );
};

const Coupons = () => {
  const [items, setItems] = useState([]);
  const [f, setF] = useState({ code: "", discount_pct: 0, discount_flat: 0, min_order: 0 });
  const load = () => api.get("/admin/coupons").then(r => setItems(r.data));
  useEffect(() => { load(); }, []);
  const save = async (e) => { e.preventDefault();
    const body = { code: f.code, min_order: Number(f.min_order) };
    if (Number(f.discount_pct) > 0) body.discount_pct = Number(f.discount_pct);
    if (Number(f.discount_flat) > 0) body.discount_flat = Number(f.discount_flat);
    await api.post("/admin/coupons", body); toast.success("Saved"); setF({code:"",discount_pct:0,discount_flat:0,min_order:0}); load();
  };
  const del = async (code) => { if (!window.confirm("Delete?")) return; await api.delete(`/admin/coupons/${code}`); load(); };
  return (
    <div data-testid="admin-coupons">
      <h1 className="font-serif text-4xl mb-6">Coupons</h1>
      <form onSubmit={save} className="bg-white rounded-2xl p-5 border border-hk-green/10 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <input required placeholder="CODE" value={f.code} onChange={e=>setF({...f,code:e.target.value.toUpperCase()})} data-testid="coupon-code" className="px-3 py-2 border rounded-lg"/>
        <input type="number" placeholder="% off" value={f.discount_pct} onChange={e=>setF({...f,discount_pct:e.target.value})} className="px-3 py-2 border rounded-lg"/>
        <input type="number" placeholder="Flat ₹" value={f.discount_flat} onChange={e=>setF({...f,discount_flat:e.target.value})} className="px-3 py-2 border rounded-lg"/>
        <input type="number" placeholder="Min order ₹" value={f.min_order} onChange={e=>setF({...f,min_order:e.target.value})} className="px-3 py-2 border rounded-lg"/>
        <button type="submit" data-testid="save-coupon" className="hk-btn-primary col-span-2 md:col-span-4">Add Coupon</button>
      </form>
      <div className="bg-white rounded-2xl border border-hk-green/10 overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-hk-ivory-warm"><tr><th className="text-left p-3">Code</th><th className="text-left p-3">Discount</th><th className="text-left p-3">Min Order</th><th className="p-3"></th></tr></thead>
        <tbody>{items.map(c=>(<tr key={c.code} className="border-t border-hk-green/5"><td className="p-3 font-mono">{c.code}</td><td className="p-3">{c.discount_pct?`${c.discount_pct}%`:`₹${c.discount_flat||0}`}</td><td className="p-3">₹{c.min_order||0}</td><td className="p-3">{!c.system && <button onClick={()=>del(c.code)} className="text-red-600 text-xs">Delete</button>}</td></tr>))}</tbody></table>
      </div>
    </div>
  );
};

const SimpleList = ({ endpoint, title, cols }) => {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get(endpoint).then(r => setItems(r.data)); }, [endpoint]);
  return (
    <div data-testid={`admin-${title.toLowerCase().replace(/\s+/g,"-")}`}>
      <h1 className="font-serif text-4xl mb-6">{title}</h1>
      <div className="bg-white rounded-2xl border border-hk-green/10 overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-hk-ivory-warm"><tr>{cols.map(c=><th key={c} className="text-left p-3 capitalize">{c.replace(/_/g," ")}</th>)}</tr></thead>
        <tbody>{items.map((it,i)=>(<tr key={i} className="border-t border-hk-green/5">{cols.map(c=><td key={c} className="p-3 max-w-md truncate">{c.includes("at")&&it[c]?new Date(it[c]).toLocaleString():it[c]}</td>)}</tr>))}</tbody></table>
      </div>
    </div>
  );
};

const Reviews = () => {
  const [items, setItems] = useState([]);
  const load = () => api.get("/admin/reviews").then(r => setItems(r.data));
  useEffect(() => { load(); }, []);
  const del = async (id) => { if (!window.confirm("Delete review?")) return; await api.delete(`/admin/reviews/${id}`); load(); };
  return (
    <div data-testid="admin-reviews">
      <h1 className="font-serif text-4xl mb-6">Reviews</h1>
      <div className="space-y-3">{items.map(r=>(<div key={r.id} className="bg-white rounded-2xl p-5 border border-hk-green/10 flex justify-between"><div><p className="font-semibold">{r.user_name} · {r.rating}★</p><p className="font-serif text-lg">{r.title}</p><p className="text-sm text-hk-charcoal/65">{r.comment}</p></div><button onClick={()=>del(r.id)} className="text-red-600"><Trash2 size={16}/></button></div>))}</div>
    </div>
  );
};

const Blog = () => {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const load = () => api.get("/admin/blog").then(r => setItems(r.data));
  useEffect(() => { load(); }, []);
  const save = async (e) => { e.preventDefault();
    if (editing.id) await api.put(`/admin/blog/${editing.id}`, editing);
    else await api.post("/admin/blog", editing);
    toast.success("Saved"); setEditing(null); load();
  };
  const del = async (id) => { if (!window.confirm("Delete?")) return; await api.delete(`/admin/blog/${id}`); load(); };
  return (
    <div data-testid="admin-blog">
      <div className="flex justify-between mb-6"><h1 className="font-serif text-4xl">Blog</h1><button onClick={()=>setEditing({title:"",slug:"",category:"Ayurveda",excerpt:"",content:"",image:""})} className="hk-btn-primary"><Plus size={14}/> New Post</button></div>
      <div className="space-y-3">{items.map(p=>(<div key={p.id} className="bg-white rounded-2xl p-4 border flex justify-between"><div><p className="font-semibold">{p.title}</p><p className="text-xs text-hk-charcoal/55">{p.category}</p></div><div className="flex gap-2"><button onClick={()=>setEditing(p)}><Edit3 size={16}/></button><button onClick={()=>del(p.id)} className="text-red-600"><Trash2 size={16}/></button></div></div>))}</div>
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-3 text-sm">
            <div className="flex justify-between"><h2 className="font-serif text-2xl">{editing.id?"Edit":"New"} Post</h2><button type="button" onClick={()=>setEditing(null)}><X/></button></div>
            <input required placeholder="Title" value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
            <input required placeholder="Slug" value={editing.slug} onChange={e=>setEditing({...editing,slug:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
            <input placeholder="Category" value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
            <input placeholder="Image URL" value={editing.image} onChange={e=>setEditing({...editing,image:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
            <textarea placeholder="Excerpt" rows={2} value={editing.excerpt} onChange={e=>setEditing({...editing,excerpt:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
            <textarea placeholder="Content (Markdown)" rows={6} value={editing.content} onChange={e=>setEditing({...editing,content:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
            <button type="submit" className="hk-btn-primary w-full">Save</button>
          </form>
        </div>
      )}
    </div>
  );
};

const Homepage = () => {
  const [c, setC] = useState({});
  useEffect(() => { api.get("/site-content/homepage").then(r => setC(r.data || {})); }, []);
  const save = async (e) => { e.preventDefault(); await api.put("/admin/site-content/homepage", c); toast.success("Saved"); };
  return (
    <form onSubmit={save} data-testid="admin-homepage" className="max-w-2xl space-y-4">
      <h1 className="font-serif text-4xl mb-6">Homepage / SEO</h1>
      {[["announcement","Announcement Bar"],["hero_title","Hero Title"],["hero_subtitle","Hero Subtitle"],["hero_cta_primary","Hero CTA Primary"],["hero_cta_secondary","Hero CTA Secondary"],["seo_title","SEO Title (homepage)"],["seo_description","SEO Description"],["seo_keywords","SEO Keywords"]].map(([k,l])=>(
        <div key={k}><label className="text-xs uppercase tracking-widest text-hk-olive">{l}</label><textarea rows={k.includes("desc")?3:1} value={c[k]||""} onChange={e=>setC({...c,[k]:e.target.value})} data-testid={`hp-${k}`} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"/></div>
      ))}
      <button type="submit" data-testid="save-homepage" className="hk-btn-primary">Save Changes</button>
    </form>
  );
};

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [pwd, setPwd] = useState("");
  const save = async (e) => { e.preventDefault();
    await api.put("/admin/profile", { name, new_password: pwd || undefined });
    toast.success("Profile updated"); setPwd(""); refreshUser();
  };
  return (
    <form onSubmit={save} data-testid="admin-profile" className="max-w-md space-y-4">
      <h1 className="font-serif text-4xl mb-6">Admin Profile</h1>
      <div><label className="text-xs uppercase tracking-widest text-hk-olive">Email</label><p className="mt-1">{user?.email}</p></div>
      <div><label className="text-xs uppercase tracking-widest text-hk-olive">Name</label><input value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"/></div>
      <div><label className="text-xs uppercase tracking-widest text-hk-olive">New Password (optional)</label><input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} data-testid="new-pwd" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"/></div>
      <button type="submit" data-testid="save-profile" className="hk-btn-primary">Save</button>
    </form>
  );
};

export default Admin;
