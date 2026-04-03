import React from "react";

export default function SearchBar({
  search,
  category,
  sort,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div>
        <label className="block text-xs font-medium text-slate-400">Поиск</label>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Название или описание"
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400">Категория</label>
        <input
          type="text"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          placeholder="Точное совпадение"
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400">Сортировка по дате</label>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="asc">По возрастанию</option>
          <option value="desc">По убыванию</option>
        </select>
      </div>
    </div>
  );
}
