import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

const CartCtx = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const refreshCart = async () => {
    if (!user) { setCart([]); return; }
    try { const res = await api.get("/cart"); setCart(res.data); } catch {}
  };

  const refreshWishlist = async () => {
    if (!user) { setWishlist([]); return; }
    try { const res = await api.get("/wishlist"); setWishlist(res.data); } catch {}
  };

  useEffect(() => {
  refreshCart();
  refreshWishlist();
}, [user, refreshCart, refreshWishlist]);

  const addToCart = async (product, qty = 1) => {
    if (!user) { toast.error("Please sign in to add items"); return false; }
    const existing = cart.find((c) => c.id === product.id);
    const newQty = (existing?.qty || 0) + qty;
    await api.post("/cart", { product_id: product.id, qty: newQty });
    await refreshCart();
    toast.success(`${product.name} added to cart`);
    return true;
  };

  const updateQty = async (productId, qty) => {
    await api.post("/cart", { product_id: productId, qty });
    await refreshCart();
  };

  const removeFromCart = async (productId) => {
    await api.delete(`/cart/${productId}`);
    await refreshCart();
  };

  const toggleWishlist = async (product) => {
    if (!user) { toast.error("Please sign in to use wishlist"); return; }
    await api.post("/wishlist", { product_id: product.id });
    await refreshWishlist();
    const isInWishlist = wishlist.find((w) => w.id === product.id);
    toast.success(isInWishlist ? "Removed from wishlist" : "Added to wishlist");
  };

  const isInWishlist = (productId) => wishlist.some((w) => w.id === productId);

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <CartCtx.Provider value={{ cart, wishlist, addToCart, updateQty, removeFromCart, toggleWishlist, isInWishlist, refreshCart, cartTotal, cartCount }}>
      {children}
    </CartCtx.Provider>
  );
};

export const useCart = () => useContext(CartCtx);
