import { Link } from "react-router-dom";
import { useCart } from "@/lib/CartContext";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/lib/AuthContext";

const Wishlist = () => {
  const { wishlist } = useCart();
  const { user } = useAuth();
  if (!user) {
    return <div className="max-w-3xl mx-auto px-5 py-24 text-center" data-testid="wishlist-no-auth">
      <h1 className="font-serif text-4xl mb-4">Sign in to view your wishlist</h1>
      <Link to="/auth" className="hk-btn-primary">Sign In</Link>
    </div>;
  }
  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-10 py-14" data-testid="wishlist-page">
      <p className="overline mb-2">Saved for later</p>
      <h1 className="font-serif text-4xl md:text-5xl mb-10">Your Wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-hk-charcoal/65 mb-6">No saved items yet.</p>
          <Link to="/shop" className="hk-btn-primary">Explore Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((p) => <ProductCard key={p.id} product={p}/>)}
        </div>
      )}
    </div>
  );
};
export default Wishlist;
