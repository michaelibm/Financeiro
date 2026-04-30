"use client";

import { useState } from "react";
import { Lancamento, TipoLancamento, Categoria, StatusLancamento } from "@/lib/types";
import { cn } from "@/lib/utils";

const categorias: { value: Categoria; label: string }[] = [
  { value: "aluguel", label: "Aluguel" },
  { value: "energia", label: "Energia" },
  { value: "agua", label: "Água" },
  { value: "internet", label: "Internet" },
  { value: "salario", label: "Salário" },
  { value: "fornecedor", label: "Fornecedor" },
  { value: "cliente", label: "Cliente" },
  { value: "imposto", label: "Imposto" },
  { value: "manutencao", label: "Manutenção" },
  { value: "outros", label: "Outros" },
];

interface Props {
  tipo: TipoLancamento;
  inicial?: Partial<Lancamento>;
  permitirRecorrencia?: boolean;
  onSave: (dados: Omit<Lancamento, "id" | "criadoEm">, mesesRecorrencia?: number) => void;
  onCancel: () => void;
}

export default function LancamentoForm({ tipo, inicial, permitirRecorrencia, onSave, onCancel }: Props) {
  const hoje = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    descricao: inicial?.descricao ?? "",
    valor: inicial?.valor?.toString() ?? "",
    dataVencimento: inicial?.dataVencimento ?? hoje,
    dataPagamento: inicial?.dataPagamento ?? "",
    status: inicial?.status ?? ("pendente" as StatusLancamento),
    categoria: inicial?.categoria ?? ("outros" as Categoria),
    observacao: inicial?.observacao ?? "",
  });

  const [recorrente, setRecorrente] = useState(false);
  const [mesesRecorrencia, setMesesRecorrencia] = useState(2);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.descricao.trim()) e.descricao = "Obrigatório";
    if (!form.valor || isNaN(Number(form.valor)) || Number(form.valor) <= 0)
      e.valor = "Valor inválido";
    if (!form.dataVencimento) e.dataVencimento = "Obrigatório";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave(
      {
        tipo,
        descricao: form.descricao.trim(),
        valor: Number(form.valor),
        dataVencimento: form.dataVencimento,
        dataPagamento: form.dataPagamento || undefined,
        status: form.status,
        categoria: form.categoria,
        observacao: form.observacao.trim() || undefined,
      },
      permitirRecorrencia && recorrente ? mesesRecorrencia : undefined
    );
  }

  const field = (key: string) => ({
    value: form[key as keyof typeof form],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
      setErrors((p) => ({ ...p, [key]: "" }));
    },
  });

  const inputCls = (err?: string) =>
    cn(
      "w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors",
      err ? "border-red-500 focus:border-red-400" : "border-slate-700 focus:border-blue-500"
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Descrição *</label>
          <input
            className={inputCls(errors.descricao)}
            placeholder="Ex: Aluguel mês de maio"
            {...field("descricao")}
          />
          {errors.descricao && <p className="text-xs text-red-400 mt-1">{errors.descricao}</p>}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Valor (R$) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputCls(errors.valor)}
            placeholder="0,00"
            {...field("valor")}
          />
          {errors.valor && <p className="text-xs text-red-400 mt-1">{errors.valor}</p>}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Categoria</label>
          <select className={inputCls()} {...field("categoria")}>
            {categorias.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Vencimento *</label>
          <input
            type="date"
            className={inputCls(errors.dataVencimento)}
            {...field("dataVencimento")}
          />
          {errors.dataVencimento && (
            <p className="text-xs text-red-400 mt-1">{errors.dataVencimento}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            {tipo === "pagar" ? "Data de Pagamento" : "Data de Recebimento"}
          </label>
          <input type="date" className={inputCls()} {...field("dataPagamento")} />
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Status</label>
          <select className={inputCls()} {...field("status")}>
            <option value="pendente">Pendente</option>
            <option value="pago">{tipo === "pagar" ? "Pago" : "Recebido"}</option>
            <option value="vencido">Vencido</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Observação</label>
          <textarea
            className={cn(inputCls(), "resize-none h-20")}
            placeholder="Observações opcionais..."
            value={form.observacao}
            onChange={(e) => setForm((p) => ({ ...p, observacao: e.target.value }))}
          />
        </div>
      </div>

      {permitirRecorrencia && !inicial?.id && (
        <div className="border border-slate-700 rounded-xl p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setRecorrente((v) => !v)}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                recorrente ? "bg-blue-600" : "bg-slate-700"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  recorrente ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </div>
            <span className="text-sm text-slate-300">Lançamento recorrente</span>
          </label>

          {recorrente && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-400 shrink-0">Repetir por</label>
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={mesesRecorrencia}
                  onChange={(e) => setMesesRecorrencia(Math.max(2, Math.min(60, Number(e.target.value))))}
                  className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white text-center outline-none focus:border-blue-500"
                />
                <label className="text-xs text-slate-400">meses</label>
              </div>
              <p className="text-xs text-blue-400 bg-blue-500/10 rounded-lg px-3 py-2">
                Serão criados <strong>{mesesRecorrencia} lançamentos</strong> mensais a partir de{" "}
                {form.dataVencimento
                  ? new Date(form.dataVencimento + "T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={cn(
            "flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors",
            tipo === "pagar"
              ? "bg-red-600 hover:bg-red-500"
              : "bg-emerald-600 hover:bg-emerald-500"
          )}
        >
          {inicial?.id ? "Salvar alterações" : "Adicionar"}
        </button>
      </div>
    </form>
  );
}
