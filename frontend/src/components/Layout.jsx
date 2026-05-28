import { Link } from "react-router-dom";
import { Activity, History, Home, LogOut, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const [dark, setDark] = useState(true);
  const { logout } = useAuth();
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex">
        <aside className="w-72 min-h-screen p-6 border-r border-slate-700/30 glass-card rounded-none">
          <h1 className="text-2xl font-bold mb-8 text-primary">MedXVision</h1>
          <nav className="space-y-4">
            <Link className="flex gap-2" to="/dashboard"><Home size={18} /> Dashboard</Link>
            <Link className="flex gap-2" to="/history"><History size={18} /> Patient History</Link>
            <button className="flex gap-2" onClick={toggleTheme}>{dark ? <Sun size={18} /> : <Moon size={18} />} Toggle Theme</button>
            <button className="flex gap-2 text-red-400" onClick={logout}><LogOut size={18} /> Logout</button>
          </nav>
          <div className="mt-10 text-sm text-slate-400 flex gap-2"><Activity size={16} /> AI radiology workflow</div>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
