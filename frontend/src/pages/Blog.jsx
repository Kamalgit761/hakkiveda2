import { Link } from "react-router-dom";

const POSTS = [
  { slug: "ayurveda-101", title: "Ayurveda 101: The Science of Living", category: "Ayurveda", excerpt: "An introduction to the three doshas and finding your unique constitution.", img: "https://images.unsplash.com/photo-1550147760-44c9966d6bc7?auto=format&fit=crop&w=900&q=80" },
  { slug: "hair-fall-remedies", title: "5 Tribal Remedies for Hair Fall", category: "Hair Care", excerpt: "Time-tested herbal solutions passed down through Hakki Pikki generations.", img: "https://images.unsplash.com/photo-1626015449050-46d6f63d6f55?auto=format&fit=crop&w=900&q=80" },
  { slug: "glowing-skin", title: "The Ritual for Glowing Skin", category: "Skin Care", excerpt: "Saffron, sandalwood and turmeric — the trinity of luminous skin.", img: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=80" },
  { slug: "bhringraj-king-of-herbs", title: "Bhringraj: The King of Herbs", category: "Ingredients", excerpt: "Why this single herb is the heart of every Hakkiveda hair formulation.", img: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=900&q=80" },
  { slug: "monsoon-self-care", title: "Monsoon Self-Care Rituals", category: "Lifestyle", excerpt: "How to adapt your wellness routine for the rainy season.", img: "https://images.pexels.com/photos/35210201/pexels-photo-35210201.jpeg" },
  { slug: "tan-removal-naturally", title: "Tan Removal — The Ayurvedic Way", category: "Skin Care", excerpt: "Forget harsh chemicals. Reveal your natural luminescence gently.", img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80" },
];

const Blog = () => (
  <div className="bg-hk-ivory" data-testid="blog-page">
    <section className="bg-hk-ivory-warm py-16 text-center">
      <p className="overline mb-3">The Hakkiveda Journal</p>
      <h1 className="font-serif text-5xl md:text-6xl">Wisdom, Rituals & Recipes</h1>
      <p className="text-hk-charcoal/65 mt-4 max-w-2xl mx-auto px-5">From the forests to your home — essays on Ayurveda, ingredients and slow living.</p>
    </section>
    <section className="max-w-7xl mx-auto px-5 lg:px-10 py-14">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
        {POSTS.map((p) => (
          <article key={p.slug} className="hk-card group" data-testid={`post-${p.slug}`}>
            <div className="aspect-[4/3] overflow-hidden bg-hk-ivory-warm">
              <img src={p.img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
            </div>
            <div className="p-6">
              <p className="overline mb-2">{p.category}</p>
              <h3 className="font-serif text-2xl mb-2 leading-tight">{p.title}</h3>
              <p className="text-sm text-hk-charcoal/65 mb-4">{p.excerpt}</p>
              <Link to="#" className="text-xs uppercase tracking-widest text-hk-green hover:text-hk-gold">Read article →</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  </div>
);
export default Blog;
