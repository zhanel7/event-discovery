import React from "react";
import { Link } from "react-router-dom";

export default function ConferenceCard({ conf, canEdit, onDeleted }) {
  const fmt = (d) => (d ? new Date(d).toLocaleString() : "—");

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg transition hover:border-emerald-700/50">
      <h2 className="text-lg font-semibold text-white">{conf.title}</h2>
      <p className="mt-2 line-clamp-3 text-sm text-slate-400">{conf.description || "—"}</p>
      <dl className="mt-3 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-400">Начало</dt>
          <dd>{fmt(conf.start_date)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-400">Конец</dt>
          <dd>{fmt(conf.end_date)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-400">Локация</dt>
          <dd>{conf.location || "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-400">Категория</dt>
          <dd>{conf.category || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-slate-400">Дедлайн CFP</dt>
          <dd>{fmt(conf.cfp_deadline)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to={`/edit/${conf.id}`}
          className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500"
        >
          Подробнее / правка
        </Link>
        {canEdit && (
          <button
            type="button"
            className="rounded border border-red-800 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950"
            onClick={onDeleted}
          >
            Удалить
          </button>
        )}
      </div>
    </article>
  );
}
