import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function useAdminPageRestore() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Запис на последната admin страница
  useEffect(() => {
    if (user && location.pathname.startsWith("/admin")) {
      localStorage.setItem("lastAdminPage", location.pathname);
    }
  }, [location.pathname, user]);

  // При първоначално зареждане, ако сме на /admin и user е логнат, пренасочи към последната admin страница
  useEffect(() => {
    if (!loading && user && location.pathname === "/admin") {
      const last = localStorage.getItem("lastAdminPage");
      if (last && last !== "/admin") {
        navigate(last, { replace: true });
      }
    }
  }, [location.pathname, navigate, user, loading]);
}
