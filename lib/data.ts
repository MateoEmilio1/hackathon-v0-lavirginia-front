export interface AxisResult {
  status: "ok" | "fail";
  reading: string;
}

export interface AxisDetail {
  status: "ok" | "fail";
  title: string;
  reading: string;
  detail: string;
}

export interface RecentInspection {
  n: string;
  time: string;
  product: string;
  variety: string;
  eje1: AxisResult;
  eje2: AxisResult;
  eje3: AxisResult;
  status: "ok" | "bad";
  failedAxis: number | null;
  detail: string | null;
  duration: number;
}

export interface QueueItem {
  id: string;
  product: string;
  variety: string;
  color: string;
  axes: {
    eje1: AxisDetail;
    eje2: AxisDetail;
    eje3: AxisDetail;
  };
}

export const RECENT_INSPECTIONS: RecentInspection[] = [
  { n: "C-001143", time: "14:08:42.1", product: "P-2026-1142", variety: "Intenso",
    eje1: { status: "ok",   reading: "Sellado 318 kPa" },
    eje2: { status: "ok",   reading: "Peso 5.61 g" },
    eje3: { status: "ok",   reading: "Bandeja 12 · ±0.4°" },
    status: "ok", failedAxis: null, detail: null, duration: 0.41 },
  { n: "C-001142", time: "14:08:41.7", product: "P-2026-1142", variety: "Intenso",
    eje1: { status: "ok",   reading: "Sellado 315 kPa" },
    eje2: { status: "ok",   reading: "Peso 5.59 g" },
    eje3: { status: "ok",   reading: "Bandeja 11 · ±0.6°" },
    status: "ok", failedAxis: null, detail: null, duration: 0.39 },
  { n: "C-001141", time: "14:08:41.3", product: "P-2026-1142", variety: "Intenso",
    eje1: { status: "fail", reading: "Sellado 198 kPa" },
    eje2: { status: "ok",   reading: "Peso 5.62 g" },
    eje3: { status: "ok",   reading: "Bandeja 10 · ±0.3°" },
    status: "bad", failedAxis: 1, detail: "Sellado deficiente", duration: 0.52 },
  { n: "C-001140", time: "14:08:40.9", product: "P-2026-1142", variety: "Intenso",
    eje1: { status: "ok",   reading: "Sellado 320 kPa" },
    eje2: { status: "ok",   reading: "Peso 5.60 g" },
    eje3: { status: "ok",   reading: "Bandeja 9 · ±0.5°" },
    status: "ok", failedAxis: null, detail: null, duration: 0.40 },
  { n: "C-001139", time: "14:08:40.4", product: "P-2026-1140", variety: "Equilibrado",
    eje1: { status: "ok",   reading: "Sellado 312 kPa" },
    eje2: { status: "fail", reading: "Fisura detectada" },
    eje3: { status: "ok",   reading: "Bandeja 8 · ±0.7°" },
    status: "bad", failedAxis: 2, detail: "Cápsula fisurada", duration: 0.58 },
  { n: "C-001138", time: "14:08:40.0", product: "P-2026-1140", variety: "Equilibrado",
    eje1: { status: "ok",   reading: "Sellado 316 kPa" },
    eje2: { status: "ok",   reading: "Peso 5.62 g" },
    eje3: { status: "ok",   reading: "Bandeja 7 · ±0.4°" },
    status: "ok", failedAxis: null, detail: null, duration: 0.42 },
  { n: "C-001137", time: "14:08:39.5", product: "P-2026-1140", variety: "Equilibrado",
    eje1: { status: "ok",   reading: "Sellado 319 kPa" },
    eje2: { status: "ok",   reading: "Peso 5.61 g" },
    eje3: { status: "ok",   reading: "Bandeja 6 · ±0.6°" },
    status: "ok", failedAxis: null, detail: null, duration: 0.41 },
  { n: "C-001136", time: "14:08:39.1", product: "P-2026-1141", variety: "Extra Intenso",
    eje1: { status: "ok",   reading: "Sellado 323 kPa" },
    eje2: { status: "ok",   reading: "Peso 5.58 g" },
    eje3: { status: "fail", reading: "Bandeja 5 · ±18.2°" },
    status: "bad", failedAxis: 3, detail: "Orientación invertida", duration: 0.45 },
  { n: "C-001135", time: "14:08:38.7", product: "P-2026-1141", variety: "Extra Intenso",
    eje1: { status: "ok",   reading: "Sellado 318 kPa" },
    eje2: { status: "ok",   reading: "Peso 5.57 g" },
    eje3: { status: "ok",   reading: "Bandeja 4 · ±0.3°" },
    status: "ok", failedAxis: null, detail: null, duration: 0.40 },
  { n: "C-001134", time: "14:08:38.3", product: "P-2026-1141", variety: "Extra Intenso",
    eje1: { status: "ok",   reading: "Sellado 322 kPa" },
    eje2: { status: "ok",   reading: "Peso 5.58 g" },
    eje3: { status: "ok",   reading: "Bandeja 3 · ±0.5°" },
    status: "ok", failedAxis: null, detail: null, duration: 0.42 },
  { n: "C-001133", time: "14:08:37.9", product: "P-2026-1144", variety: "Sutil",
    eje1: { status: "fail", reading: "Sellado 210 kPa" },
    eje2: { status: "ok",   reading: "Peso 5.59 g" },
    eje3: { status: "ok",   reading: "Bandeja 2 · ±0.4°" },
    status: "bad", failedAxis: 1, detail: "Sellado deficiente", duration: 0.54 },
  { n: "C-001132", time: "14:08:37.4", product: "P-2026-1144", variety: "Sutil",
    eje1: { status: "ok",   reading: "Sellado 321 kPa" },
    eje2: { status: "ok",   reading: "Peso 5.60 g" },
    eje3: { status: "ok",   reading: "Bandeja 1 · ±0.6°" },
    status: "ok", failedAxis: null, detail: null, duration: 0.41 },
];

