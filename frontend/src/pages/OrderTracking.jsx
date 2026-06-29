import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { CheckCircle2, Circle, Package, Truck, Home as HomeIcon, MapPin } from "lucide-react";

const Tracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [inputId, setInputId] = useState(orderId || "");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (orderId) {
      api.get(`/orders/${orderId}`).then((r) => setOrder(r.data)).catch(() => setError("Order not found or not yours"));
    }
  }, [orderId]);

  const lookup = (e) => {
    e.preventDefault();
    if (inputId) navigate(`/track/${inputId.trim()}`);
  };

  if (!orderId) {
    return (
      <div className="max-w-xl mx-auto px-5 py-20 text-center" data-testid="track-lookup">
        <p className="overline mb-3">Track Your Order</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-6">Where's my order?</h1>
        <form onSubmit={lookup} className="flex gap-3 max-w-md mx-auto">
          <input value={inputId} onChange={(e)=>setInputId(e.target.value)} placeholder="HKV20260101ABC123" data-testid="track-input" className="flex-1 px-4 py-3 rounded-full bg-white border border-hk-green/20 text-sm focus:outline-none focus:border-hk-green"/>
          <button type="submit" data-testid="track-submit" className="hk-btn-primary">Track</button>
        </form>
      </div>
    );
  }

  if (error) return <div className="max-w-xl mx-auto px-5 py-20 text-center"><p className="text-red-600">{error}</p></div>;
  if (!order) return <div className="text-center py-20 text-hk-charcoal/55">Loading…</div>;

  const icons = [Package, Package, Truck, Truck, HomeIcon];

  return (
    <div className="max-w-3xl mx-auto px-5 py-14" data-testid="track-page">
      <p className="overline mb-2">Order Tracking</p>
      <h1 className="font-serif text-4xl md:text-5xl mb-2">{order.id}</h1>
      <p className="text-hk-charcoal/65 mb-10">Placed on {new Date(order.created_at).toLocaleDateString()}</p>

      <div className="bg-white rounded-2xl p-8 border border-hk-green/10 mb-8">
        <h2 className="font-serif text-2xl mb-6">Delivery Progress</h2>
        <div className="space-y-5">
          {order.tracking_stages.map((s, i) => {
            const Icon = icons[i] || Circle;
            return (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.completed?"bg-hk-green text-[#FAF8F3]":"bg-hk-ivory-warm text-hk-charcoal/40"}`}>
                  {s.completed ? <CheckCircle2 size={18}/> : <Icon size={18}/>}
                </div>
                <div className="flex-1 pt-1.5">
                  <p className={`font-semibold ${s.completed?"text-hk-green":"text-hk-charcoal/55"}`}>{s.stage}</p>
                  {s.at && <p className="text-xs text-hk-charcoal/55 mt-0.5">{new Date(s.at).toLocaleString()}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-7 border border-hk-green/10">
        <h3 className="font-serif text-xl mb-4">Delivery Address</h3>
        <p className="text-sm flex items-start gap-2"><MapPin size={14} className="mt-1 text-hk-green"/><span>{order.address.full_name} · {order.address.phone}<br/>{order.address.line1}, {order.address.city}, {order.address.state} - {order.address.pincode}</span></p>
        <hr className="my-5 border-hk-green/10"/>
        <div className="space-y-2 text-sm">
          {order.items.map((it,i)=>(<div key={i} className="flex justify-between"><span>{it.name} × {it.qty}</span><span>₹{it.price * it.qty}</span></div>))}
          <hr className="border-hk-green/10"/>
          <div className="flex justify-between font-serif text-lg pt-2"><span>Total</span><span className="text-hk-green font-semibold">₹{order.total}</span></div>
        </div>
      </div>
    </div>
  );
};
export default Tracking;
