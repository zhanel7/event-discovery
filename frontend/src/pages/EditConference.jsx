import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

function toLocal(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export default function EditConference() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [conf, setConf] = useState(null);
  const [form, setForm] = useState({});
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await apiFetch(`/conferences/${id}`);
      if (!r.ok) {
        setErr("Не найдено");
        setLoading(false);
        return;
      }
      const c = await r.json();
      setConf(c);
      setForm({
        title: c.title,
        description: c.description || "",
        start_date: toLocal(c.start_date),
        end_date: toLocal(c.end_date),
        location: c.location || "",
        cfp_deadline: c.cfp_deadline ? toLocal(c.cfp_deadline) : "",
        category: c.category || "",
      });
      setLoading(false);
    })();
  }, [id]);

  const canEdit =
    user && conf && (user.id === conf.user_id || user.role === "admin");

  const change = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    setErr("");
    const body = {
      title: form.title,
      description: form.description,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      location: form.location,
      category: form.category,
      cfp_deadline: form.cfp_deadline ? new Date(form.cfp_deadline).toISOString() : null,
    };
    const r = await apiFetch(`/conferences/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(typeof data.detail === "string" ? data.detail : "Ошибка сохранения");
      return;
    }
    setConf(data);
  };

  const remove = async () => {
    if (!canEdit) return;
    if (!window.confirm("Удалить конференцию?")) return;
    const r = await apiFetch(`/conferences/${id}`, { method: "DELETE" });
    if (!r.ok) {
      alert("Ошибка удаления");
      return;
    }
    nav("/");
  };

  if (loading) return <p className="text-slate-500">Загрузка…</p>;
  if (!conf) return <p className="text-red-400">{err || "Нет данных"}</p>;

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h1 className="text-xl font-semibold text-white">Конференция #{conf.id}</h1>
      {!canEdit && (
        <p className="mt-2 text-sm text-amber-400">Только просмотр (не ваш материал).</p>
      )}
      <form onSubmit={save} className="mt-4 space-y-3">
        <div>
          <label className="text-sm text-slate-400">Название</label>
          <input
            required
            disabled={!canEdit}
            value={form.title}
            onChange={change("title")}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-60"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400">Описание</label>
          <textarea
            rows={4}
            disabled={!canEdit}
            value={form.description}
            onChange={change("description")}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-60"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm text-slate-400">Начало</label>
            <input
              type="datetime-local"
              required
              disabled={!canEdit}
              value={form.start_date}
              onChange={change("start_date")}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-60"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">Конец</label>
            <input
              type="datetime-local"
              required
              disabled={!canEdit}
              value={form.end_date}
              onChange={change("end_date")}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-60"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-400">Локация</label>
          <input
            disabled={!canEdit}
            value={form.location}
            onChange={change("location")}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-60"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400">Дедлайн CFP</label>
          <input
            type="datetime-local"
            disabled={!canEdit}
            value={form.cfp_deadline}
            onChange={change("cfp_deadline")}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-60"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400">Категория</label>
          <input
            disabled={!canEdit}
            value={form.category}
            onChange={change("category")}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-60"
          />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={remove}
              className="rounded-lg border border-red-800 px-4 py-2 text-red-300 hover:bg-red-950"
            >
              Удалить
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
