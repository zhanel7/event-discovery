import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api.js";

const empty = {
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  location: "",
  cfp_deadline: "",
  category: "",
};

export default function CreateConference() {
  const nav = useNavigate();
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState("");

  const change = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
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
    const r = await apiFetch("/conferences", { method: "POST", body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(typeof data.detail === "string" ? data.detail : "Ошибка создания");
      return;
    }
    nav(`/edit/${data.id}`);
  };

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h1 className="text-xl font-semibold text-white">Новая конференция</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label className="text-sm text-slate-400">Название *</label>
          <input
            required
            value={form.title}
            onChange={change("title")}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400">Описание</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={change("description")}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm text-slate-400">Начало *</label>
            <input
              type="datetime-local"
              required
              value={form.start_date}
              onChange={change("start_date")}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">Конец *</label>
            <input
              type="datetime-local"
              required
              value={form.end_date}
              onChange={change("end_date")}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-400">Локация</label>
          <input
            value={form.location}
            onChange={change("location")}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400">Дедлайн CFP</label>
          <input
            type="datetime-local"
            value={form.cfp_deadline}
            onChange={change("cfp_deadline")}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400">Категория</label>
          <input
            value={form.category}
            onChange={change("category")}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500">
          Сохранить
        </button>
      </form>
    </div>
  );
}
