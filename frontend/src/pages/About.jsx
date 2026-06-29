import { Leaf, Heart, Award, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => (
  <div data-testid="about-page" className="bg-hk-ivory">
    <section className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden">
      <img src="https://images.pexels.com/photos/35778303/pexels-photo-35778303.jpeg" alt="" className="w-full h-full object-cover"/>
      <div className="absolute inset-0 bg-[#0a3d27]/65 flex items-center justify-center">
        <div className="text-center text-[#FAF8F3] px-5">
          <p className="overline text-hk-gold mb-3" style={{color:"#C9A227"}}>Our Heritage</p>
          <h1 className="font-serif text-5xl md:text-7xl">The Hakki Pikki Story</h1>
          <p className="font-display italic text-xl mt-4 text-[#FAF8F3]/85">A tribe of healers · A legacy of forests</p>
        </div>
      </div>
    </section>

    <section className="max-w-4xl mx-auto px-5 lg:px-10 py-20 prose">
      <p className="font-display italic text-2xl text-hk-olive text-center mb-12">"The forest is the original pharmacy. We are merely her humble messengers."</p>

      <h2 className="font-serif text-4xl mb-4">A Tribe of Bird Catchers — and Herb Healers</h2>
      <p className="text-hk-charcoal/75 leading-relaxed mb-6">The Hakki Pikki — literally "bird catchers" in Kannada — are an ancient nomadic tribe of southern India. For centuries they have lived in symbiosis with the forests of Karnataka, Andhra Pradesh, Tamil Nadu and Maharashtra. While the world knows them for their hunting prowess, those who have lived among them know a deeper truth: they are extraordinary healers.</p>
      <p className="text-hk-charcoal/75 leading-relaxed mb-10">Their grandmothers can name two thousand medicinal plants by leaf alone. Their elders can stop a child's fever with a poultice of seven herbs. Their hair, even at seventy, remains thick, dark, and lustrous.</p>

      <h2 className="font-serif text-4xl mb-4">The Vow Behind HAKKIVEDA</h2>
      <p className="text-hk-charcoal/75 leading-relaxed mb-6">HAKKIVEDA was founded with a single promise: that the Hakki Pikki's wisdom would never be lost to time. Every formulation is created in close collaboration with tribal elders, with fair compensation, full credit, and a portion of every sale returned to the community through education and forest-restoration programs.</p>
      <p className="text-hk-charcoal/75 leading-relaxed mb-10">We blend their ancient recipes with the timeless principles of Ayurveda, then craft each batch in small quantities in our GMP-certified facility — honouring both heritage and modern standards.</p>

      <div className="grid md:grid-cols-2 gap-6 my-14">
        {[
          { icon: Leaf, t: "100% Herbal", d: "No parabens, sulphates, mineral oils or synthetic perfumes — ever." },
          { icon: Heart, t: "Tribal Partnership", d: "Direct collaboration with Hakki Pikki elders and fair compensation." },
          { icon: Award, t: "Small-Batch Craft", d: "Each formulation crafted in limited runs to ensure freshness and potency." },
          { icon: Sparkles, t: "Modern Ayurveda", d: "Time-tested recipes meet contemporary scientific standards." },
        ].map((f) => (
          <div key={f.t} className="bg-white rounded-2xl p-7 border border-hk-green/10">
            <f.icon className="text-hk-gold mb-3" size={26}/>
            <h3 className="font-serif text-2xl mb-2">{f.t}</h3>
            <p className="text-sm text-hk-charcoal/70">{f.d}</p>
          </div>
        ))}
      </div>

      <h2 className="font-serif text-4xl mb-4">From Forest to Bottle</h2>
      <p className="text-hk-charcoal/75 leading-relaxed mb-12">Every Hakkiveda product is the result of weeks of slow, deliberate work — herbs gathered at the right lunar phase, sun-dried on stone, cold-pressed in copper, infused for days in ancestral oil bases. We bottle them in amber glass, label them with handmade paper, and ship them to your doorstep across India.</p>

      <div className="text-center py-10 border-t border-b border-hk-green/15">
        <p className="font-serif italic text-3xl text-hk-charcoal mb-2">Hakki Pikki Tribal Wisdom,</p>
        <p className="font-serif italic text-3xl text-hk-green mb-6">Ayurvedic Healing.</p>
        <Link to="/shop" className="hk-btn-primary">Discover the Collection</Link>
      </div>
    </section>
  </div>
);
export default About;
