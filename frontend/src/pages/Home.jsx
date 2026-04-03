import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ConferenceCard from "../components/ConferenceCard.jsx";
import SearchBar from "../components/SearchBar.jsx";

const PAGE = 10;

export default function Home() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    const params = new URLSearchParams({
      skip: String(skip),
      limit: String(PAGE),
      sort,
    });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const r = await apiFetch(`/conferences?${params.toString()}`);
    if (!r.ok) {
      setErr("Не удалось загрузить список");
      setLoading(false);
      return;
    }
    const data = await r.json();
    setItems(data.items || []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [skip, search, category, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!user) return;
    if (!window.confirm("Удалить конференцию?")) return;
    const r = await apiFetch(`/conferences/${id}`, { method: "DELETE" });
    if (!r.ok) {
      alert("Ошибка удаления");
      return;
    }
    load();
  };

  const maxSkip = Math.max(0, total - PAGE);
  const canGoBack = skip > 0;
  const canGoFwd = skip + PAGE < total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Научные конференции</h1>
        <p className="mt-1 text-sm text-slate-400">
          Поиск, фильтр по категории, сортировка по дате начала.
        </p>
      </div>

      <SearchBar
        search={search}
        category={category}
        sort={sort}
        onSearchChange={(v) => {
          setSkip(0);
          setSearch(v);
        }}
        onCategoryChange={(v) => {
          setSkip(0);
          setCategory(v);
        }}
        onSortChange={(v) => {
          setSkip(0);
          setSort(v);
        }}
      />

      {err && <p className="text-sm text-red-400">{err}</p>}
      {loading ? (
        <p className="text-slate-500">Загрузка…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((c) => (
            <ConferenceCard
              key={c.id}
              conf={c}
              canEdit={user && (user.id === c.user_id || user.role === "admin")}
              onDeleted={() => handleDelete(c.id)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-sm text-slate-400">
        <span>
          Всего: {total} · страница {Math.floor(skip / PAGE) + 1} из {Math.max(1, Math.ceil(total / PAGE))}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => setSkip((s) => Math.max(0, s - PAGE))}
            className="rounded border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            Назад
          </button>
          <button
            type="button"
            disabled={!canGoFwd}
            onClick={() => setSkip((s) => s + PAGE)}
            className="rounded border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            Вперёд
          </button>
        </div>
      </div>
    </div>
  );
}
