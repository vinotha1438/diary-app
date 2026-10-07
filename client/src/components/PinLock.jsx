import { useState } from "react";

export const hashPin = async (pin, salt) => {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// mode = "unlock" or "setup"
export default function PinLock({
  mode,
  salt,
  storedHash,
  onDone,
  onCancel,
  onForgot,
}) {
  const [pin, setPin] = useState("");
  const [first, setFirst] = useState("");
  const [error, setError] = useState("");
  const confirming = mode === "setup" && first !== "";

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN must be 4 to 6 digits");
      return;
    }

    if (mode === "unlock") {
      const hash = await hashPin(pin, salt);
      if (hash === storedHash) onDone();
      else {
        setError("Wrong PIN");
        setPin("");
      }
      return;
    }

    if (!confirming) {
      setFirst(pin);
      setPin("");
      return;
    }

    if (pin !== first) {
      setError("PINs don't match. Try again.");
      setFirst("");
      setPin("");
      return;
    }
    onDone(await hashPin(pin, salt));
  };

  const title =
    mode === "unlock"
      ? "Enter your PIN"
      : confirming
      ? "Confirm your PIN"
      : "Set a PIN";

  return (
    <div className="pin-screen">
      <form className="pin-card" onSubmit={submit}>
        <div className="pin-icon">🔒</div>
        <h2>{title}</h2>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="••••"
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">{mode === "unlock" ? "Unlock" : "Continue"}</button>
        {mode === "setup" && (
          <button type="button" className="btn-outline" onClick={onCancel}>
            Cancel
          </button>
        )}
        {mode === "unlock" && (
          <p className="switch" onClick={onForgot}>
            Forgot PIN? Log out
          </p>
        )}
      </form>
    </div>
  );
}