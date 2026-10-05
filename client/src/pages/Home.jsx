import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../AuthContext";

const MOODS = {
  happy: "😊",
  neutral: "😐",
  sad: "😢",
  angry: "😡",
};

export default function Home() {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState("");
  const [mood, setMood] = useState("neutral");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/entries")
      .then((res) => setEntries(res.data))
      .catch(() => setError("Could not load your entries"));
  }, []);

  const addEntry = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await api.post("/entries", { text, mood });
      setEntries([res.data, ...entries]);
      setText("");
      setMood("neutral");
      setError("");
    } catch {
      setError("Could not save the entry");
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await api.delete(`/entries/${id}`);
      setEntries(entries.filter((e) => e._id !== id));
    } catch {
      setError("Could not delete the entry");
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry._id);
    setEditText(entry.text);
  };

  const saveEdit = async (entry) => {
    if (!editText.trim()) return;
    try {
      const res = await api.put(`/entries/${entry._id}`, {
        text: editText,
        mood: entry.mood,
        tags: entry.tags,
      });
      setEntries(entries.map((e) => (e._id === entry._id ? res.data : e)));
      setEditingId(null);
    } catch {
      setError("Could not update the entry");
    }
  };

  // Group entries by day
  const groups = entries.reduce((acc, entry) => {
    const day = new Date(entry.createdAt).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    (acc[day] = acc[day] || []).push(entry);
    return acc;
  }, {});

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="home">
      <header>
        <h2>📔 {user.name}'s Diary</h2>
        <button className="btn-outline" onClick={logout}>
          Logout
        </button>
      </header>

      <form className="new-entry" onSubmit={addEntry}>
        <textarea
          placeholder="What's happening right now?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
        <div className="entry-actions">
          <div className="mood-picker">
            {Object.entries(MOODS).map(([key, emoji]) => (
              <button
                type="button"
                key={key}
                className={mood === key ? "mood active" : "mood"}
                onClick={() => setMood(key)}
                title={key}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button type="submit">Add Entry</button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {entries.length === 0 && (
        <p className="empty">No entries yet. Write your first one above!</p>
      )}

      {Object.entries(groups).map(([day, dayEntries]) => (
        <section key={day} className="day-group">
          <h3 className="day-title">{day}</h3>
          <div className="timeline">
            {dayEntries.map((entry) => (
              <div key={entry._id} className="timeline-item">
                <div className="time">{formatTime(entry.createdAt)}</div>
                <div className="entry-card">
                  <span className="entry-mood">{MOODS[entry.mood]}</span>

                  {editingId === entry._id ? (
                    <>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                      />
                      <div className="card-buttons">
                        <button onClick={() => saveEdit(entry)}>Save</button>
                        <button
                          className="btn-outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="entry-text">{entry.text}</p>
                      <div className="card-buttons">
                        <button
                          className="btn-link"
                          onClick={() => startEdit(entry)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-link danger"
                          onClick={() => deleteEntry(entry._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}