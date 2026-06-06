export type Qrtag = {
  id: string;
  productName: string;
  category: string;
  batch?: string;
  qc: string[];
  brand: string;
  createdAt: string;
  notes?: string;
  photos?: string[];
};

const KEY = "oziktag.tags";

export function loadTags(): Qrtag[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTag(tag: Qrtag) {
  const all = loadTags();
  all.unshift(tag);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 50)));
}

export function getTag(id: string): Qrtag | undefined {
  return loadTags().find((t) => t.id === id);
}

export function getBrand(): string {
  if (typeof window === "undefined") return "Brand UMKM";
  return localStorage.getItem("oziktag.brand") || "Brand UMKM";
}

export function setBrand(name: string) {
  localStorage.setItem("oziktag.brand", name);
}

const CREDITS_KEY = "oziktag.credits";
const TOPUP_KEY = "oziktag.topups";

export type TopUp = {
  id: string;
  packageName: string;
  credits: number;
  amount: number;
  method: "QRIS" | "GoPay";
  createdAt: string;
};

export function getCredits(): number {
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(CREDITS_KEY);
  return v ? parseInt(v, 10) || 0 : 10; // starter free credits
}

export function setCredits(n: number) {
  localStorage.setItem(CREDITS_KEY, String(Math.max(0, n)));
}

export function addCredits(n: number) {
  setCredits(getCredits() + n);
}

export function useCredit(): boolean {
  const c = getCredits();
  if (c <= 0) return false;
  setCredits(c - 1);
  return true;
}

export function loadTopUps(): TopUp[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(TOPUP_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTopUp(t: TopUp) {
  const all = loadTopUps();
  all.unshift(t);
  localStorage.setItem(TOPUP_KEY, JSON.stringify(all.slice(0, 50)));
}