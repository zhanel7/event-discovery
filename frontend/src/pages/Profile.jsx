import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ConferenceCard from "../components/ConferenceCard.jsx";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [mine, setMine] = useState([]);
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const r = await apiFetch("/users/me/conferences");
      if (r.ok) setMine(await r.json());
    })();
  }, []);

  const changePassword = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    const r = await apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: current,
        new_password: newPass,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(typeof data.detail === "string" ? data.detail : "Ошибка");
      return;
    }
    setMsg("Пароль обновлён");
    setCurrent("");
    setNewPass("");
  };

  const del = async (id) => {
    if (!window.confirm("Удалить?")) return;
    const r = await apiFetch(`/conferences/${id}`, { method: "DELETE" });
    if (!r.ok) {
      alert("Ошибка");
      return;
    }
    const r2 = await apiFetch("/users/me/conferences");
    if (r2.ok) setMine(await r2.json());
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-xl font-semibold text-white">Профиль</h1>
        <p className="mt-2 text-sm text-slate-400">
          Email: <span className="text-slate-200">{user?.email}</span>
        </p>
        <p className="text-sm text-slate-400">
          Роль: <span className="text-slate-200">{user?.role}</span>
        </p>
        <button
          type="button"
          onClick={() => refreshUser()}
          className="mt-3 text-sm text-emerald-400 hover:underline"
        >
          Обновить данные
        </button>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">Смена пароля</h2>
        <form onSubmit={changePassword} className="mt-4 max-w-md space-y-3">
          <div>
            <label className="text-sm text-slate-400">Текущий пароль</label>
            <input
              type="password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">Новый пароль (буква + цифра)</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          {msg && <p className="text-sm text-emerald-400">{msg}</p>}
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Сменить пароль
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Мои конференции</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {mine.length === 0 && <p className="text-slate-500">Пока нет созданных конференций.</p>}
          {mine.map((c) => (
            <ConferenceCard
              key={c.id}
              conf={c}
              canEdit
              onDeleted={() => del(c.id)}
            />
          ))}
        </div>
        <Link
          to="/create"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Создать конференцию
        </Link>
      </section>
    </div>
  );
}
