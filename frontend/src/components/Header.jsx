import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Heart, User, Menu, X, Search, Phone } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { HakkivedaLogo } from "./Logo";

const Header = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const navItems = [
    { label: "Home", to: "/" },
    { label: "Shop", to: "/shop" },
    { label: "Hair Care", to: "/shop/hair-care" },
    { label: "Skin Care", to: "/shop/skin-care" },
    { label: "Heritage", to: "/about" },
    { label: "Journal", to: "/blog" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "hk-glass shadow-sm" : "bg-transparent"}`} data-testid="site-header">
      {/* Announcement bar */}
      <div className="bg-hk-green text-[#FAF8F3] text-xs tracking-[0.2em] uppercase py-2 text-center font-medium">
        Free Pan India Delivery on orders above ₹999 · COD Available
      </div>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-4 flex items-center justify-between gap-6">
        <HakkivedaLogo size="md" />

        <nav className="hidden lg:flex items-center gap-7" data-testid="primary-nav">
          {navItems.map((n) => (
            <Link key={n.to} to={n.to} className="text-[13px] uppercase tracking-[0.18em] text-hk-charcoal hover:text-hk-green transition font-medium">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 lg:gap-4">
          <a href="tel:+917619536831" data-testid="header-call" className="hidden md:flex items-center gap-2 text-xs uppercase tracking-widest text-hk-green hover:text-hk-gold transition">
            <Phone size={15} />
            <span className="font-medium">+91 76195 36831</span>
          </a>
          <button onClick={() => navigate("/shop")} data-testid="header-search" aria-label="Search" className="p-2 hover:text-hk-gold transition"><Search size={18} /></button>
          <Link to="/wishlist" data-testid="header-wishlist" aria-label="Wishlist" className="p-2 hover:text-hk-gold transition"><Heart size={18} /></Link>
          <Link to={user ? "/account" : "/auth"} data-testid="header-account" aria-label="Account" className="p-2 hover:text-hk-gold transition"><User size={18} /></Link>
          <Link to="/cart" data-testid="header-cart" aria-label="Cart" className="relative p-2 hover:text-hk-gold transition">
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-hk-gold text-[#222] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>
            )}
          </Link>
          <button onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle" aria-label="Menu" className="lg:hidden p-2">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-hk-green/10 bg-[#FAF8F3]" data-testid="mobile-nav">
          <nav className="flex flex-col p-5 gap-4">
            {navItems.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="text-sm uppercase tracking-widest text-hk-charcoal hover:text-hk-green">
                {n.label}
              </Link>
            ))}
            {user && <button onClick={() => { logout(); setOpen(false); }} className="text-sm uppercase tracking-widest text-hk-green text-left">Logout</button>}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
