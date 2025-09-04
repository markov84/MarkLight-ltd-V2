

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ModalProductDetails from "../components/ModalProductDetails";
import axios from "axios";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/products/${id}`)
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
        product={product}
        loading={loading}
        error={error}
        onClose={() => window.history.back()}
      />
    </div>
  );
}
