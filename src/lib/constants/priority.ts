export const PRIORITY_COLORS = {
  KRITIK: "#ef4444",
  YUKSEK: "#f97316", 
  ORTA: "#3b82f6",
  DUSUK: "#8b5cf6",
  YOK: "#9ca3af"
} as const;

export const PRIORITIES = [
  { name: "Kritik", color: PRIORITY_COLORS.KRITIK, key: "KRITIK" },
  { name: "Yüksek", color: PRIORITY_COLORS.YUKSEK, key: "YUKSEK" },
  { name: "Orta", color: PRIORITY_COLORS.ORTA, key: "ORTA" },
  { name: "Düşük", color: PRIORITY_COLORS.DUSUK, key: "DUSUK" },
  { name: "Yok", color: PRIORITY_COLORS.YOK, key: "YOK" }
] as const;

export type PriorityKey = keyof typeof PRIORITY_COLORS;
export type Priority = typeof PRIORITIES[number];