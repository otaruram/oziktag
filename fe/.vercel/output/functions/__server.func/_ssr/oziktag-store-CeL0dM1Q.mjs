const KEY = "oziktag.tags";
function loadTags() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function getTag(id) {
  return loadTags().find((t) => t.id === id);
}
function getBrand() {
  if (typeof window === "undefined") return "Brand UMKM";
  return localStorage.getItem("oziktag.brand") || "Brand UMKM";
}
function setBrand(name) {
  localStorage.setItem("oziktag.brand", name);
}
const CREDITS_KEY = "oziktag.credits";
function getCredits() {
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(CREDITS_KEY);
  return v ? parseInt(v, 10) || 0 : 10;
}
export {
  getCredits as a,
  getTag as b,
  getBrand as g,
  setBrand as s
};
