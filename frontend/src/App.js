import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/AuthContext";
import { CartProvider } from "@/lib/CartContext";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Wishlist from "@/pages/Wishlist";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Auth from "@/pages/Auth";
import Account from "@/pages/Account";
import Quiz from "@/pages/Quiz";
import OrderTracking from "@/pages/OrderTracking";
import Blog from "@/pages/Blog";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:category" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/account" element={<Account />} />
                <Route path="/quiz/:type" element={<Quiz />} />
                <Route path="/track" element={<OrderTracking />} />
                <Route path="/track/:orderId" element={<OrderTracking />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
            <Toaster position="top-center" richColors />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
