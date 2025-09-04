import React from "react";
import { Link } from "react-router-dom";

/**
 * FeaturedProducts
 * Renders a grid of featured items with badges, price (optional) and category links.
 * Data is passed via props or loaded from /src/data/featured.json by the parent.
 */
export default function FeaturedProducts({ items = [] }) {
  if (!items?.length) return null;

  return (
    <section className="py-12">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-3 text-blue-900 dark:text-white tracking-tight">
          Избрани продукти
        </h2>
        <p className="text-lg md:text-xl text-blue-700 dark:text-blue-200 max-w-2xl mx-auto font-medium">
          Специално подбрани предложения за вашия дом и офис
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {items.map((p, idx) => {
          const link = p.link || (p.categorySlug ? `/catalog?category=${encodeURIComponent(p.categorySlug)}` : "/catalog");
          return (
            <Link
              to={link}
              key={idx}
              className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 shadow hover:shadow-xl transition-all duration-300"
            >
              <div
                className="h-60 bg-cover bg-center transform transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url('${p.image}')` }}
                aria-label={p.title}
              />
              {p.badge && (
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-black/80 text-white">
                  {p.badge}
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg line-clamp-2">{p.title}</h3>
                <div className="text-sm mt-1 opacity-80">{p.category || "Категория"}</div>
                {typeof p.price === "number" && (
                  <div className="mt-2 text-base font-bold">{p.price} лв.</div>
                )}
                <div className="mt-3 inline-flex items-center gap-2 text-sm text-blue-700 group-hover:gap-3">
                  Виж повече
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