export const QUEUE: QueueItem[] = [
  {
    id: "C-001144", product: "P-2026-1142", variety: "Intenso", color: "#3b1c10",
    axes: {
      eje1: { status: "ok",   title: "Empaquetado", reading: "Sellado 318 kPa", detail: "Foil íntegro · sin perforaciones" },
      eje2: { status: "ok",   title: "Cápsula",     reading: "Peso 5.61 g",     detail: "Sin fisuras · forma nominal" },
      eje3: { status: "ok",   title: "Orden",       reading: "±0.4°",           detail: "Posición bandeja 12 · orientación correcta" },
    },
  },
  {
    id: "C-001145", product: "P-2026-1144", variety: "Sutil", color: "#8b5a3c",
    axes: {
      eje1: { status: "fail", title: "Empaquetado", reading: "Sellado 198 kPa", detail: "Por debajo del umbral (mín. 250 kPa)" },
      eje2: { status: "ok",   title: "Cápsula",     reading: "Peso 5.59 g",     detail: "Sin fisuras · forma nominal" },
      eje3: { status: "ok",   title: "Orden",       reading: "±0.3°",           detail: "Posición bandeja 13 · orientación correcta" },
    },
  },
  {
    id: "C-001146", product: "P-2026-1141", variety: "Extra Intenso", color: "#2a1108",
    axes: {
      eje1: { status: "ok",   title: "Empaquetado", reading: "Sellado 322 kPa", detail: "Foil íntegro · sin perforaciones" },
      eje2: { status: "ok",   title: "Cápsula",     reading: "Peso 5.58 g",     detail: "Sin fisuras · forma nominal" },
      eje3: { status: "ok",   title: "Orden",       reading: "±0.5°",           detail: "Posición bandeja 1 · orientación correcta" },
    },
  },
  {
    id: "C-001147", product: "P-2026-1140", variety: "Equilibrado", color: "#5a2d18",
    axes: {
      eje1: { status: "ok",   title: "Empaquetado", reading: "Sellado 315 kPa", detail: "Foil íntegro · sin perforaciones" },
      eje2: { status: "fail", title: "Cápsula",     reading: "Fisura detectada", detail: "Cuerpo agrietado en sector lateral" },
      eje3: { status: "ok",   title: "Orden",       reading: "±0.6°",           detail: "Posición bandeja 2 · orientación correcta" },
    },
  },
  {
    id: "C-001148", product: "P-2026-1141", variety: "Extra Intenso", color: "#2a1108",
    axes: {
      eje1: { status: "ok",   title: "Empaquetado", reading: "Sellado 312 kPa", detail: "Foil íntegro · sin perforaciones" },
      eje2: { status: "ok",   title: "Cápsula",     reading: "Peso 5.60 g",     detail: "Sin fisuras · forma nominal" },
      eje3: { status: "fail", title: "Orden",       reading: "±18.2°",          detail: "Orientación invertida en bandeja 3" },
    },
  },
  {
    id: "C-001149", product: "P-2026-1142", variety: "Intenso", color: "#3b1c10",
    axes: {
      eje1: { status: "ok",   title: "Empaquetado", reading: "Sellado 320 kPa", detail: "Foil íntegro · sin perforaciones" },
      eje2: { status: "ok",   title: "Cápsula",     reading: "Peso 5.62 g",     detail: "Sin fisuras · forma nominal" },
      eje3: { status: "ok",   title: "Orden",       reading: "±0.2°",           detail: "Posición bandeja 14 · orientación correcta" },
    },
  },
];

