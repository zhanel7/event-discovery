import React, { useEffect, useState } from "react";
import { apiFetch } from "../api.js";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [confs, setConfs] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    const [ru, rc] = await Promise.all([apiFetch("/admin/users"), apiFetch("/admin/conferences")]);
    if (!ru.ok || !rc.ok) {
      setErr("Не удалось загрузить данные админки");
      return;
    }
    setUsers(await ru.json());
    setConfs(await rc.json());
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRole = async (id, current) => {
    const next = current === "admin" ? "user" : "admin";
    const r = await apiFetch(`/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role: next }),
    });
    if (!r.ok) {
      alert("Ошибка");
      return;
    }
    load();
  };

  const deleteConf = async (id) => {
    if (!window.confirm("Удалить конференцию?")) return;
    const r = await apiFetch(`/admin/conferences/${id}`, { method: "DELETE" });
    if (!r.ok) {
      alert("Ошибка");
      return;
    }
    load();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Админ-панель</h1>
      {err && <p className="text-red-400">{err}</p>}

      <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <h2 className="border-b border-slate-800 px-4 py-3 text-lg font-semibold text-white">
          Пользователи
        </h2>
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Роль</th>
              <th className="px-4 py-2">Действие</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-800">
                <td className="px-4 py-2">{u.id}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => toggleRole(u.id, u.role)}
                    className="rounded border border-slate-600 px-2 py-1 text-xs text-emerald-400 hover:bg-slate-800"
                  >
                    Сменить роль
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <h2 className="border-b border-slate-800 px-4 py-3 text-lg font-semibold text-white">
          Все конференции
        </h2>
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Название</th>
              <th className="px-4 py-2">Автор (user_id)</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {confs.map((c) => (
              <tr key={c.id} className="border-t border-slate-800">
                <td className="px-4 py-2">{c.id}</td>
                <td className="px-4 py-2">{c.title}</td>
                <td className="px-4 py-2">{c.user_id}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => deleteConf(c.id)}
                    className="rounded border border-red-900 px-2 py-1 text-xs text-red-300 hover:bg-red-950"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
