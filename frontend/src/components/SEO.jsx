import { useEffect } from "react";

const DEFAULTS = {
  brand: "HAKKIVEDA",
  tagline: "Hakki Pikki Tribal Wisdom, Ayurvedic Healing",
  description: "HAKKIVEDA blends the centuries-old herbal wisdom of the Hakki Pikki tribe with Ayurveda — premium hair care, skin care and wellness rituals crafted in small batches across India.",
  keywords: "hakki pikki tribe, ayurveda, ayurvedic, tribal herbal, adivasi hair oil, herbal hair oil india, hakki pikki ayurveda, tribal ayurveda, premium ayurvedic brand, hakkiveda",
  domain: "https://hakkiveda.com",
  ogImage: "https://hakkiveda.com/og-default.jpg",
};

const upsertMeta = (selector, attrs) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(attrs.tag || "meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "tag") return;
    if (k === "text") el.textContent = v;
    else el.setAttribute(k, v);
  });
};

const SEO = ({ title, description, keywords, image, type = "website", path = "", product = null }) => {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${DEFAULTS.brand}` : `${DEFAULTS.brand} · ${DEFAULTS.tagline}`;
    const desc = description || DEFAULTS.description;
    const kw = keywords ? `${DEFAULTS.keywords}, ${keywords}` : DEFAULTS.keywords;
    const url = `${DEFAULTS.domain}${path || window.location.pathname}`;
    const img = image || DEFAULTS.ogImage;

    document.title = fullTitle;
    upsertMeta('meta[name="description"]', { name: "description", content: desc });
    upsertMeta('meta[name="keywords"]', { name: "keywords", content: kw });
    upsertMeta('link[rel="canonical"]', { tag: "link", rel: "canonical", href: url });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: desc });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: img });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: DEFAULTS.brand });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: desc });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: img });
    upsertMeta('meta[name="theme-color"]', { name: "theme-color", content: "#0F5B3A" });

    const jsonLd = product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.short_description,
          image: product.images,
          brand: { "@type": "Brand", name: "HAKKIVEDA" },
          sku: product.slug,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.review_count,
          },
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "INR",
            price: product.price,
            availability: "https://schema.org/InStock",
          },
        }
      : {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: DEFAULTS.brand,
          url: DEFAULTS.domain,
          description: DEFAULTS.description,
          slogan: DEFAULTS.tagline,
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+91 76195 36831",
            contactType: "customer service",
            areaServed: "IN",
          },
        };

    let ld = document.head.querySelector('script[type="application/ld+json"][data-seo]');
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.setAttribute("data-seo", "true");
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(jsonLd);
  }, [title, description, keywords, image, type, path, product]);

  return null;
};

export default SEO;
