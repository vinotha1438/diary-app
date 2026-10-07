import { useEffect, useMemo, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import api from "../api";
import { useAuth } from "../AuthContext";
import "./Diary.css";

const APP_NAME = "Pakkam";
const TAGLINE = "My day, my story.";
const MAX_PHOTOS = 4;

const QUICK_EMOJIS = [
  "😊", "😔", "😴", "🥰", "😂", "😡",
  "🍲", "☕", "🎉", "❤️", "🙏", "💪",
];

const EMOJI_RE =
  /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu;

const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const dayOfYear = (d) =>
  Math.floor((startOfDay(d) - new Date(d.getFullYear(), 0, 0)) / 86400000);

// Shrink a photo in the browser before uploading
const compressImage = (file, maxSize = 900, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas
          .getContext("2d")
          .drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export default function Home() {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");
  const taRef = useRef(null);
  const fileRef = useRef(null);

  const today = startOfDay(new Date());
  const isToday = dayKey(selected) === dayKey(today);

  useEffect(() => {
    api
      .get("/entries")
      .then((res) => setEntries(res.data))
      .catch(() => setError("Could not load your entries"));
  }, []);

  const daysWithEntries = useMemo(
    () => new Set(entries.map((e) => dayKey(new Date(e.createdAt)))),
    [entries]
  );

  // Streak: consecutive days with entries, ending today (or yesterday)
  const streak = useMemo(() => {
    let d = daysWithEntries.has(dayKey(today)) ? today : addDays(today, -1);
    let count = 0;
    while (daysWithEntries.has(dayKey(d))) {
      count++;
      d = addDays(d, -1);
    }
    return count;
  }, [daysWithEntries]); // eslint-disable-line

  const pagesThisMonth = useMemo(() => {
    const set = new Set();
    entries.forEach((e) => {
      const d = new Date(e.createdAt);
      if (
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      ) {
        set.add(dayKey(d));
      }
    });
    return set.size;
  }, [entries]); // eslint-disable-line

  const dayEntries = entries
    .filter((e) => dayKey(new Date(e.createdAt)) === dayKey(selected))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Emojis the person typed that day, in order
  const emojiTrail = useMemo(() => {
    const all = dayEntries.map((e) => e.text).join(" ").match(EMOJI_RE) || [];
    const trail = all.filter((emoji, i) => emoji !== all[i - 1]);
    return trail.slice(0, 5);
  }, [dayEntries]);

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const moments = dayEntries.flatMap((e) =>
    (e.photos || []).map((src) => ({ src, time: formatTime(e.createdAt) }))
  );

  // 7-day tabs that never go past today
  const windowEnd = addDays(selected, 3) > today ? today : addDays(selected, 3);
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(windowEnd, i - 6)
  );

  const leftPage = dayOfYear(selected) * 2 - 1;

  // Insert an emoji exactly where the cursor is
  const insertEmoji = (emoji) => {
    const ta = taRef.current;
    if (!ta) {
      setText((t) => t + emoji);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setText(text.slice(0, start) + emoji + text.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files).slice(
      0,
      MAX_PHOTOS - photos.length
    );
    e.target.value = "";
    if (files.length === 0) return;
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      setPhotos((p) => [...p, ...compressed]);
      setError("");
    } catch {
      setError("Could not read that photo. Try a JPG or PNG.");
    }
  };

  const addEntry = async () => {
    if (!text.trim() && photos.length === 0) return;
    try {
      const res = await api.post("/entries", {
        text: text.trim() || "📷",
        photos,
      });
      setEntries([res.data, ...entries]);
      setText("");
      setPhotos([]);
      setShowPicker(false);
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

  const pickerTheme =
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";

  return (
    <div className="pk">
      <header className="pk-top">
        <div>
          <h1 className="pk-logo">{APP_NAME}</h1>
          <p className="pk-tag">{TAGLINE}</p>
        </div>
        <div className="pk-stats">
          <span>
            🔥 {streak}-day streak · {pagesThisMonth} page
            {pagesThisMonth === 1 ? "" : "s"} this month
          </span>
          <button className="pk-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div className="pk-cover">
        <nav className="pk-tabs">
          {weekDays.map((d) => {
            const key = dayKey(d);
            return (
              <button
                key={key}
                className={key === dayKey(selected) ? "pk-tab active" : "pk-tab"}
                onClick={() => setSelected(d)}
              >
                {d.toLocaleDateString("en-IN", { weekday: "short" })}{" "}
                {d.getDate()}
                {daysWithEntries.has(key) && <i className="pk-tab-dot" />}
              </button>
            );
          })}
        </nav>

        <main className="pk-book">
          <div className="pk-spiral" />

          {/* LEFT PAGE */}
          <section className="pk-page pk-left">
            <div className="pk-datehead">
              <span className="pk-bignum">{selected.getDate()}</span>
              <span className="pk-weekday">
                {selected.toLocaleDateString("en-IN", { weekday: "long" })}
              </span>
            </div>
            <div className="pk-month">
              {selected
                .toLocaleDateString("en-IN", { month: "long", year: "numeric" })
                .toUpperCase()}
            </div>

            <div className="pk-label">YOUR DAY IN EMOJIS</div>
            {emojiTrail.length > 0 ? (
              <div className="pk-trail">
                {emojiTrail.map((emoji, i) => (
                  <span key={i} className="pk-trail-item">
                    {i > 0 && <em>→</em>}
                    <b>{emoji}</b>
                  </span>
                ))}
              </div>
            ) : (
              <p className="pk-hint">
                Emojis you write in your entries show up here.
              </p>
            )}

            <div className="pk-label">
              {isToday ? "TODAY'S MOMENTS" : "MOMENTS"}
            </div>
            <div className="pk-moments">
              {moments.map((m, i) => (
                <figure key={i} className="pk-polaroid">
                  <img src={m.src} alt="Moment" onClick={() => setLightbox(m.src)} />
                  <figcaption>{m.time}</figcaption>
                </figure>
              ))}
              {isToday && (
                <button
                  type="button"
                  className="pk-addphoto"
                  disabled={photos.length >= MAX_PHOTOS}
                  onClick={() => fileRef.current.click()}
                >
                  <span>＋</span>
                  Add photo
                </button>
              )}
              {!isToday && moments.length === 0 && (
                <p className="pk-hint">No photos on this day.</p>
              )}
            </div>

            <div className="pk-foot">
              <span>{user.name}'s diary</span>
              <span>Page {leftPage}</span>
            </div>
          </section>

          {/* RIGHT PAGE */}
          <section className="pk-page pk-right">
            <div className="pk-ribbon" />

            <div className="pk-nav">
              <button onClick={() => setSelected(addDays(selected, -1))}>
                ← Previous
              </button>
              <button
                disabled={isToday}
                onClick={() => setSelected(addDays(selected, 1))}
              >
                Next →
              </button>
              {!isToday && (
                <button onClick={() => setSelected(today)}>Today</button>
              )}
            </div>

            <h2 className="pk-dear">Dear diary,</h2>

            <div className="pk-sheet">
              {dayEntries.length === 0 && (
                <p className="pk-empty">
                  {isToday
                    ? "Nothing written yet. Start your page below."
                    : "No entries on this day."}
                </p>
              )}

              {dayEntries.map((entry) => (
                <div key={entry._id} className="pk-entry">
                  {editingId === entry._id ? (
                    <div>
                      <textarea
                        className="pk-write"
                        rows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <div className="pk-edit-btns">
                        <button onClick={() => saveEdit(entry)}>Save</button>
                        <button
                          className="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="pk-text">
                        <small>{formatTime(entry.createdAt)}</small>
                        {entry.text}
                      </p>
                      <div className="pk-entry-actions">
                        <button
                          className="pk-link"
                          onClick={() => {
                            setEditingId(entry._id);
                            setEditText(entry.text);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="pk-link"
                          onClick={() => deleteEntry(entry._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {isToday && (
                <div className="pk-compose">
                  <div className="pk-emoji-bar">
                    <span className="pk-tapadd">Tap to add</span>
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="pk-emoji"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insertEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="pk-emoji pk-more"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPicker(!showPicker)}
                      title="All emojis"
                    >
                      {showPicker ? "✕" : "＋"}
                    </button>
                  </div>

                  {showPicker && (
                    <div className="pk-picker">
                      <EmojiPicker
                        width="100%"
                        height={320}
                        theme={pickerTheme}
                        onEmojiClick={(e) => insertEmoji(e.emoji)}
                      />
                    </div>
                  )}

                  <textarea
                    ref={taRef}
                    className="pk-write"
                    rows={4}
                    placeholder="What's happening right now?"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />

                  {photos.length > 0 && (
                    <div className="pk-previews">
                      {photos.map((src, i) => (
                        <div key={i} className="pk-preview">
                          <img src={src} alt="Selected" />
                          <button
                            type="button"
                            className="pk-remove"
                            onClick={() =>
                              setPhotos(photos.filter((_, n) => n !== i))
                            }
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pk-add">
                    <button
                      type="button"
                      className="pk-photo-btn"
                      disabled={photos.length >= MAX_PHOTOS}
                      onClick={() => fileRef.current.click()}
                    >
                      📷 Photo ({photos.length}/{MAX_PHOTOS})
                    </button>
                    <button onClick={addEntry}>Add entry</button>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="pk-error">{error}</p>}

            <div className="pk-foot pk-foot-right">
              <span>Page {leftPage + 1}</span>
            </div>
          </section>
        </main>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handlePhotos}
      />

      {lightbox && (
        <div className="pk-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Diary full size" />
        </div>
      )}
    </div>
  );
}