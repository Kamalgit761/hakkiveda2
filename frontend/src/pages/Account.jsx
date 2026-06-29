import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { Package, MapPin, User, LogOut, Heart, Sparkles } from "lucide-react";
import { resolveImage } from "@/lib/image";

const Account = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    api.get("/orders").then((r) => setOrders(r.data)).catch(() => {});
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-10 py-14" data-testid="account-page">
      <div className="bg-white rounded-2xl p-8 border border-hk-green/10 mb-8">
        <p className="overline mb-2">Account</p>
        <h1 className="font-serif text-4xl">Namaste, {user.name}</h1>
        <p className="text-hk-charcoal/65 mt-2">Reward points: <span className="text-hk-gold font-semibold">{user.reward_points || 0}</span></p>
      </div>
      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="space-y-1.5">
          {[
            { k: "orders", l: "Orders", icon: Package },
            { k: "addresses", l: "Addresses", icon: MapPin },
            { k: "profile", l: "Profile", icon: User },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} data-testid={`tab-${t.k}`} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${tab===t.k?"bg-hk-green text-[#FAF8F3]":"text-hk-charcoal hover:bg-white"}`}>
              <t.icon size={16}/> {t.l}
            </button>
          ))}
          <Link to="/wishlist" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm hover:bg-white"><Heart size={16}/> Wishlist</Link>
          <Link to="/quiz/hair" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm hover:bg-white"><Sparkles size={16}/> AI Quiz</Link>
          <button onClick={()=>{logout(); navigate("/");}} data-testid="logout-btn" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-700 hover:bg-red-50"><LogOut size={16}/> Logout</button>
        </aside>

        <div className="lg:col-span-3">
          {tab === "orders" && (
            <div data-testid="orders-tab">
              <h2 className="font-serif text-3xl mb-5">Your Orders</h2>
              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 border border-hk-green/10 text-center">
                  <p className="text-hk-charcoal/65 mb-4">No orders yet.</p>
                  <Link to="/shop" className="hk-btn-primary">Start Shopping</Link>
                </div>
              ) : orders.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl p-6 border border-hk-green/10 mb-4" data-testid={`order-${o.id}`}>
                  <div className="flex flex-wrap justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-hk-olive">Order</p>
                      <p className="font-mono text-sm">{o.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-2xl text-hk-green">₹{o.total}</p>
                      <p className="text-xs text-hk-charcoal/55">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {o.items.slice(0,4).map((it,i)=><img key={i} src={resolveImage(it.image)} alt="" className="w-14 h-14 rounded-lg object-cover bg-hk-ivory-warm"/>)}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <span className="text-xs px-3 py-1 bg-hk-ivory-warm rounded-full uppercase tracking-widest">{o.status}</span>
                    <Link to={`/track/${o.id}`} className="text-xs uppercase tracking-widest text-hk-green hover:text-hk-gold underline">Track →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "addresses" && (
            <div data-testid="addresses-tab">
              <h2 className="font-serif text-3xl mb-5">Saved Addresses</h2>
              {user.addresses?.length ? user.addresses.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl p-5 border border-hk-green/10 mb-3">
                  <p className="font-semibold">{a.full_name} · {a.phone}</p>
                  <p className="text-sm text-hk-charcoal/65 mt-1">{a.line1}{a.line2?", "+a.line2:""}, {a.city}, {a.state} - {a.pincode}</p>
                </div>
              )) : <p className="text-hk-charcoal/55">No saved addresses. Add one during checkout.</p>}
            </div>
          )}
          {tab === "profile" && (
            <div data-testid="profile-tab" className="bg-white rounded-2xl p-7 border border-hk-green/10">
              <h2 className="font-serif text-3xl mb-5">Profile</h2>
              <div className="space-y-3 text-sm">
                <p><span className="text-hk-charcoal/55 uppercase tracking-widest text-xs">Name</span><br/><span className="text-lg">{user.name}</span></p>
                <p><span className="text-hk-charcoal/55 uppercase tracking-widest text-xs">Email</span><br/><span className="text-lg">{user.email}</span></p>
                <p><span className="text-hk-charcoal/55 uppercase tracking-widest text-xs">Reward Points</span><br/><span className="text-lg text-hk-gold font-semibold">{user.reward_points}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Account;
