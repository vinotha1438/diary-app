// Uploads one image Blob straight from the browser to Cloudinary
// (unsigned upload preset: no API secret is needed in the frontend).
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadImage(blob) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary env variables are missing");
  }

  const form = new FormData();
  form.append("file", blob);
  form.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  );
  if (!res.ok) throw new Error("Upload failed");

  const data = await res.json();
  return data.secure_url; // https://res.cloudinary.com/...
}