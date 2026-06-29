import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/lib/CartContext";
import { Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { resolveImage } from "@/lib/image";

const Cart = () => {
  const { cart, updateQty, removeFromCart, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-24 text-center" data-testid="cart-no-auth">
        <h1 className="font-serif text-4xl mb-4">Sign in to view your cart</h1>
        <Link to="/auth" className="hk-btn-primary">Sign In / Register</Link>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-24 text-center" data-testid="cart-empty">
        <p className="overline mb-3">Your cart</p>
        <h1 className="font-serif text-5xl mb-4">A pause before your ritual.</h1>
        <p className="text-hk-charcoal/65 mb-8">Discover formulations curated for you.</p>
        <Link to="/shop" className="hk-btn-primary">Explore Products <ArrowRight size={14}/></Link>
      </div>
    );
  }

  const shipping = cartTotal >= 999 ? 0 : 79;
  const total = cartTotal + shipping;

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-10 py-14" data-testid="cart-page">
      <h1 className="font-serif text-4xl md:text-5xl mb-2">Your Cart</h1>
      <p className="text-hk-charcoal/55 mb-10">{cart.length} {cart.length === 1 ? "item" : "items"}</p>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-5 border border-hk-green/10 flex gap-5" data-testid={`cart-item-${item.slug}`}>
              <Link to={`/product/${item.slug}`} className="w-24 h-28 rounded-lg overflow-hidden bg-hk-ivory-warm flex-shrink-0">
                <img src={resolveImage(item.images[0])} alt={item.name} className="w-full h-full object-cover"/>
              </Link>
              <div className="flex-1">
                <Link to={`/product/${item.slug}`} className="font-serif text-xl hover:text-hk-green">{item.name}</Link>
                <p className="text-xs text-hk-charcoal/55 mb-3">{item.subtitle}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-hk-green/20 rounded-full">
                    <button onClick={() => updateQty(item.id, Math.max(0, item.qty - 1))} data-testid={`dec-${item.slug}`} className="px-3 py-1.5"><Minus size={13}/></button>
                    <span className="px-3 text-sm font-medium">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} data-testid={`inc-${item.slug}`} className="px-3 py-1.5"><Plus size={13}/></button>
                  </div>
                  <p className="font-serif text-lg font-semibold text-hk-green">₹{item.price * item.qty}</p>
                  <button onClick={() => removeFromCart(item.id)} data-testid={`rm-${item.slug}`} className="text-hk-charcoal/50 hover:text-red-600"><Trash2 size={16}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-7 border border-hk-green/10 h-fit sticky top-32">
          <h3 className="font-serif text-2xl mb-5">Order Summary</h3>
          <div className="space-y-2.5 text-sm pb-4 border-b border-hk-green/10">
            <div className="flex justify-between"><span className="text-hk-charcoal/65">Subtotal</span><span className="font-medium">₹{cartTotal}</span></div>
            <div className="flex justify-between"><span className="text-hk-charcoal/65">Shipping</span><span className="font-medium">{shipping === 0 ? "Free" : `₹${shipping}`}</span></div>
            {shipping > 0 && <p className="text-xs text-hk-olive italic">Add ₹{999 - cartTotal} more for free shipping</p>}
          </div>
          <div className="flex justify-between pt-4 mb-6">
            <span className="font-serif text-lg">Total</span>
            <span className="font-serif text-2xl font-semibold text-hk-green">₹{total}</span>
          </div>
          <button onClick={() => navigate("/checkout")} data-testid="checkout-btn" className="hk-btn-primary w-full">Proceed to Checkout</button>
          <Link to="/shop" className="block text-center mt-4 text-xs uppercase tracking-widest text-hk-charcoal/65 hover:text-hk-green">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
