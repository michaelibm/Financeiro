"use client";

import { useState } from "react";
import { Lancamento, TipoLancamento } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "./StatusBadge";
import {
  Pencil, Trash2, CheckCircle2, ChevronUp, ChevronDown,
  Search, ChevronRight, CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SortKey = "descricao" | "valor" | "dataVencimento" | "status" | "categoria";

interface Props {
  lancamentos: Lancamento[];
  tipo: TipoLancamento;
  onEdit: (l: Lancamento) => void;
  onDelete: (id: string) => void;
  onMarcarPago: (id: string) => void;
}

const categoriasLabel: Record<string, string> = {
  aluguel: "Aluguel", energia: "Energia", agua: "Água",
  internet: "Internet", salario: "Salário", fornecedor: "Fornecedor",
  cliente: "Cliente", imposto: "Imposto", manutencao: "Manutenção", outros: "Outros",
};

const MESES_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function mesKey(ano: number, mes: number) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

function labelMes(key: string) {
  const [ano, mes] = key.split("-").map(Number);
  return `${MESES_PT[mes - 1]} ${ano}`;
}

function buildParcelasMap(lancamentos: Lancamento[]) {
  // Agrupa por recorrenciaId (novos) OU por descricao+valor (antigos sem id)
  const grupos: Record<string, Lancamento[]> = {};

  for (const l of lancamentos) {
    const key = l.recorrenciaId ?? `desc:${l.descricao.trim().toLowerCase()}__${l.valor}`;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(l);
  }

  // Remove grupos com só 1 item (não são séries)
  for (const key of Object.keys(grupos)) {
    if (grupos[key].length < 2) delete grupos[key];
    else grupos[key].sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  }

  // Mapeia cada lancamento.id → info da série
  const porId: Record<string, { total: number; posicao: number; faltam: number }> = {};
  for (const grupo of Object.values(grupos)) {
    const faltam = grupo.filter((g) => g.status === "pendente" || g.status === "vencido").length;
    grupo.forEach((l, idx) => {
      porId[l.id] = { total: grupo.length, posicao: idx + 1, faltam };
    });
  }

  return porId;
}

export default function TabelaLancamentos({ lancamentos, tipo, onEdit, onDelete, onMarcarPago }: Props) {
  const agora = new Date();
  const chaveAtual = mesKey(agora.getFullYear(), agora.getMonth());
  const parcelasMap = buildParcelasMap(lancamentos);

  const [sortKey, setSortKey] = useState<SortKey>("dataVencimento");
  const [sortAsc, setSortAsc] = useState(true);
  const [search, setSearch] = useState("");
  const [expandidos, setExpandidos] = useState<Set<string>>(() => new Set([chaveAtual]));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  }

  function toggleMes(key: string) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const sorted = [...lancamentos]
    .filter((l) =>
      l.descricao.toLowerCase().includes(search.toLowerCase()) ||
      l.categoria.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "valor") cmp = a.valor - b.valor;
      else if (sortKey === "dataVencimento") cmp = a.dataVencimento.localeCompare(b.dataVencimento);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else if (sortKey === "descricao") cmp = a.descricao.localeCompare(b.descricao);
      else if (sortKey === "categoria") cmp = a.categoria.localeCompare(b.categoria);
      return sortAsc ? cmp : -cmp;
    });

  // Agrupar por YYYY-MM
  const grupos = sorted.reduce<Record<string, Lancamento[]>>((acc, l) => {
    const k = l.dataVencimento.slice(0, 7);
    if (!acc[k]) acc[k] = [];
    acc[k].push(l);
    return acc;
  }, {});

  const chaves = Object.keys(grupos).sort();

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp size={12} className="opacity-20" />;
    return sortAsc
      ? <ChevronUp size={12} className="text-blue-400" />
      : <ChevronDown size={12} className="text-blue-400" />;
  }

  const thCls = "px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white select-none";

  function ParcelaBadge({ l }: { l: Lancamento }) {
    const info = parcelasMap[l.id];
    if (!info) return null;
    const { total, posicao, faltam } = info;
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full whitespace-nowrap">
        {posicao}/{total}
        {faltam > 0 && (
          <span className="text-yellow-400 font-medium">· falta {faltam}</span>
        )}
      </span>
    );
  }

  function Actions({ l }: { l: Lancamento }) {
    return (
      <div className="flex items-center gap-1">
        {l.status === "pendente" && (
          <button
            onClick={() => onMarcarPago(l.id)}
            title={tipo === "pagar" ? "Marcar como pago" : "Marcar como recebido"}
            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
          >
            <CheckCircle2 size={16} />
          </button>
        )}
        <button
          onClick={() => onEdit(l)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => onDelete(l.id)}
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
          placeholder="Buscar por descrição ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {chaves.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-base">Nenhum lançamento encontrado</p>
          <p className="text-sm mt-1">Clique em &ldquo;Novo lançamento&rdquo; para começar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chaves.map((chave) => {
            const itens = grupos[chave];
            const aberto = expandidos.has(chave);
            const ehAtual = chave === chaveAtual;
            const total = itens.reduce((s, l) => s + l.valor, 0);
            const pendentes = itens.filter((l) => l.status === "pendente").length;

            return (
              <div
                key={chave}
                className={cn(
                  "border rounded-xl overflow-hidden transition-colors",
                  ehAtual ? "border-blue-500/40" : "border-slate-800"
                )}
              >
                {/* Cabeçalho do grupo */}
                <button
                  onClick={() => toggleMes(chave)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 transition-colors text-left",
                    ehAtual ? "bg-blue-500/10 hover:bg-blue-500/15" : "bg-slate-800/50 hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays size={15} className={ehAtual ? "text-blue-400" : "text-slate-500"} />
                    <span className={cn("text-sm font-semibold", ehAtual ? "text-blue-300" : "text-slate-300")}>
                      {labelMes(chave)}
                      {ehAtual && (
                        <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                          mês atual
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {itens.length} {itens.length === 1 ? "lançamento" : "lançamentos"}
                      {pendentes > 0 && (
                        <span className="ml-2 text-yellow-400">{pendentes} pendente{pendentes > 1 ? "s" : ""}</span>
                      )}
                    </span>
                    <span className={cn("text-sm font-bold", tipo === "pagar" ? "text-red-400" : "text-emerald-400")}>
                      {formatCurrency(total)}
                    </span>
                    <ChevronRight
                      size={16}
                      className={cn("text-slate-500 transition-transform", aberto && "rotate-90")}
                    />
                  </div>
                </button>

                {/* Conteúdo expandido */}
                {aberto && (
                  <>
                    {/* Mobile: cards */}
                    <div className="md:hidden divide-y divide-slate-800/60">
                      {itens.map((l) => (
                        <div key={l.id} className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <p className="text-sm font-semibold text-white truncate">{l.descricao}</p>
                                <ParcelaBadge l={l} />
                              </div>
                              <p className="text-xs text-slate-500">
                                {categoriasLabel[l.categoria] ?? l.categoria}
                                {l.dataPagamento && ` · ${tipo === "pagar" ? "Pago" : "Recebido"} em ${formatDate(l.dataPagamento)}`}
                              </p>
                            </div>
                            <span className={cn("text-sm font-bold shrink-0", tipo === "pagar" ? "text-red-400" : "text-emerald-400")}>
                              {formatCurrency(l.valor)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={l.status} />
                              <span className="text-xs text-slate-400">{formatDate(l.dataVencimento)}</span>
                            </div>
                            <Actions l={l} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-900/60 border-b border-slate-800">
                          <tr>
                            <th className={thCls} onClick={() => toggleSort("descricao")}>
                              <span className="flex items-center gap-1">Descrição <SortIcon k="descricao" /></span>
                            </th>
                            <th className={thCls} onClick={() => toggleSort("categoria")}>
                              <span className="flex items-center gap-1">Categoria <SortIcon k="categoria" /></span>
                            </th>
                            <th className={thCls} onClick={() => toggleSort("valor")}>
                              <span className="flex items-center gap-1">Valor <SortIcon k="valor" /></span>
                            </th>
                            <th className={thCls} onClick={() => toggleSort("dataVencimento")}>
                              <span className="flex items-center gap-1">Vencimento <SortIcon k="dataVencimento" /></span>
                            </th>
                            <th className={thCls} onClick={() => toggleSort("status")}>
                              <span className="flex items-center gap-1">Status <SortIcon k="status" /></span>
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {itens.map((l) => (
                            <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-white">{l.descricao}</p>
                                  <ParcelaBadge l={l} />
                                </div>
                                {l.dataPagamento && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {tipo === "pagar" ? "Pago" : "Recebido"} em {formatDate(l.dataPagamento)}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full">
                                  {categoriasLabel[l.categoria] ?? l.categoria}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={cn("text-sm font-semibold", tipo === "pagar" ? "text-red-400" : "text-emerald-400")}>
                                  {formatCurrency(l.valor)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-300">{formatDate(l.dataVencimento)}</td>
                              <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end"><Actions l={l} /></div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
