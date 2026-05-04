"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, Landmark, TrendingDown, TrendingUp, Calendar, ChevronDown } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getLancamentos } from "@/lib/actions";
import { Lancamento } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const MESES_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

interface Linha {
  id: string;
  data: string;
  descricao: string;
  tipo: "entrada" | "saida";
  valor: number;
  saldo: number;
}

export default function ContaCorrentePage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroMes, setFiltroMes] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    getLancamentos().then((data) => { setLancamentos(data); setLoading(false); });
  }, []);

  // Apenas lançamentos pagos, ordenados por dataPagamento
  const pagos = useMemo(() =>
    [...lancamentos]
      .filter((l) => l.status === "pago" && l.dataPagamento)
      .sort((a, b) => a.dataPagamento!.localeCompare(b.dataPagamento!)),
    [lancamentos]
  );

  // Saldo atual = soma de tudo que foi pago
  const saldoAtual = useMemo(() =>
    pagos.reduce((s, l) => s + (l.tipo === "receber" ? l.valor : -l.valor), 0),
    [pagos]
  );

  // Meses com movimentação
  const mesesDisponiveis = useMemo(() => {
    const set = new Set(pagos.map((l) => l.dataPagamento!.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [pagos]);

  // Extrato com saldo acumulado, filtrado por mês, mais recente primeiro
  const extrato = useMemo((): Linha[] => {
    let acumulado = 0;
    const todas: Linha[] = pagos.map((l) => {
      acumulado += l.tipo === "receber" ? l.valor : -l.valor;
      return {
        id: l.id,
        data: l.dataPagamento!,
        descricao: l.descricao,
        tipo: l.tipo === "receber" ? "entrada" : "saida",
        valor: l.valor,
        saldo: acumulado,
      };
    });

    const filtradas = filtroMes === "todos"
      ? todas
      : todas.filter((l) => l.data.slice(0, 7) === filtroMes);

    return filtradas.reverse();
  }, [pagos, filtroMes]);

  const totalEntradas = extrato.filter((l) => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0);
  const totalSaidas   = extrato.filter((l) => l.tipo === "saida").reduce((s, l) => s + l.valor, 0);

  const labelMes = filtroMes === "todos"
    ? "Todos os períodos"
    : (() => { const [a, m] = filtroMes.split("-").map(Number); return `${MESES_PT[m - 1]} ${a}`; })();

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Landmark size={20} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Conta Corrente</h1>
              <p className="text-sm text-slate-400">Extrato de movimentações</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-500">
              <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mr-3" />
              Carregando...
            </div>
          ) : (
            <>
              {/* Saldo atual */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Saldo Atual</p>
                  <p className={cn("text-4xl font-bold", saldoAtual >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {formatCurrency(saldoAtual)}
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-2 text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <ArrowUpRight size={14} /> {formatCurrency(pagos.filter(l => l.tipo==="receber").reduce((s,l)=>s+l.valor,0))} total entradas
                  </span>
                  <span className="flex items-center gap-1.5 text-red-400">
                    <ArrowDownLeft size={14} /> {formatCurrency(pagos.filter(l => l.tipo==="pagar").reduce((s,l)=>s+l.valor,0))} total saídas
                  </span>
                </div>
              </div>

              {/* Filtro de mês + resumo */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={filtroMes}
                    onChange={(e) => setFiltroMes(e.target.value)}
                    className="appearance-none bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-8 py-2 text-sm text-white outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="todos">Todos os períodos</option>
                    {mesesDisponiveis.map((m) => {
                      const [a, mes] = m.split("-").map(Number);
                      return <option key={m} value={m}>{MESES_PT[mes - 1]} {a}</option>;
                    })}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>

                {extrato.length > 0 && (
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-emerald-400">+{formatCurrency(totalEntradas)}</span>
                    <span className="text-red-400">-{formatCurrency(totalSaidas)}</span>
                    <span className="text-slate-500">{extrato.length} movimentação{extrato.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>

              {/* Extrato */}
              {extrato.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  <Landmark size={32} className="mx-auto mb-3 opacity-30" />
                  <p>Nenhuma movimentação em {labelMes}</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  {/* Desktop */}
                  <div className="hidden md:block">
                    <table className="w-full">
                      <thead className="bg-slate-800/50 border-b border-slate-800">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">Data</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Descrição</th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider w-36">Valor</th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider w-36">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {extrato.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-3.5 text-sm text-slate-400">{formatDate(l.data)}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                  l.tipo === "entrada" ? "bg-emerald-500/10" : "bg-red-500/10"
                                )}>
                                  {l.tipo === "entrada"
                                    ? <TrendingUp size={13} className="text-emerald-400" />
                                    : <TrendingDown size={13} className="text-red-400" />}
                                </div>
                                <span className="text-sm text-white">{l.descricao}</span>
                              </div>
                            </td>
                            <td className={cn(
                              "px-5 py-3.5 text-right text-sm font-semibold",
                              l.tipo === "entrada" ? "text-emerald-400" : "text-red-400"
                            )}>
                              {l.tipo === "entrada" ? "+" : "-"}{formatCurrency(l.valor)}
                            </td>
                            <td className={cn(
                              "px-5 py-3.5 text-right text-sm font-bold",
                              l.saldo >= 0 ? "text-white" : "text-red-400"
                            )}>
                              {formatCurrency(l.saldo)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden divide-y divide-slate-800/60">
                    {extrato.map((l) => (
                      <div key={l.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                            l.tipo === "entrada" ? "bg-emerald-500/10" : "bg-red-500/10"
                          )}>
                            {l.tipo === "entrada"
                              ? <ArrowUpRight size={16} className="text-emerald-400" />
                              : <ArrowDownLeft size={16} className="text-red-400" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{l.descricao}</p>
                            <p className="text-xs text-slate-500">{formatDate(l.data)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn("text-sm font-bold", l.tipo === "entrada" ? "text-emerald-400" : "text-red-400")}>
                            {l.tipo === "entrada" ? "+" : "-"}{formatCurrency(l.valor)}
                          </p>
                          <p className={cn("text-xs", l.saldo >= 0 ? "text-slate-500" : "text-red-400/70")}>
                            {formatCurrency(l.saldo)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
