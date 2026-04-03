import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const linkClass = ({ isActive }) =>
  `rounded px-3 py-2 text-sm font-medium ${
    isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/80"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="text-lg font-semibold text-emerald-400">
          Event Discovery
        </Link>
        <button
          type="button"
          className="rounded-md border border-slate-700 px-3 py-1 text-slate-200 sm:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Меню"
        >
          ☰
        </button>
        <nav
          className={`${
            open ? "flex" : "hidden"
          } absolute left-0 right-0 top-14 z-10 flex-col gap-1 border-b border-slate-800 bg-slate-900 p-4 sm:static sm:flex sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0`}
        >
          <NavLink to="/" className={linkClass} onClick={() => setOpen(false)}>
            Конференции
          </NavLink>
          {user && (
            <>
              <NavLink to="/create" className={linkClass} onClick={() => setOpen(false)}>
                Создать
              </NavLink>
              <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
                Кабинет
              </NavLink>
              {user.role === "admin" && (
                <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
                  Админ
                </NavLink>
              )}
            </>
          )}
          {!user ? (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>
                Войти
              </NavLink>
              <NavLink to="/register" className={linkClass} onClick={() => setOpen(false)}>
                Регистрация
              </NavLink>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="rounded px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800"
            >
              Выйти
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
