import containerLogo from "../assets/Container.svg";
import { Eye, EyeOff, Lock, LogIn, Mail, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@madhuban/api";
import { useTheme } from "../context/ThemeContext";
import "./login.css";

// ─── Decorative background blobs ──────────────────────────────────────────────
function PanelDecor() {
  return (
    <svg
      className="login-panel__decor"
      viewBox="0 0 400 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="340" cy="80"  r="130" fill="rgba(255,255,255,0.06)" />
      <circle cx="60"  cy="420" r="160" fill="rgba(255,255,255,0.05)" />
      <circle cx="200" cy="260" r="80"  fill="rgba(255,255,255,0.04)" />
      <circle cx="380" cy="350" r="60"  fill="rgba(255,255,255,0.04)" />
    </svg>
  );
}

// ─── Feature bullets shown on the left panel ──────────────────────────────────
const FEATURES = [
  "Unified property & task management",
  "Real-time staff attendance tracking",
  "Work orders, assets & reports in one place",
];

// ─── Login page ───────────────────────────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await login({ email: email.trim(), password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (remember) localStorage.setItem("rememberMe", "1");
      else localStorage.removeItem("rememberMe");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      {/* ── Left branded panel ── */}
      <div className="login-panel">
        <PanelDecor />

        <div className="login-panel__content">
          <img src={containerLogo} alt="Madhuban 360" className="login-panel__logo" />

          <h1 className="login-panel__headline">
            Smart property management, <br />
            <span className="login-panel__headline-accent">powered by people.</span>
          </h1>

          <ul className="login-panel__features">
            {FEATURES.map((f) => (
              <li key={f} className="login-panel__feature-item">
                <span className="login-panel__feature-dot" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="login-panel__footer">
          © {new Date().getFullYear()} Madhuban 360. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-form-side">
        {/* Theme toggle */}
        <button
          className="login-theme-toggle"
          onClick={toggle}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="login-card">
          <div className="login-card__header">
            <h2 className="login-card__title">Welcome back</h2>
            <p className="login-card__sub">Sign in to your admin account to continue</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="login-field">
              <label className="login-field__label" htmlFor="login-email">
                Email address
              </label>
              <div className="login-field__wrap">
                <Mail size={15} className="login-field__icon" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@madhuban360.com"
                  className="login-field__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-field__label" htmlFor="login-password">
                Password
              </label>
              <div className="login-field__wrap">
                <Lock size={15} className="login-field__icon" />
                <input
                  id="login-password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="login-field__input login-field__input--padded-right"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-field__eye"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="login-form__row">
              <label className="login-remember">
                <input
                  type="checkbox"
                  className="login-remember__checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="login-remember__label">Remember me</span>
              </label>
              <button type="button" className="login-forgot">
                Forgot password?
              </button>
            </div>

            {/* Error */}
            {error && <p className="login-error">{error}</p>}

            {/* Submit */}
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <span className="login-submit__spinner" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="login-card__help">
            Need access?{" "}
            <button type="button" className="login-card__help-link">
              Contact your administrator
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
