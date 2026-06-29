import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { Heart, Star, Truck, ShieldCheck, Leaf, ChevronDown, Share2 } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import ProductCard from "@/components/ProductCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { resolveImage } from "@/lib/image";
import SEO from "@/components/SEO";

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  useEffect(() => {
    api.get(`/products/${slug}`).then((r) => { setProduct(r.data); setActive(0); }).catch(() => setProduct(null));
    window.scrollTo(0, 0);
  }, [slug]);

  if (!product) return <div className="min-h-[60vh] flex items-center justify-center text-hk-charcoal/50">Loading…</div>;

  const inWishlist = isInWishlist(product.id);
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const handleBuy = async () => {
    const ok = await addToCart(product, qty);
    if (ok) navigate("/checkout");
  };

  const share = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: product.name, url });
    else { navigator.clipboard.writeText(url); toast.success("Link copied"); }
  };

  return (
    <div data-testid="product-detail" className="bg-hk-ivory">
      <SEO
        title={product.name}
        description={product.short_description}
        keywords={`${product.name}, ${product.category}, ayurvedic, hakki pikki`}
        image={resolveImage(product.images?.[0])}
        type="product"
        path={`/product/${product.slug}`}
        product={product}
      />
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-10 md:py-14">
        <nav className="text-xs uppercase tracking-widest text-hk-charcoal/55 mb-6">
          <Link to="/" className="hover:text-hk-green">Home</Link> · <Link to="/shop" className="hover:text-hk-green">Shop</Link> · <span className="text-hk-charcoal">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-hk-ivory-warm mb-4" data-testid="product-main-image">
              <img src={resolveImage(product.images[active])} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActive(i)} data-testid={`thumb-${i}`} className={`aspect-square rounded-lg overflow-hidden border-2 transition ${active === i ? "border-hk-gold" : "border-transparent"}`}>
                  <img src={resolveImage(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="overline mb-3">{product.category.replace("-", " ")}</p>
            <h1 className="font-serif text-4xl md:text-5xl text-hk-charcoal leading-tight">{product.name}</h1>
            <p className="text-hk-charcoal/60 mt-2">{product.subtitle}</p>
            <p className="font-display italic text-xl text-hk-olive mt-4">"{product.tagline}"</p>

            <div className="flex items-center gap-2 mt-5 text-sm">
              {Array.from({length:5}).map((_,i)=><Star key={i} size={15} className={i<Math.round(product.rating)?"fill-hk-gold text-hk-gold":"text-hk-charcoal/20"}/>)}
              <span className="font-semibold ml-1">{product.rating}</span>
              <span className="text-hk-charcoal/55">({product.review_count} reviews)</span>
            </div>

            <div className="flex items-baseline gap-3 mt-6">
              <span className="font-serif text-4xl text-hk-green font-semibold">₹{product.price}</span>
              {product.mrp > product.price && (
                <>
                  <span className="text-lg text-hk-charcoal/40 line-through">₹{product.mrp}</span>
                  <span className="text-xs bg-hk-gold text-[#222] px-2 py-1 rounded-full font-semibold uppercase tracking-wider">{discount}% Off</span>
                </>
              )}
            </div>

            <p className="text-hk-charcoal/75 leading-relaxed mt-6">{product.short_description}</p>

            <div className="flex items-center gap-3 mt-8">
              <div className="flex items-center border border-hk-green/30 rounded-full">
                <button onClick={() => setQty(Math.max(1, qty - 1))} data-testid="qty-decrease" className="px-4 py-2.5 hover:text-hk-green">−</button>
                <span className="px-3 font-medium" data-testid="qty-value">{qty}</span>
                <button onClick={() => setQty(qty + 1)} data-testid="qty-increase" className="px-4 py-2.5 hover:text-hk-green">+</button>
              </div>
              <button onClick={() => addToCart(product, qty)} data-testid="add-to-cart-btn" className="hk-btn-primary flex-1">Add to Cart</button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <button onClick={handleBuy} data-testid="buy-now-btn" className="hk-btn-gold col-span-1">Buy Now</button>
              <button onClick={() => toggleWishlist(product)} data-testid="wishlist-btn" className="border border-hk-green/30 rounded-full px-4 py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-hk-green hover:bg-hk-green hover:text-[#FAF8F3] transition">
                <Heart size={14} className={inWishlist?"fill-current":""}/> {inWishlist?"Saved":"Wishlist"}
              </button>
              <button onClick={share} data-testid="share-btn" className="border border-hk-green/30 rounded-full px-4 py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-hk-green hover:bg-hk-green hover:text-[#FAF8F3] transition">
                <Share2 size={14}/> Share
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6 text-xs">
              <div className="text-center p-3 bg-white rounded-xl border border-hk-green/10">
                <Truck className="mx-auto text-hk-green mb-1" size={18} />
                <p className="text-hk-charcoal/70">Pan India · Free above ₹999</p>
              </div>
              <div className="text-center p-3 bg-white rounded-xl border border-hk-green/10">
                <Leaf className="mx-auto text-hk-green mb-1" size={18} />
                <p className="text-hk-charcoal/70">100% Herbal</p>
              </div>
              <div className="text-center p-3 bg-white rounded-xl border border-hk-green/10">
                <ShieldCheck className="mx-auto text-hk-green mb-1" size={18} />
                <p className="text-hk-charcoal/70">Quality Tested</p>
              </div>
            </div>

            <Accordion type="single" collapsible className="mt-8" defaultValue="benefits">
              <AccordionItem value="benefits" data-testid="acc-benefits">
                <AccordionTrigger className="font-serif text-lg">Benefits</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-hk-charcoal/75">
                    {product.benefits.map((b, i) => <li key={i} className="flex gap-2"><span className="text-hk-gold">✦</span> {b}</li>)}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ingredients" data-testid="acc-ingredients">
                <AccordionTrigger className="font-serif text-lg">Key Ingredients</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
                    {product.ingredients.map((ing, i) => <span key={i} className="text-xs px-3 py-1.5 bg-hk-ivory-warm rounded-full text-hk-green border border-hk-green/15">{ing}</span>)}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="directions" data-testid="acc-directions">
                <AccordionTrigger className="font-serif text-lg">How to Use</AccordionTrigger>
                <AccordionContent className="text-sm text-hk-charcoal/75 leading-relaxed">{product.directions}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="suitable" data-testid="acc-suitable">
                <AccordionTrigger className="font-serif text-lg">Suitable For</AccordionTrigger>
                <AccordionContent className="text-sm text-hk-charcoal/75">{product.suitable_for}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="faqs" data-testid="acc-faqs">
                <AccordionTrigger className="font-serif text-lg">FAQs</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {product.faqs?.map((f, i) => (
                      <div key={i}>
                        <p className="font-semibold text-hk-green text-sm">{f.q}</p>
                        <p className="text-sm text-hk-charcoal/70 mt-1">{f.a}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-20" data-testid="reviews-section">
          <h2 className="font-serif text-3xl md:text-4xl mb-2">Customer Reviews</h2>
          <p className="text-hk-charcoal/55 mb-8">From verified buyers</p>
          {product.reviews?.length ? (
            <div className="grid md:grid-cols-2 gap-5">
              {product.reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl p-6 border border-hk-green/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-hk-charcoal">{r.user_name} {r.verified && <span className="text-[10px] uppercase tracking-widest text-hk-olive ml-2 border border-hk-olive/30 px-1.5 py-0.5 rounded">Verified</span>}</p>
                      <div className="flex gap-0.5 mt-1">{Array.from({length:5}).map((_,j)=><Star key={j} size={12} className={j<r.rating?"fill-hk-gold text-hk-gold":"text-hk-charcoal/20"}/>)}</div>
                    </div>
                  </div>
                  <p className="font-serif font-semibold text-lg mb-2">{r.title}</p>
                  <p className="text-sm text-hk-charcoal/70 leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-hk-charcoal/50">No reviews yet — be the first!</p>}
        </div>

        {/* Related */}
        {product.related?.length > 0 && (
          <div className="mt-20">
            <h2 className="font-serif text-3xl md:text-4xl mb-8">You may also love</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {product.related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProductDetail;
