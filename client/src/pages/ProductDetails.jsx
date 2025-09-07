import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ModalProductDetails from "../components/ModalProductDetails";
import { http } from "../lib/http.js";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    http.get(`/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        setError("");
      })
      .catch(() => setError("Продуктът не е намерен"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
      <ModalProductDetails
        productId={id}
        onClose={() => navigate(-1)}
      />
    </div>
  );
}
