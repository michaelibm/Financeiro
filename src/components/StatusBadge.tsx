import { StatusLancamento } from "@/lib/types";
import { cn } from "@/lib/utils";

const config: Record<StatusLancamento, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  pago: { label: "Pago", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  vencido: { label: "Vencido", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  cancelado: { label: "Cancelado", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

export default function StatusBadge({ status }: { status: StatusLancamento }) {
  const { label, cls } = config[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", cls)}>
      {label}
    </span>
  );
}
