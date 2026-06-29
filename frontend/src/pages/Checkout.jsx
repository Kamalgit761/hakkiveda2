import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, Truck, ShieldCheck } from "lucide-react";
import { resolveImage } from "@/lib/image";

const Checkout = () => {
  const { cart, cartTotal, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addr, setAddr] = useState({ full_name: user?.name || "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India", is_default: true });
  const [payment, setPayment] = useState("cod");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [placed, setPlaced] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user) { navigate("/auth"); return null; }
  if (!cart.length && !placed) { navigate("/cart"); return null; }

  const shipping = cartTotal >= 999 ? 0 : 79;
  const total = cartTotal - discount + shipping;

  const applyCoupon = async () => {
    if (!coupon) return;
    try {
      const res = await api.post("/validate-coupon", { code: coupon, subtotal: cartTotal });
      setDiscount(res.data.discount);
      toast.success(`Coupon applied: ₹${res.data.discount} off`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Invalid coupon");
      setDiscount(0);
    }
  };

  const place = async (e) => {
    e.preventDefault();
    if (!addr.full_name || !addr.phone || !addr.line1 || !addr.city || !addr.state || !addr.pincode) {
      toast.error("Please complete the address"); return;
    }
    setLoading(true);
    try {
      const res = await api.post("/checkout", { address: addr, payment_method: payment, coupon_code: coupon || null });
      setPlaced(res.data);
      await refreshCart();
      toast.success("Order placed!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (placed) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center" data-testid="order-confirmed">
        <CheckCircle2 className="mx-auto text-hk-green mb-4" size={60} />
        <p className="overline mb-2">Order confirmed</p>
        <h1 className="font-serif text-5xl mb-3">Dhanyavaad 🙏</h1>
        <p className="text-hk-charcoal/65 mb-5">Your tribal wellness ritual is on its way.</p>
        <div className="bg-white rounded-2xl p-6 border border-hk-green/10 my-8 text-left">
          <p className="text-sm text-hk-charcoal/60 mb-1">Order ID</p>
          <p className="font-mono text-lg text-hk-green font-semibold" data-testid="order-id">{placed.id}</p>
          <p className="font-serif text-2xl mt-3">Total: ₹{placed.total}</p>
          <p className="text-sm text-hk-charcoal/65 mt-1">Payment: {placed.payment_method === "cod" ? "Cash on Delivery" : "Online (Mock)"}</p>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to={`/track/${placed.id}`} className="hk-btn-primary">Track Order</Link>
          <Link to="/shop" className="hk-btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-10 py-14" data-testid="checkout-page">
      <h1 className="font-serif text-4xl md:text-5xl mb-10">Checkout</h1>
      <form onSubmit={place} className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-2xl p-7 border border-hk-green/10">
            <h2 className="font-serif text-2xl mb-5">Shipping Address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ["full_name","Full Name"],["phone","Phone (10 digit)"],["line1","Address Line 1"],["line2","Address Line 2 (optional)"],["city","City"],["state","State"],["pincode","Pincode"],["country","Country"]
              ].map(([k,l]) => (
                <input key={k} required={k!=="line2"} placeholder={l} value={addr[k]} onChange={(e)=>setAddr({...addr,[k]:e.target.value})} data-testid={`addr-${k}`} className="px-4 py-3 rounded-lg border border-hk-green/20 bg-hk-ivory text-sm focus:outline-none focus:border-hk-green"/>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-7 border border-hk-green/10">
            <h2 className="font-serif text-2xl mb-5">Payment Method</h2>
            <div className="space-y-3">
              <label className={`block p-5 rounded-xl border-2 cursor-pointer transition ${payment==="cod"?"border-hk-green bg-hk-ivory-warm":"border-hk-green/15"}`} data-testid="pay-cod">
                <input type="radio" name="pay" checked={payment==="cod"} onChange={()=>setPayment("cod")} className="mr-3"/>
                <span className="font-medium">Cash on Delivery (COD)</span>
                <p className="text-xs text-hk-charcoal/60 mt-1 ml-7">Pay when your order arrives. Available pan India.</p>
              </label>
              <label className={`block p-5 rounded-xl border-2 cursor-pointer transition ${payment==="mock_online"?"border-hk-green bg-hk-ivory-warm":"border-hk-green/15"}`} data-testid="pay-online">
                <input type="radio" name="pay" checked={payment==="mock_online"} onChange={()=>setPayment("mock_online")} className="mr-3"/>
                <span className="font-medium">Online Payment <span className="text-xs text-hk-olive uppercase tracking-widest ml-2">Mock</span></span>
                <p className="text-xs text-hk-charcoal/60 mt-1 ml-7">Razorpay-ready — instant confirmation (demo mode).</p>
              </label>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-7 border border-hk-green/10">
            <h2 className="font-serif text-2xl mb-5">Have a coupon?</h2>
            <div className="flex gap-3">
              <input placeholder="TRIBAL10, AYUR20, HAKKI500" value={coupon} onChange={(e)=>setCoupon(e.target.value.toUpperCase())} data-testid="coupon-input" className="flex-1 px-4 py-3 rounded-lg border border-hk-green/20 bg-hk-ivory text-sm focus:outline-none focus:border-hk-green"/>
              <button type="button" onClick={applyCoupon} data-testid="apply-coupon" className="hk-btn-secondary px-6">Apply</button>
            </div>
            <p className="text-xs text-hk-charcoal/55 mt-2">Try: TRIBAL10 (10% off), AYUR20 (20% off above ₹1500), HAKKI500 (₹500 off above ₹2500)</p>
          </section>
        </div>

        <aside className="bg-white rounded-2xl p-7 border border-hk-green/10 h-fit sticky top-32">
          <h3 className="font-serif text-2xl mb-5">Order Summary</h3>
          <div className="space-y-3 mb-5 max-h-60 overflow-y-auto">
            {cart.map((it) => (
              <div key={it.id} className="flex gap-3 text-sm">
                <img src={resolveImage(it.images[0])} alt="" className="w-14 h-14 rounded-lg object-cover bg-hk-ivory-warm"/>
                <div className="flex-1">
                  <p className="font-medium leading-tight">{it.name}</p>
                  <p className="text-xs text-hk-charcoal/55">Qty {it.qty} · ₹{it.price * it.qty}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm pb-4 border-b border-hk-green/10">
            <div className="flex justify-between"><span className="text-hk-charcoal/65">Subtotal</span><span>₹{cartTotal}</span></div>
            {discount > 0 && <div className="flex justify-between text-hk-olive"><span>Coupon discount</span><span>−₹{discount}</span></div>}
            <div className="flex justify-between"><span className="text-hk-charcoal/65">Shipping</span><span>{shipping===0?"Free":`₹${shipping}`}</span></div>
          </div>
          <div className="flex justify-between pt-4 mb-6">
            <span className="font-serif text-lg">Total</span>
            <span className="font-serif text-2xl font-semibold text-hk-green">₹{total.toFixed(0)}</span>
          </div>
          <button type="submit" disabled={loading} data-testid="place-order-btn" className="hk-btn-primary w-full disabled:opacity-50">{loading?"Placing…":"Place Order"}</button>
          <div className="flex items-center gap-2 text-xs text-hk-charcoal/55 mt-4 justify-center"><ShieldCheck size={14}/> 100% Secure · <Truck size={14}/> Pan India</div>
        </aside>
      </form>
    </div>
  );
};

export default Checkout;
