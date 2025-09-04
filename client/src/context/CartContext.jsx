import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartError, setCartError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Връща true ако е успешно, иначе string с грешка
  const addToCart = (product) => {
    let result = true;
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);
      const maxQty = product.stockQuantity ?? 0;
      if (existingItem) {
        if (existingItem.quantity + 1 > maxQty) {
          result = `Няма достатъчно наличност. Оставащи: ${maxQty}`;
          return prevItems;
        }
        return prevItems.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        if (maxQty < 1) {
          result = `Продуктът не е наличен.`;
          return prevItems;
        }
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
    return result;
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Намери продукта в количката
    const item = cartItems.find(i => i._id === productId);
    if (!item) return;

    // Вземи актуалната наличност от бекенда
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API}/api/products/${productId}`);
      if (res.status === 404) {
        setCartError("Този продукт вече не съществува или е изтрит от магазина.");
        setTimeout(() => setCartError("") , 2500);
        return;
      }
      if (!res.ok) {
        setCartError("Възникна проблем при проверка на наличността. Моля, опитайте отново.");
        setTimeout(() => setCartError("") , 2500);
        return;
      }
      const freshProduct = await res.json();
      const maxQty = freshProduct.stockQuantity ?? 0;
      if (quantity > maxQty) {
  setCartError(`Недостатъчна наличност! Моля, изберете по-малко количество.`);
        setTimeout(() => setCartError("") , 2500);
        return;
      }
      setCartItems(prevItems =>
        prevItems.map(item =>
          item._id === productId
            ? { ...item, quantity }
            : item
        )
      );
    } catch (err) {
      setCartError("Недостатъчна наличност! Моля, изберете по-малко количество и опитайте отново.");
      setTimeout(() => setCartError("") , 2500);
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    isOpen,
    setIsOpen,
    cartError,
    setCartError
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
