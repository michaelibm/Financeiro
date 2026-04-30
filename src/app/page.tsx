"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp, Wallet, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
  type TooltipProps,
} from "recharts";
import { type ValueType, type NameType } from "recharts/types/component/DefaultTooltipContent";
import Sidebar from "@/components/Sidebar";
import StatusBadge from "@/components/StatusBadge";
import { getLancamentos } from "@/lib/actions";
import { Lancamento } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function buildChartData(lancamentos: Lancamento[]) {
  const anoAtual = new Date().getFullYear();
  return MESES.map((mes, i) => {
    const mesLanc = lancamentos.filter((l) => {
      const d = new Date(l.dataVencimento + "T00:00:00");
      return d.getFullYear() === anoAtual && d.getMonth() === i;
    });
    return {
      mes,
      pagar: mesLanc.filter((l) => l.tipo === "pagar").reduce((s, l) => s + l.valor, 0),
      receber: mesLanc.filter((l) => l.tipo === "receber").reduce((s, l) => s + l.valor, 0),
    };
  });
}

export default function DashboardPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLancamentos().then((data) => { setLancamentos(data); setLoading(false); });
  }, []);

  const pagar = lancamentos.filter((l) => l.tipo === "pagar");
  const receber = lancamentos.filter((l) => l.tipo === "receber");
  const totalPagar = pagar.filter((l) => l.status !== "cancelado").reduce((s, l) => s + l.valor, 0);
  const totalReceber = receber.filter((l) => l.status !== "cancelado").reduce((s, l) => s + l.valor, 0);
  const saldo = totalReceber - totalPagar;
  const pagarPendente = pagar.filter((l) => l.status === "pendente").reduce((s, l) => s + l.valor, 0);
  const receberPendente = receber.filter((l) => l.status === "pendente").reduce((s, l) => s + l.valor, 0);
  const vencidos = lancamentos.filter((l) => l.status === "vencido");
  const recentes = [...lancamentos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 6);
  const chartData = buildChartData(lancamentos);

  const customTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm">
          <p className="text-slate-300 font-medium mb-2">{String(label)}</p>
          {payload.map((p) => (
            <p key={p.name} style={{ color: p.color }}>
              {p.name === "pagar" ? "A Pagar" : "A Receber"}: {formatCurrency(Number(p.value))}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Visão geral das suas finanças</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-500">
              <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mr-3" />
              Carregando dados...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Wallet size={18} className="text-blue-400" />
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium ${saldo >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {saldo >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      Saldo
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Saldo Previsto</p>
                  <p className={`text-xl font-bold mt-1 ${saldo >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatCurrency(saldo)}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                    <TrendingDown size={18} className="text-red-400" />
                  </div>
                  <p className="text-xs text-slate-400">A Pagar (pendente)</p>
                  <p className="text-xl font-bold text-red-400 mt-1">{formatCurrency(pagarPendente)}</p>
                  <p className="text-xs text-slate-500 mt-1">{pagar.filter((l) => l.status === "pendente").length} lançamento(s)</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <TrendingUp size={18} className="text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-400">A Receber (pendente)</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(receberPendente)}</p>
                  <p className="text-xs text-slate-500 mt-1">{receber.filter((l) => l.status === "pendente").length} lançamento(s)</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                    <AlertCircle size={18} className="text-orange-400" />
                  </div>
                  <p className="text-xs text-slate-400">Vencidos</p>
                  <p className="text-xl font-bold text-orange-400 mt-1">{vencidos.length}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatCurrency(vencidos.reduce((s, l) => s + l.valor, 0))}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6">
                  <h2 className="text-sm font-semibold text-white mb-4">Fluxo Anual ({new Date().getFullYear()})</h2>
                  {lancamentos.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Nenhum dado para exibir</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPagar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorReceber" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={customTooltip} />
                        <Area type="monotone" dataKey="pagar" stroke="#ef4444" strokeWidth={2} fill="url(#colorPagar)" />
                        <Area type="monotone" dataKey="receber" stroke="#10b981" strokeWidth={2} fill="url(#colorReceber)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  <div className="flex gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-0.5 bg-red-500 rounded" />A Pagar</span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-0.5 bg-emerald-500 rounded" />A Receber</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-sm font-semibold text-white mb-4">Últimos 3 meses</h2>
                  {lancamentos.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Sem dados</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData.slice(Math.max(0, new Date().getMonth() - 2), new Date().getMonth() + 1)} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} hide />
                        <Tooltip content={customTooltip} />
                        <Bar dataKey="pagar" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="receber" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white mb-4">Lançamentos Recentes</h2>
                {recentes.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">Nenhum lançamento cadastrado ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {recentes.map((l) => (
                      <div key={l.id} className="flex items-center justify-between py-2.5 border-b border-slate-800 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${l.tipo === "pagar" ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
                            {l.tipo === "pagar" ? <TrendingDown size={14} className="text-red-400" /> : <TrendingUp size={14} className="text-emerald-400" />}
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">{l.descricao}</p>
                            <p className="text-xs text-slate-500">Vence {formatDate(l.dataVencimento)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={l.status} />
                          <span className={`text-sm font-semibold ${l.tipo === "pagar" ? "text-red-400" : "text-emerald-400"}`}>
                            {l.tipo === "pagar" ? "-" : "+"}{formatCurrency(l.valor)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