export const SHIFT = {
  linea: "Línea A",
  jornadaInicio: "08:00",
  jornadaFin: "16:00",
  jornadaDuracion: 8,
  meta: 1200,
  ritmoMeta: 150,
  ritmoActual: 143,
  produccionAcumulada: 1143,
};

export const CHARTS = {
  approval: { aprobadas: 1086, rechazadas: 57, pct: 95.0 },
  byAxis: [
    { axis: 1, label: "Empaquetado", value: 23, color: "#034ea2" },
    { axis: 2, label: "Cápsula",     value: 14, color: "#a8d8f8" },
    { axis: 3, label: "Orden",       value: 20, color: "#4b9fdc" },
  ],
  byHour: [
    { h: "08", e1: 2, e2: 1, e3: 1, total: 4,  produced: 120 },
    { h: "09", e1: 3, e2: 2, e3: 2, total: 7,  produced: 145 },
    { h: "10", e1: 4, e2: 2, e3: 3, total: 9,  produced: 152 },
    { h: "11", e1: 3, e2: 2, e3: 3, total: 8,  produced: 148 },
    { h: "12", e1: 2, e2: 1, e3: 4, total: 7,  produced: 142 },
    { h: "13", e1: 4, e2: 3, e3: 3, total: 10, produced: 155 },
    { h: "14", e1: 3, e2: 2, e3: 3, total: 8,  produced: 149 },
    { h: "15", e1: 2, e2: 1, e3: 1, total: 4,  produced: 132 },
  ],
  topDefects: [
    { code: "1.1", name: "Sellado deficiente",             count: 14, axis: 1 },
    { code: "3.1", name: "Posición incorrecta en bandeja", count: 10, axis: 3 },
    { code: "2.1", name: "Cápsula fisurada",               count:  7, axis: 2 },
    { code: "1.2", name: "Foil perforado",                 count:  6, axis: 1 },
    { code: "3.2", name: "Orientación invertida",          count:  6, axis: 3 },
    { code: "2.2", name: "Cuerpo deformado",               count:  5, axis: 2 },
    { code: "3.3", name: "Cápsula faltante en grilla",     count:  4, axis: 3 },
    { code: "1.3", name: "Empaque deformado",              count:  3, axis: 1 },
    { code: "2.3", name: "Cápsula partida",                count:  2, axis: 2 },
  ],
};
