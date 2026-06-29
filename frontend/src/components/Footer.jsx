import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { HakkivedaLogo } from "./Logo";

const Footer = () => {
  const [email, setEmail] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.post("/newsletter", { email });
      toast.success("Thank you for subscribing!");
      setEmail("");
    } catch {
      toast.error("Subscription failed");
    }
  };

  return (
    <footer className="bg-[#0a3d27] text-[#FAF8F3] mt-24" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2">
          <HakkivedaLogo variant="ivory" size="md" />
          <p className="font-serif italic text-xl mt-5 mb-6 text-[#FAF8F3]/85">
            Hakki Pikki Tribal Wisdom,<br />Ayurvedic Healing.
          </p>
          <p className="text-sm text-[#FAF8F3]/70 leading-relaxed max-w-md">
            Crafted in small batches with herbs foraged from ancient Indian forests. Honouring centuries-old tribal knowledge through modern wellness.
          </p>
          <div className="flex gap-3 mt-6">
            {[Instagram, Facebook, Youtube, Twitter, Linkedin].map((Icon, i) => (
              <a key={i} href="#" aria-label="Social" className="w-9 h-9 rounded-full border border-[#FAF8F3]/30 flex items-center justify-center hover:bg-hk-gold hover:border-hk-gold hover:text-[#222] transition">
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-4 text-hk-gold">Shop</h4>
          <ul className="space-y-2.5 text-sm text-[#FAF8F3]/75">
            <li><Link to="/shop" className="hover:text-hk-gold">All Products</Link></li>
            <li><Link to="/shop/hair-care" className="hover:text-hk-gold">Hair Care</Link></li>
            <li><Link to="/shop/skin-care" className="hover:text-hk-gold">Skin Care</Link></li>
            <li><Link to="/shop/wellness" className="hover:text-hk-gold">Wellness</Link></li>
            <li><Link to="/quiz/hair" className="hover:text-hk-gold">AI Hair Quiz</Link></li>
            <li><Link to="/quiz/skin" className="hover:text-hk-gold">AI Skin Quiz</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-4 text-hk-gold">Customer Care</h4>
          <ul className="space-y-2.5 text-sm text-[#FAF8F3]/75">
            <li><Link to="/contact" className="hover:text-hk-gold">Contact Us</Link></li>
            <li><Link to="/track" className="hover:text-hk-gold">Track Order</Link></li>
            <li><Link to="/about" className="hover:text-hk-gold">Our Heritage</Link></li>
            <li><Link to="/blog" className="hover:text-hk-gold">Journal</Link></li>
            <li><a href="#" className="hover:text-hk-gold">Shipping Policy</a></li>
            <li><a href="#" className="hover:text-hk-gold">Refund Policy</a></li>
            <li><a href="#" className="hover:text-hk-gold">Privacy & Terms</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-4 text-hk-gold">Stay Connected</h4>
          <ul className="space-y-2.5 text-sm text-[#FAF8F3]/75 mb-5">
            <li className="flex items-center gap-2"><Phone size={14} /> <a href="tel:+917619536831" data-testid="footer-call">+91 76195 36831</a></li>
            <li className="flex items-center gap-2"><Mail size={14} /> care@hakkiveda.com</li>
            <li className="flex items-start gap-2"><MapPin size={14} className="mt-1"/> <span>Bengaluru · Karnataka<br/>India</span></li>
          </ul>
          <form onSubmit={submit} data-testid="newsletter-form" className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              data-testid="newsletter-email"
              className="flex-1 px-4 py-2.5 rounded-full bg-[#FAF8F3]/10 border border-[#FAF8F3]/20 text-sm placeholder:text-[#FAF8F3]/40 focus:outline-none focus:border-hk-gold text-[#FAF8F3]"
            />
            <button type="submit" data-testid="newsletter-submit" className="px-4 py-2.5 rounded-full bg-hk-gold text-[#222] text-xs uppercase tracking-widest font-semibold hover:bg-[#FAF8F3] transition">Subscribe</button>
          </form>
        </div>
      </div>
      <div className="border-t border-[#FAF8F3]/10">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-[#FAF8F3]/55">
          <p>© 2026 HAKKIVEDA · All Rights Reserved · Crafted with herbs from the heart of India</p>
          <p className="tracking-widest uppercase">100% Herbal · Cruelty Free · Pan India Delivery</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
