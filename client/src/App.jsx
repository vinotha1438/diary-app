import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import PinLock from "./components/PinLock";

export default function App() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  const [pinHash, setPinHash] = useState(null);
  const [unlocked, setUnlocked] = useState(true);
  const [settingPin, setSettingPin] = useState(false);

  const uid = user?.id;
  const pinKey = `pk_pin_${uid}`;
  const sessionKey = `pk_unlocked_${uid}`;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Check if this account has a PIN whenever the user changes
  useEffect(() => {
    if (!uid) return;
    const stored = localStorage.getItem(pinKey);
    setPinHash(stored);
    setUnlocked(!stored || sessionStorage.getItem(sessionKey) === "1");
  }, [uid]); // eslint-disable-line

  const savePin = (hash) => {
    localStorage.setItem(pinKey, hash);
    sessionStorage.setItem(sessionKey, "1");
    setPinHash(hash);
    setUnlocked(true);
    setSettingPin(false);
  };

  const removePin = () => {
    if (!window.confirm("Remove your PIN lock?")) return;
    localStorage.removeItem(pinKey);
    sessionStorage.removeItem(sessionKey);
    setPinHash(null);
  };

  const lockNow = () => {
    sessionStorage.removeItem(sessionKey);
    setUnlocked(false);
  };

  const forgotPin = () => {
    localStorage.removeItem(pinKey);
    sessionStorage.removeItem(sessionKey);
    setPinHash(null);
    setUnlocked(true);
    logout();
  };

  // Locked screen
  if (user && pinHash && !unlocked) {
    return (
      <PinLock
        mode="unlock"
        salt={uid}
        storedHash={pinHash}
        onDone={() => {
          sessionStorage.setItem(sessionKey, "1");
          setUnlocked(true);
        }}
        onForgot={forgotPin}
      />
    );
  }

  if (user && settingPin) {
    return (
      <PinLock
        mode="setup"
        salt={uid}
        onDone={savePin}
        onCancel={() => setSettingPin(false)}
      />
    );
  }

  return (
    <>
      <div className="top-controls">
        {user && !pinHash && (
          <button className="theme-toggle" onClick={() => setSettingPin(true)}>
            🔐 Set PIN
          </button>
        )}
        {user && pinHash && (
          <>
            <button className="theme-toggle" onClick={lockNow}>
              🔒 Lock
            </button>
            <button className="theme-toggle" onClick={removePin}>
              Remove PIN
            </button>
          </>
        )}
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      <Routes>
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Auth />}
        />
      </Routes>
    </>
  );
}