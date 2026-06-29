import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { resolveImage } from "@/lib/image";

const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const inWishlist = isInWishlist(product.id);
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <div className="hk-card group" data-testid={`product-card-${product.slug}`}>
      <Link to={`/product/${product.slug}`} className="block relative overflow-hidden bg-hk-ivory-warm aspect-[4/5]">
        <img
          src={resolveImage(product.images?.[0])}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-hk-gold text-[#222] text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full">{discount}% OFF</span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
          data-testid={`wishlist-${product.slug}`}
          aria-label="Wishlist"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white shadow-sm"
        >
          <Heart size={16} className={inWishlist ? "fill-hk-green text-hk-green" : "text-hk-charcoal"} />
        </button>
      </Link>
      <div className="p-5">
        <p className="overline mb-2">{product.category.replace("-", " ")}</p>
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-serif text-xl text-hk-charcoal leading-tight mb-1 hover:text-hk-green transition">{product.name}</h3>
        </Link>
        <p className="text-xs text-hk-charcoal/55 mb-3">{product.subtitle}</p>
        <div className="flex items-center gap-1.5 mb-4 text-xs">
          <Star size={13} className="fill-hk-gold text-hk-gold" />
          <span className="font-semibold">{product.rating}</span>
          <span className="text-hk-charcoal/45">({product.review_count})</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xl font-serif font-semibold text-hk-green">₹{product.price}</p>
            {product.mrp > product.price && <p className="text-xs text-hk-charcoal/45 line-through">₹{product.mrp}</p>}
          </div>
          <button
            onClick={() => addToCart(product)}
            data-testid={`add-cart-${product.slug}`}
            className="text-[10px] uppercase tracking-[0.18em] font-semibold text-hk-green border border-hk-green rounded-full px-4 py-2 hover:bg-hk-green hover:text-[#FAF8F3] transition"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
