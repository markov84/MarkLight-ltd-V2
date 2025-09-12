import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function usePageRestore() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Запис на последната страница само ако потребителят е логнат
  useEffect(() => {
    if (user) {
      localStorage.setItem("lastPage", location.pathname + location.search);
    }
  }, [location.pathname, location.search, user]);

  // При първоначално зареждане, ако сме на / и потребителят е логнат, пренасочи към последната страница
  useEffect(() => {
    if (!loading && user && location.pathname === "/") {
      const last = localStorage.getItem("lastPage");
      if (last && last !== "/") {
        navigate(last, { replace: true });
      }
    }
  }, [location.pathname, navigate, user, loading]);
}
