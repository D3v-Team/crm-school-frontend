import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../store/hooks";
import { setAuth } from "../../../store/slices/auth.slice";
import { useLoginMutation } from "../../../store/services/auth.api";

import { Card, Button, Typography } from "@material-tailwind/react";
import { User, Lock, TrendingUp, Moon, Sun } from "lucide-react";

import { Alert } from "../../Other/UI/Alert/Alert";

export default function Login() {
  const [loginField, setLoginField] = useState("shox");
  const [password, setPassword] = useState("123456");
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login({ username: loginField, password }).unwrap();
      dispatch(setAuth(data));
      Alert("Xush kelibsiz!", "success");

      // Редирект в зависимости от роли
      const role = data.user?.role;
      if (role === 'super_admin') {
        navigate("/dashboard");
      } else if (role === 'admin') {
        navigate("/ad/dashboard");
      } else {
        // fallback для других ролей (или можно на главную)
        navigate("/");
      }
    } catch (err) {
      console.error("Login failed:", err);
      Alert(err.data?.message || "Avtorizatsiya xatosi", "error");
    }
  };

  const iconClass = "absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]";

  return (
    <div className="flex min-h-screen items-center justify-center p-4 transition-colors duration-300 bg-[var(--page-bg)]">
      <Card className="w-full max-w-md p-8 shadow-2xl rounded-3xl border transition-colors duration-300 backdrop-blur-sm relative bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-primary)]">

        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-2xl font-light tracking-wider text-[var(--text-primary)]">
              {new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-xs font-light text-[var(--text-secondary)]">
              {new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-all duration-300 bg-[var(--card-bg)] hover:brightness-95"
          >
            {isDark ? <Sun className="w-5 h-5 text-[var(--text-primary)]" /> : <Moon className="w-5 h-5 text-[var(--text-primary)]" />}
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#4D6BFE] to-[#4166D5] flex items-center justify-center shadow-lg shadow-[#4D6BFE]/30">
              <TrendingUp className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
          </div>
          <Typography variant="h4" className="font-bold text-[var(--text-primary)]">
            Investing
          </Typography>
          <Typography variant="paragraph" className="text-sm text-[var(--text-secondary)]">
            Tizimga kirish
          </Typography>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Login</label>
            <div className="relative">
              <User className={iconClass} />
              <input
                type="text"
                value={loginField}
                onChange={(e) => setLoginField(e.target.value)}
                required
                className="w-full rounded-xl border-2 py-3 pl-11 pr-4 outline-none transition-all duration-200 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--placeholder-color)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Parol</label>
            <div className="relative">
              <Lock className={iconClass} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border-2 py-3 pl-11 pr-4 outline-none transition-all duration-200 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--placeholder-color)]"
              />
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            disabled={isLoading}
            className="mt-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all duration-300 shadow-lg text-white font-semibold py-3 rounded-xl"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Kirilmoqda...
              </div>
            ) : (
              "Kirish"
            )}
          </Button>
        </form>

        <div className="text-center text-xs mt-6 text-[var(--text-secondary)]">
          © 2026 Investing. Barcha huquqlar himoyalangan.
        </div>
      </Card>
    </div>
  );
}