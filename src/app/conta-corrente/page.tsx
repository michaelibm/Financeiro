"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ArrowDownLeft, ArrowUpRight, Landmark, TrendingDown, TrendingUp,
  Calendar, ChevronDown, PlusCircle, X, ArrowUp, ArrowDown,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getLancamentos, addLancamento } from "@/lib/actions";
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

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export default function ContaCorrentePage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroMes, setFiltroMes] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Modal de ajuste
  const [modalAberto, setModalAberto] = useState(false);
  const [ajusteTipo, setAjusteTipo] = useState<"entrada" | "saida">("entrada");
  const [ajusteValor, setAjusteValor] = useState("");
  const [ajusteDescricao, setAjusteDescricao] = useState("");
  const [ajusteData, setAjusteData] = useState(hoje);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    getLancamentos().then((data) => { setLancamentos(data); setLoading(false); });
  }, []);

  const pagos = useMemo(() =>
    [...lancamentos]
      .filter((l) => l.status === "pago" && l.dataPagamento)
      .sort((a, b) => a.dataPagamento!.localeCompare(b.dataPagamento!)),
    [lancamentos]
  );

  const saldoAtual = useMemo(() =>
    pagos.reduce((s, l) => s + (l.tipo === "receber" ? l.valor : -l.valor), 0),
    [pagos]
  );

  const mesesDisponiveis = useMemo(() => {
    const set = new Set(pagos.map((l) => l.dataPagamento!.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [pagos]);

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

  function abrirModal() {
    setAjusteTipo("entrada");
    setAjusteValor("");
    setAjusteDescricao("");
    setAjusteData(hoje());
    setModalAberto(true);
  }

  async function salvarAjuste() {
    const valor = parseFloat(ajusteValor.replace(",", "."));
    if (!valor || valor <= 0 || !ajusteDescricao.trim() || !ajusteData) return;
    setSalvando(true);
    try {
      await addLancamento({
        tipo: ajusteTipo === "entrada" ? "receber" : "pagar",
        descricao: ajusteDescricao.trim(),
        valor,
        dataVencimento: ajusteData,
        dataPagamento: ajusteData,
        status: "pago",
        categoria: "outros",
      });
      const data = await getLancamentos();
      setLancamentos(data);
      setModalAberto(false);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Landmark size={20} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Conta Corrente</h1>
                <p className="text-sm text-slate-400">Extrato de movimentações</p>
              </div>
            </div>
            <button
              onClick={abrirModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
            >
              <PlusCircle size={16} />
              <span className="hidden sm:inline">Ajuste Manual</span>
              <span className="sm:hidden">Ajuste</span>
            </button>
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

      {/* Modal de Ajuste Manual */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalAberto(false)} />
          <div className="relative w-full md:max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl md:rounded-2xl p-6 space-y-5 shadow-2xl">
            {/* Drag handle mobile */}
            <div className="md:hidden w-10 h-1 bg-slate-700 rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Ajuste Manual</h2>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tipo: Entrada / Saída */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAjusteTipo("entrada")}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all",
                  ajusteTipo === "entrada"
                    ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                )}
              >
                <ArrowUp size={16} /> Entrada
              </button>
              <button
                onClick={() => setAjusteTipo("saida")}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all",
                  ajusteTipo === "saida"
                    ? "bg-red-500/15 border-red-500/50 text-red-400"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                )}
              >
                <ArrowDown size={16} /> Saída
              </button>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Valor</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  value={ajusteValor}
                  onChange={(e) => setAjusteValor(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Depósito, Saque, Ajuste..."
                value={ajusteDescricao}
                onChange={(e) => setAjusteDescricao(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Data */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Data</label>
              <input
                type="date"
                value={ajusteData}
                onChange={(e) => setAjusteData(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Botão salvar */}
            <button
              onClick={salvarAjuste}
              disabled={salvando || !ajusteValor || !ajusteDescricao.trim() || !ajusteData}
              className={cn(
                "w-full py-3 rounded-xl text-sm font-semibold transition-all",
                ajusteTipo === "entrada"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
                  : "bg-red-600 hover:bg-red-500 text-white disabled:opacity-40"
              )}
            >
              {salvando ? "Salvando..." : ajusteTipo === "entrada" ? "Registrar Entrada" : "Registrar Saída"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
