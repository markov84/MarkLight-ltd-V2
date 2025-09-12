
import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Reviews() {
  const { user, loading } = useAuth();
  return (
    <div className="p-8 text-center text-xl">
      Страница за ревюта – тук ще се показват и управляват ревютата.<br />
      {loading ? (
        <span>Зареждане на потребител...</span>
      ) : user ? (
        <span>Влязъл като: <b>{user.username}</b></span>
      ) : (
        <span>Не сте влезли в профила си.</span>
      )}
    </div>
  );
}
