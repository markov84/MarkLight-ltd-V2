import React, { Suspense, lazy } from "react";
import usePageRestore from './hooks/usePageRestore';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const Catalog = lazy(() => import("./pages/Catalog"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const Coupons = lazy(() => import("./pages/Coupons"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Chat = lazy(() => import("./pages/Chat"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Courier = lazy(() => import("./pages/Courier"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Orders = lazy(() => import("./pages/Orders"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Payment = lazy(() => import("./pages/Payment"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const NotFound = lazy(() => import("./pages/NotFound"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

// Providers
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import AdminCoupons from './pages/AdminCoupons.jsx';
import AdminChat from './pages/AdminChat.jsx';
import AdminWishlist from './pages/AdminWishlist.jsx';
import AdminAnalytics from './pages/AdminAnalytics.jsx';
import AdminCourier from './pages/AdminCourier.jsx';
import AdminReviews from './pages/AdminReviews.jsx';
import AdminSuggestions from './pages/AdminSuggestions.jsx';
const WishSuggestion = lazy(() => import('./pages/WishSuggestion.jsx'));

function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Зареждане…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
  <Route path="/coupons" element={<Coupons />} />
  <Route path="/wishlist" element={<Wishlist />} />
  <Route path="/chat" element={<Chat />} />
  <Route path="/analytics" element={<Analytics />} />
  <Route path="/courier" element={<Courier />} />
  <Route path="/reviews" element={<Reviews />} />
        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="/payment" element={
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly={true}>
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="/admin/reviews" element={
          <ProtectedRoute adminOnly={true}>
            <AdminReviews />
          </ProtectedRoute>
        } />
        <Route path="/admin/suggestions" element={
          <ProtectedRoute adminOnly={true}>
            <AdminSuggestions />
          </ProtectedRoute>
        } />
        <Route path="/wish-suggestion" element={<WishSuggestion />} />
        <Route path="/admin/coupons" element={
          <ProtectedRoute adminOnly={true}>
            <AdminCoupons />
          </ProtectedRoute>
        } />
        <Route path="/admin/chat" element={
          <ProtectedRoute adminOnly={true}>
            <AdminChat />
          </ProtectedRoute>
        } />
        <Route path="/admin/wishlist" element={
          <ProtectedRoute adminOnly={true}>
            <AdminWishlist />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
  return (
    <Suspense fallback={<div className="p-8 text-center">Зареждане…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="/payment" element={
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly={true}>
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="/admin/coupons" element={
          <ProtectedRoute adminOnly={true}>
            <AdminCoupons />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Layout>
              <AppRoutes />
            </Layout>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
