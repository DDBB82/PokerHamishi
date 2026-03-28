import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { to: "/Dashboard",  label: "Dashboard"  },
  { to: "/Players",    label: "Players"    },
  { to: "/Games",      label: "Games"      },
  { to: "/Hosting",    label: "Hosting"    },
  { to: "/Statistics", label: "Statistics" },
  { to: "/Admin",      label: "Admin"      },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { currentUser, logout, openLogin } = useAuth();

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-indigo-600 text-white"
        : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
    }`;

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="text-indigo-700 font-bold text-lg tracking-tight">
          🃏 פוקר חמישי
        </span>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          {currentUser ? (
            <>
              <span className="text-sm text-slate-600 flex items-center gap-1.5">
                {currentUser.name}
                {currentUser.isAdmin && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                    Admin
                  </span>
                )}
              </span>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={openLogin}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-200 px-4 py-2 flex flex-col gap-1 bg-white">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <div className="pt-2 mt-1 border-t border-slate-100">
            {currentUser ? (
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-slate-600 flex items-center gap-1.5">
                  {currentUser.name}
                  {currentUser.isAdmin && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => { openLogin(); setOpen(false); }}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
