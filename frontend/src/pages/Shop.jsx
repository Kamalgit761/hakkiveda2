import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Search } from "lucide-react";

const Shop = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState("featured");

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category) params.category = category;
    if (search) params.search = search;
    api.get("/products", { params }).then((r) => {
      let data = [...r.data];
      if (sort === "price-low") data.sort((a, b) => a.price - b.price);
      else if (sort === "price-high") data.sort((a, b) => b.price - a.price);
      else if (sort === "rating") data.sort((a, b) => b.rating - a.rating);
      setProducts(data);
    }).finally(() => setLoading(false));
  }, [category, search, sort]);

  const categoryLabel = category ? category.replace("-", " ") : "All Products";

  return (
    <div data-testid="shop-page" className="bg-hk-ivory">
      <section className="bg-hk-ivory-warm py-16 md:py-20 border-b border-hk-green/10">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 text-center">
          <p className="overline mb-3">Shop the Collection</p>
          <h1 className="font-serif text-5xl md:text-6xl text-hk-charcoal capitalize">{categoryLabel}</h1>
          <p className="text-hk-charcoal/65 mt-4 max-w-xl mx-auto">Heritage formulations, crafted in small batches with herbs from ancient Indian forests.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-12">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-hk-charcoal/40" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              data-testid="shop-search"
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-hk-green/15 text-sm focus:outline-none focus:border-hk-green"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            data-testid="shop-sort"
            className="px-5 py-3 rounded-full bg-white border border-hk-green/15 text-sm focus:outline-none focus:border-hk-green"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-hk-charcoal/50">Loading…</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20" data-testid="no-products">
            <p className="font-serif text-2xl text-hk-charcoal mb-2">No products found</p>
            <p className="text-hk-charcoal/60">Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="product-grid">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
};

export default Shop;
