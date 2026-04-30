"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ArrowDownLeft, ArrowUpRight, Landmark, TrendingDown,
  TrendingUp, Calendar, ChevronDown,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getLancamentos } from "@/lib/actions";
import { Lancamento } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const MESES_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

type FiltroMes = "todos" | string; // "todos" ou "YYYY-MM"

interface Linha {
  id: string;
  data: string;         // data efetiva (dataPagamento se pago, dataVencimento se pendente)
  descricao: string;
  tipo: "entrada" | "saida";
  status: Lancamento["status"];
  valor: number;
  saldoAcumulado: number;
}

export default function ContaCorrentePage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroMes, setFiltroMes] = useState<FiltroMes>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [mostrarPendentes, setMostrarPendentes] = useState(true);

  useEffect(() => {
    getLancamentos().then((data) => { setLancamentos(data); setLoading(false); });
  }, []);

  // Saldo realizado (apenas lançamentos pagos)
  const saldoRealizado = useMemo(() => {
    return lancamentos
      .filter((l) => l.status === "pago")
      .reduce((s, l) => s + (l.tipo === "receber" ? l.valor : -l.valor), 0);
  }, [lancamentos]);

  // Saldo previsto (inclui pendentes, exclui cancelados)
  const saldoPrevisto = useMemo(() => {
    return lancamentos
      .filter((l) => l.status !== "cancelado")
      .reduce((s, l) => s + (l.tipo === "receber" ? l.valor : -l.valor), 0);
  }, [lancamentos]);

  // Meses disponíveis para filtro
  const mesesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    lancamentos.forEach((l) => {
      const data = l.status === "pago" && l.dataPagamento ? l.dataPagamento : l.dataVencimento;
      set.add(data.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [lancamentos]);

  // Montar extrato com saldo acumulado
  const extrato = useMemo((): Linha[] => {
    // Ordenar todos por data efetiva
    const base = [...lancamentos]
      .filter((l) => l.status !== "cancelado")
      .filter((l) => mostrarPendentes || l.status === "pago")
      .sort((a, b) => {
        const da = (a.status === "pago" && a.dataPagamento ? a.dataPagamento : a.dataVencimento);
        const db = (b.status === "pago" && b.dataPagamento ? b.dataPagamento : b.dataVencimento);
        return da.localeCompare(db);
      });

    // Calcular saldo acumulado corrido
    let acumulado = 0;
    const linhas: Linha[] = base.map((l) => {
      const data = l.status === "pago" && l.dataPagamento ? l.dataPagamento : l.dataVencimento;
      const delta = l.tipo === "receber" ? l.valor : -l.valor;
      if (l.status === "pago") acumulado += delta;
      return {
        id: l.id,
        data,
        descricao: l.descricao,
        tipo: l.tipo === "receber" ? "entrada" : "saida",
        status: l.status,
        valor: l.valor,
        saldoAcumulado: l.status === "pago" ? acumulado : acumulado + delta,
      };
    });

    // Filtrar por mês selecionado
    if (filtroMes === "todos") return linhas.reverse();
    return linhas.filter((l) => l.data.slice(0, 7) === filtroMes).reverse();
  }, [lancamentos, filtroMes, mostrarPendentes]);

  const labelFiltro = filtroMes === "todos"
    ? "Todos os períodos"
    : (() => {
        const [ano, mes] = filtroMes.split("-").map(Number);
        return `${MESES_PT[mes - 1]} ${ano}`;
      })();

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Landmark size={20} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Conta Corrente</h1>
              <p className="text-sm text-slate-400">Extrato e saldo da conta</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-500">
              <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mr-3" />
              Carregando...
            </div>
          ) : (
            <>
              {/* Cards de saldo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <p className="text-xs text-slate-400 mb-1">Saldo Atual (realizado)</p>
                  <p className={cn(
                    "text-3xl font-bold mt-1",
                    saldoRealizado >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {formatCurrency(saldoRealizado)}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Baseado apenas em pagamentos confirmados</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <p className="text-xs text-slate-400 mb-1">Saldo Previsto</p>
                  <p className={cn(
                    "text-3xl font-bold mt-1",
                    saldoPrevisto >= 0 ? "text-blue-400" : "text-orange-400"
                  )}>
                    {formatCurrency(saldoPrevisto)}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Inclui lançamentos pendentes</p>
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro de mês */}
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={filtroMes}
                    onChange={(e) => setFiltroMes(e.target.value)}
                    className="appearance-none bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-8 py-2 text-sm text-white outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="todos">Todos os períodos</option>
                    {mesesDisponiveis.map((m) => {
                      const [ano, mes] = m.split("-").map(Number);
                      return (
                        <option key={m} value={m}>
                          {MESES_PT[mes - 1]} {ano}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>

                {/* Toggle pendentes */}
                <button
                  onClick={() => setMostrarPendentes((v) => !v)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                    mostrarPendentes
                      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", mostrarPendentes ? "bg-yellow-400" : "bg-slate-600")} />
                  Pendentes
                </button>

                <span className="text-xs text-slate-500 ml-auto">
                  {extrato.length} movimentação{extrato.length !== 1 ? "s" : ""} · {labelFiltro}
                </span>
              </div>

              {/* Extrato */}
              {extrato.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  <Landmark size={32} className="mx-auto mb-3 opacity-30" />
                  <p>Nenhuma movimentação no período</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  {/* Desktop */}
                  <div className="hidden md:block">
                    <table className="w-full">
                      <thead className="bg-slate-800/50 border-b border-slate-800">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Data</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Descrição</th>
                          <th className="px-5 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Tipo</th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Valor</th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {extrato.map((l) => (
                          <tr
                            key={l.id}
                            className={cn(
                              "transition-colors",
                              l.status === "pago" ? "hover:bg-slate-800/30" : "opacity-60 hover:opacity-80"
                            )}
                          >
                            <td className="px-5 py-3.5">
                              <p className="text-sm text-slate-300">{formatDate(l.data)}</p>
                              {l.status !== "pago" && (
                                <p className="text-xs text-yellow-500/80 mt-0.5">previsto</p>
                              )}
                            </td>
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
                            <td className="px-5 py-3.5 text-center">
                              <span className={cn(
                                "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                                l.tipo === "entrada"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-red-500/10 text-red-400"
                              )}>
                                {l.tipo === "entrada"
                                  ? <><ArrowUpRight size={11} />Crédito</>
                                  : <><ArrowDownLeft size={11} />Débito</>}
                              </span>
                            </td>
                            <td className={cn(
                              "px-5 py-3.5 text-right text-sm font-semibold",
                              l.tipo === "entrada" ? "text-emerald-400" : "text-red-400"
                            )}>
                              {l.tipo === "entrada" ? "+" : "-"}{formatCurrency(l.valor)}
                            </td>
                            <td className={cn(
                              "px-5 py-3.5 text-right text-sm font-bold",
                              l.saldoAcumulado >= 0 ? "text-white" : "text-red-400"
                            )}>
                              {formatCurrency(l.saldoAcumulado)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden divide-y divide-slate-800/60">
                    {extrato.map((l) => (
                      <div
                        key={l.id}
                        className={cn("px-4 py-3.5", l.status !== "pago" && "opacity-60")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                              l.tipo === "entrada" ? "bg-emerald-500/10" : "bg-red-500/10"
                            )}>
                              {l.tipo === "entrada"
                                ? <ArrowUpRight size={15} className="text-emerald-400" />
                                : <ArrowDownLeft size={15} className="text-red-400" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">{l.descricao}</p>
                              <p className="text-xs text-slate-500">
                                {formatDate(l.data)}
                                {l.status !== "pago" && <span className="text-yellow-500/80 ml-1">· previsto</span>}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className={cn(
                              "text-sm font-bold",
                              l.tipo === "entrada" ? "text-emerald-400" : "text-red-400"
                            )}>
                              {l.tipo === "entrada" ? "+" : "-"}{formatCurrency(l.valor)}
                            </p>
                            <p className={cn(
                              "text-xs font-semibold",
                              l.saldoAcumulado >= 0 ? "text-slate-400" : "text-red-400/70"
                            )}>
                              {formatCurrency(l.saldoAcumulado)}
                            </p>
                          </div>
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
