import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
    } catch (ex) {
      setErr(ex.message || "Ошибка входа");
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h1 className="text-xl font-semibold text-white">Вход</h1>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label className="text-sm text-slate-400">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400">Пароль</label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-500"
        >
          Войти
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Нет аккаунта? <Link to="/register" className="text-emerald-400">Регистрация</Link>
      </p>
    </div>
  );
}
