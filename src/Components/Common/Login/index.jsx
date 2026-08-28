import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../store/hooks";
import { setAuth } from "../../../store/slices/auth.slice";
import { useLoginMutation } from "../../../store/services/auth.api";
import { User, Lock, GraduationCap, Moon, Sun, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Alert } from "../../Other/UI/Alert/Alert";

export default function Login() {
  const [loginField, setLoginField] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login({ username: loginField, password }).unwrap();
      dispatch(setAuth(data));
      Alert("Xush kelibsiz!", "success");
      const role = data.user?.role;
      if (role === "dev")         navigate("/dev/panel");
      else if (role === "super_admin") navigate("/dashboard");
      else if (role === "admin")  navigate("/dashboard");
      else if (role === "teacher") navigate("/teacher/dashboard");
      else if (role === "parent") navigate("/parent/dashboard");
      else if (role === "hr")     navigate("/dashboard");
      else if (role === "cashier") navigate("/dashboard");
      else navigate("/dashboard");
    } catch (err) {
      Alert(err.data?.message || "Avtorizatsiya xatosi", "error");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden"
      style={{ background: 'var(--page-bg)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--accent), transparent)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 z-10"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Card */}
      <div
        className="w-full max-w-[420px] relative"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '28px',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Top gradient bar */}
        <div className="h-1.5 rounded-t-[28px]"
           />

        <div className="p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)', boxShadow: '0 8px 24px var(--accent-glow)' }}
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              CRM School
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Tizimga kirish uchun ma'lumotlarni kiriting
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Login
              </label>
              <div className="relative">
                <div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center"
                  style={{ color: focusedField === 'login' ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={loginField}
                  onChange={(e) => setLoginField(e.target.value)}
                  onFocus={() => setFocusedField('login')}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="Login kiriting"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'var(--input-bg)',
                    border: `1.5px solid ${focusedField === 'login' ? 'var(--accent)' : 'var(--input-border)'}`,
                    color: 'var(--input-text)',
                    boxShadow: focusedField === 'login' ? '0 0 0 3px var(--accent-glow)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Parol
              </label>
              <div className="relative">
                <div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: focusedField === 'password' ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="Parolni kiriting"
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'var(--input-bg)',
                    border: `1.5px solid ${focusedField === 'password' ? 'var(--accent)' : 'var(--input-border)'}`,
                    color: 'var(--input-text)',
                    boxShadow: focusedField === 'password' ? '0 0 0 3px var(--accent-glow)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)', boxShadow: '0 4px 20px var(--accent-glow)' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Kirilmoqda...
                </>
              ) : (
                <>
                  Kirish
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            © 2026 CRM School · Barcha huquqlar himoyalangan
          </p>
        </div>
      </div>
    </div>
  );
}
