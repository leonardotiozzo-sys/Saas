export const currency = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n || 0
  );

export const formatDate = (d) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(d));

export const formatDateTime = (d) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));

export const WINE_TYPES = [
  "Tinto",
  "Branco",
  "Rosé",
  "Espumante",
  "Fortificado",
  "Outro",
];
