 import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "../components/Helmet";
import Category from "../../../server/models/Category";

import { useNavigate } from "react-router-dom";
import ModalProductDetails from "../components/ModalProductDetails";
import FeaturedProducts from "../components/FeaturedProducts";
import featured from "../data/featured.json";

// --- Динамичен компонент за препоръчания продукт KALISZ ---
function ProductCardRecommendedKalisz() {
  const [product, setProduct] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const navigate = useNavigate();
  // Реалното id на KALISZ
  const productId = "68a2d7e9302c7cc8ea143c2a";

  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setProduct(data))
      .catch(() => setProduct(null));
  }, []);

  if (!product) return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-3xl border border-blue-100 dark:border-gray-700">
      <span className="text-gray-400">Продуктът не е намерен</span>
    </div>
  );

  return (
    <>
      <div
        className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-blue-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div
          className="h-64 bg-cover bg-center transition-transform duration-700 hover:scale-110"
          style={{ backgroundImage: `url('${product.image}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
          <div className="absolute bottom-4 left-4 text-white drop-shadow-lg">
            <h3 className="font-bold text-xl mb-1">{product.name}</h3>
            <p className="text-base text-blue-200 font-medium">Градинско осветление</p>
          </div>
        </div>
      </div>
      {showModal && (
        <ModalProductDetails productId={productId} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}


export default function Home() {
  // --- Форма за качване на много снимки по URL ---
  const [imageUrls, setImageUrls] = useState([""]);
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [submitMsg, setSubmitMsg] = useState("");
  const handleImageUrlChange = (idx, value) => {
    const newUrls = [...imageUrls];
    newUrls[idx] = value;
    setImageUrls(newUrls);
  };
  const addImageField = () => setImageUrls([...imageUrls, ""]);
  const removeImageField = (idx) => setImageUrls(imageUrls.filter((_, i) => i !== idx));

  // Submit handler за създаване на продукт с images
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSubmitMsg("");
    const images = imageUrls.filter(Boolean);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          description: productDesc,
          price: Number(productPrice),
          images: JSON.stringify(images)
        })
      });
      if (res.ok) {
        setSubmitMsg("Продуктът е създаден успешно!");
        setProductName(""); setProductDesc(""); setProductPrice(""); setImageUrls([""]);
      } else {
        setSubmitMsg("Грешка при създаване на продукт!");
      }
    } catch {
      setSubmitMsg("Грешка при заявката!");
    }
  };
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "Иновативен дизайн",
      description: "Модерни и елегантни решения за осветление"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Енергийна ефективност",
      description: "LED технология за максимална икономия"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Гарантирано качество",
      description: "Премиум материали и дълголетие"
    }
  ];

  // Модерни снимки за слайдшоу
  const bgImages = [
    "https://www.eglo.com/media/wysiwyg/dining_room_mobile_7.jpg",
    "https://koala.sh/api/image/v2-hg47m-ne4af.jpg?width=1216&height=832&dream",
    "https://art-rasvjeta.hr/images/news/008370_ins001_rain_pl3jpg_GQ4G10.jpg",
    "https://media.adeo.com/mkp/c7bd3a4aa10518ce2db373961294c383/media.jpeg?width=3000&height=3000&format=jpg&quality=80&fit=bounds",
    "https://www.eglo.com/media/wysiwyg/modern-web_32.jpg"
  ];
  const [bgIndex, setBgIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Helmet>
        <title>MARK LIGHT LTD</title>
        <meta name="description" content="Луксозно осветление за дома и бизнеса. Модерни и елегантни решения за осветление, LED технологии, премиум качество и иновации." />
      </Helmet>
      <div className="space-y-24">
        {/* Hero Section with Beautiful Images */}
        <section className="relative h-[400px] md:h-[520px] lg:h-[650px] flex items-stretch justify-stretch overflow-hidden p-0 m-0">
          {/* Оригинален тъмен background */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 z-0" />
          {/* Hero Main Image (slideshow) */}
          <div className="absolute inset-0 w-full h-full opacity-40 transition-all duration-1000 z-10">
            <div
              className="w-full h-full bg-cover bg-center transition-all duration-1000"
              style={{ backgroundImage: `url('${bgImages[bgIndex]}')`, transition: 'background-image 1s ease-in-out', minHeight: '100%', height: '100%' }}
            />
          </div>
          {/* Firm Name and Slogan */}
          <div className="absolute inset-0 w-full h-full z-20 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-2xl mb-4 bg-black/40 px-6 py-2 rounded-xl inline-block">
              MARK LIGHT LTD
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-blue-100 font-medium drop-shadow-lg bg-black/30 px-4 py-2 rounded-xl inline-block">
              Луксозно осветление за дома и бизнеса
            </p>
          </div>
        </section>
  {/* ...existing code... */}

        {/* Препоръчани продукти */}
  <section className="py-8 md:py-10 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-blue-900 dark:text-white tracking-tight drop-shadow-lg">
              Препоръчани продукти
            </h2>
            <p className="text-xl text-blue-700 dark:text-blue-200 max-w-2xl mx-auto font-medium">
              Нашите експерти препоръчват тези продукти за вашия дом и офис
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Статични продукти */}
            {[
              {
                image: "https://www.lampite.bg/zuma-line-mx4463-3-3wbt-led-tavan-salo-led-46w-230v-ceren-img-zl0461_1-fd-10.jpg",
                title: "LED Модерен полилей",
                category: "LED Полилеи",
                link: "/product/68a3628525438cfa6df64c1b"
              },
              {
                image: "https://www.lampite.bg/visjasc-polilei-3xe27-60w-230v-img-ve0315-fd-2.webp",
                title: "Полилеи",
                category: "Полилеи",
                link: "/product/68a0eb4194393c5c5d20dea2"
              },
              {
                image: "https://ultralight.bg/image/cache/catalog/products/RABALUX/2229-2-500x500.jpg",
                title: "LED Плафони",
                category: "LED Плафони",
                link: "/product/68a452b29ac68f9c43cfedd5"
              }
            ].map((product, index) => (
              <Link
                key={index}
                to={product.link}
                className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-blue-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80"
              >
                <div
                  className="h-64 bg-cover bg-center transition-transform duration-700 hover:scale-110 cursor-pointer"
                  style={{ backgroundImage: `url('${product.image}')` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white drop-shadow-lg">
                    <h3 className="font-bold text-xl mb-1">{product.title}</h3>
                    <p className="text-base text-blue-200 font-medium">{product.category}</p>
                  </div>
                </div>
              </Link>
            ))}
            {/* Динамичен продукт KALISZ */}
            <ProductCardRecommendedKalisz />
          </div>
        </section>
  
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <FeaturedProducts items={featured} />
      </section>
    
      </div>
    </>
  );
}