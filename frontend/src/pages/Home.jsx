import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Award, Truck, ShieldCheck, Sparkles, Star } from "lucide-react";
import api from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import SEO from "@/components/SEO";

const Home = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get("/products/best-sellers").then((r) => setBestSellers(r.data)).catch(() => {});
    api.get("/products/featured").then((r) => setFeatured(r.data)).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page" className="bg-hk-ivory">
      <SEO title="Premium Ayurvedic Hair & Skin Care" description="HAKKIVEDA — Hakki Pikki Tribal Wisdom, Ayurvedic Healing. Premium herbal hair oil, shampoo, skin care crafted from centuries-old tribal recipes. Pan India delivery, COD available." keywords="hakki pikki ayurveda, tribal herbal hair oil, adivasi hair oil 500ml, premium ayurvedic india" path="/" />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={`${process.env.REACT_APP_BACKEND_URL}/api/static/generated/hero.png`} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "https://images.pexels.com/photos/35778303/pexels-photo-35778303.jpeg"; }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a3d27]/85 via-[#0F5B3A]/65 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-10 py-24 md:py-36 lg:py-44">
          <div className="max-w-2xl text-[#FAF8F3] fade-up">
            <p className="overline text-hk-gold mb-5" style={{ color: "#C9A227" }}>Established · Tribal Heritage · Ayurveda</p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
              The forest's<br />
              <em className="text-hk-gold not-italic font-display italic">centuries-old</em><br />
              secret to wellness.
            </h1>
            <p className="font-display italic text-xl md:text-2xl text-[#FAF8F3]/85 mb-10 max-w-lg">
              Hakki Pikki tribal wisdom, distilled into modern Ayurvedic rituals for hair, skin, and soul.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/shop" className="hk-btn-gold" data-testid="hero-shop-btn">Shop the Collection <ArrowRight size={16} /></Link>
              <Link to="/about" className="hk-btn-secondary" data-testid="hero-story-btn" style={{ color: "#FAF8F3", borderColor: "#FAF8F3" }}>Our Heritage</Link>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-12 text-xs uppercase tracking-[0.2em] text-[#FAF8F3]/80">
              <span className="flex items-center gap-2"><Leaf size={14} /> 100% Herbal</span>
              <span className="flex items-center gap-2"><Award size={14} /> Tribal Formulation</span>
              <span className="flex items-center gap-2"><Truck size={14} /> Pan India</span>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className="bg-hk-green text-[#FAF8F3] py-5 overflow-hidden border-y border-hk-gold/30">
        <div className="flex marquee-track whitespace-nowrap font-serif italic text-2xl md:text-3xl gap-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="flex items-center gap-12">
              Hakki Pikki Tribal Wisdom <span className="text-hk-gold">✦</span> Ayurvedic Healing <span className="text-hk-gold">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-20 md:py-28">
        <div className="text-center mb-14">
          <p className="overline mb-3">Loved by thousands</p>
          <h2 className="font-serif text-4xl md:text-5xl text-hk-charcoal mb-3">Our Most Treasured</h2>
          <p className="text-hk-charcoal/65 max-w-xl mx-auto">Heritage formulations our family of customers returns to, season after season.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        <div className="text-center mt-10">
          <Link to="/shop" className="hk-btn-primary" data-testid="view-all-products">View All Products <ArrowRight size={14}/></Link>
        </div>
      </section>

      {/* Collections Split */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 grid md:grid-cols-2 gap-6 mb-20">
        {[
          { title: "Hair Care", subtitle: "Tribal oils & herbal cleansers", to: "/shop/hair-care", img: "https://images.unsplash.com/photo-1626015449050-46d6f63d6f55?auto=format&fit=crop&w=1200&q=80" },
          { title: "Skin Care", subtitle: "Brightening & restorative rituals", to: "/shop/skin-care", img: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1200&q=80" },
        ].map((c) => (
          <Link to={c.to} key={c.title} className="relative group rounded-2xl overflow-hidden aspect-[4/3] block">
            <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a3d27]/85 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 text-[#FAF8F3]">
              <p className="overline text-hk-gold mb-2" style={{ color: "#C9A227" }}>Collection</p>
              <h3 className="font-serif text-4xl md:text-5xl mb-2">{c.title}</h3>
              <p className="text-[#FAF8F3]/80 mb-4">{c.subtitle}</p>
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] border-b border-hk-gold pb-1">Explore <ArrowRight size={14}/></span>
            </div>
          </Link>
        ))}
      </section>

      {/* AI Quiz CTA */}
      <section className="bg-hk-ivory-warm py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5 lg:px-10 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="overline mb-3">Personalised Ayurveda · Powered by AI</p>
            <h2 className="font-serif text-4xl md:text-5xl text-hk-charcoal mb-5">Discover your ritual<br/>in <em className="text-hk-gold font-display">three minutes</em>.</h2>
            <p className="text-hk-charcoal/70 mb-8 leading-relaxed">Answer a few questions and our Ayurvedic AI will craft a routine matched to your unique hair and skin profile — drawing on the Hakki Pikki tribe's herbal wisdom.</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/quiz/hair" className="hk-btn-primary" data-testid="hair-quiz-cta"><Sparkles size={14}/> Hair Quiz</Link>
              <Link to="/quiz/skin" className="hk-btn-secondary" data-testid="skin-quiz-cta">Skin Quiz</Link>
            </div>
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden">
            <img src="https://images.unsplash.com/photo-1550147760-44c9966d6bc7?auto=format&fit=crop&w=1000&q=80" alt="herbs" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Heritage */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
          <img src="https://images.pexels.com/photos/21316248/pexels-photo-21316248.jpeg" alt="heritage" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="overline mb-3">The Hakki Pikki Heritage</p>
          <h2 className="font-serif text-4xl md:text-5xl text-hk-charcoal mb-6 leading-tight">A tribe of healers,<br/>a legacy of forests.</h2>
          <p className="text-hk-charcoal/70 mb-5 leading-relaxed">The Hakki Pikki — meaning "bird catchers" — are an ancient nomadic tribe of southern India, renowned for their extraordinary knowledge of medicinal herbs. For generations, their healers have walked the forests, gathering remedies passed down through whispered tradition.</p>
          <p className="text-hk-charcoal/70 mb-8 leading-relaxed">HAKKIVEDA is our quiet promise to honour this wisdom — through honest, modern formulations crafted in small batches.</p>
          <Link to="/about" className="hk-btn-secondary">Read Our Story</Link>
        </div>
      </section>

      {/* Ingredients */}
      <section className="bg-[#0a3d27] text-[#FAF8F3] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="text-center mb-14">
            <p className="overline text-hk-gold" style={{color:"#C9A227"}}>Pure · Potent · Tribal</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">Forest-foraged Ingredients</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: "Bhringraj", use: "Hair growth" },
              { name: "Amla", use: "Vitamin C" },
              { name: "Brahmi", use: "Calming" },
              { name: "Neem", use: "Purifying" },
              { name: "Sandalwood", use: "Brightening" },
              { name: "Turmeric", use: "Healing" },
            ].map((h) => (
              <div key={h.name} className="bg-[#0F5B3A] border border-hk-gold/30 rounded-xl p-5 text-center hover:border-hk-gold transition">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-hk-gold/20 flex items-center justify-center">
                  <Leaf className="text-hk-gold" size={22} />
                </div>
                <p className="font-serif text-xl">{h.name}</p>
                <p className="text-xs uppercase tracking-widest text-[#FAF8F3]/60 mt-1">{h.use}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-20 md:py-24">
        <div className="text-center mb-14">
          <p className="overline">The HAKKIVEDA Promise</p>
          <h2 className="font-serif text-4xl md:text-5xl mt-3">Why Choose HAKKIVEDA</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Leaf, t: "100% Herbal", d: "No parabens, sulphates, or synthetic perfumes." },
            { icon: Award, t: "Tribal Recipes", d: "Time-tested formulations from Hakki Pikki elders." },
            { icon: Truck, t: "Pan India · COD", d: "Free shipping on orders above ₹999." },
            { icon: ShieldCheck, t: "Quality Tested", d: "Each batch ISO certified for purity." },
          ].map((f) => (
            <div key={f.t} className="text-center p-6 border border-hk-green/10 rounded-2xl bg-white">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-hk-ivory-warm flex items-center justify-center">
                <f.icon size={22} className="text-hk-green" />
              </div>
              <h3 className="font-serif text-xl mb-2">{f.t}</h3>
              <p className="text-sm text-hk-charcoal/65">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 lg:px-10 py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="overline">Featured</p>
              <h2 className="font-serif text-4xl md:text-5xl mt-2">New & Notable</h2>
            </div>
            <Link to="/shop" className="text-sm uppercase tracking-widest text-hk-green hover:text-hk-gold">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="bg-hk-ivory-warm py-20">
        <div className="max-w-6xl mx-auto px-5 lg:px-10">
          <div className="text-center mb-12">
            <p className="overline">Words from our family</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">Testimonials</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "Priya S.", l: "Mumbai", q: "After six weeks my hair fall has dropped dramatically. The smell is earthy and authentic — I trust every drop.", r: 5 },
              { n: "Rahul V.", l: "Bengaluru", q: "This is the real thing. I have tried every premium brand. Hakkiveda's hair oil is in a league of its own.", r: 5 },
              { n: "Meera K.", l: "Chennai", q: "My pigmentation faded after years of struggle. The cream is gentle, fragrant, and luxurious.", r: 5 },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-hk-gold/25">
                <div className="flex gap-0.5 mb-4">{Array.from({length:t.r}).map((_,j)=><Star key={j} size={15} className="fill-hk-gold text-hk-gold" />)}</div>
                <p className="font-serif italic text-lg text-hk-charcoal mb-5 leading-relaxed">"{t.q}"</p>
                <p className="text-sm font-medium text-hk-green">{t.n} <span className="text-hk-charcoal/45">· {t.l}</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
