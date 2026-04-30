import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function isVencido(dateStr: string, status: string): boolean {
  if (status === "pago" || status === "cancelado") return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dateStr + "T00:00:00");
  return venc < hoje;
}
