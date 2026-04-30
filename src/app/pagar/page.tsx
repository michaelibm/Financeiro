"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, TrendingDown } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Modal from "@/components/Modal";
import LancamentoForm from "@/components/LancamentoForm";
import TabelaLancamentos from "@/components/TabelaLancamentos";
import Toast from "@/components/Toast";
import { Lancamento } from "@/lib/types";
import {
  getLancamentos,
  addLancamento,
  addLancamentosRecorrentes,
  updateLancamento,
  deleteLancamento,
} from "@/lib/actions";
import { formatCurrency } from "@/lib/utils";

export default function ContasAPagarPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    const todos = await getLancamentos();
    setLancamentos(todos.filter((l) => l.tipo === "pagar"));
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function handleSave(dados: Omit<Lancamento, "id" | "criadoEm">, mesesRecorrencia?: number) {
    try {
      if (editando) {
        await updateLancamento(editando.id, dados);
        setToast({ message: "Lançamento atualizado com sucesso!", type: "success" });
      } else if (mesesRecorrencia && mesesRecorrencia > 1) {
        await addLancamentosRecorrentes(dados, mesesRecorrencia);
        setToast({ message: `${mesesRecorrencia} lançamentos recorrentes criados!`, type: "success" });
      } else {
        await addLancamento(dados);
        setToast({ message: "Conta cadastrada com sucesso!", type: "success" });
      }
      setModalAberto(false);
      setEditando(null);
      carregar();
    } catch {
      setToast({ message: "Erro ao salvar. Tente novamente.", type: "error" });
    }
  }

  function handleEdit(l: Lancamento) {
    setEditando(l);
    setModalAberto(true);
  }

  async function handleDelete(id: string) {
    if (confirm("Confirmar exclusão?")) {
      try {
        await deleteLancamento(id);
        setToast({ message: "Lançamento excluído.", type: "success" });
        carregar();
      } catch {
        setToast({ message: "Erro ao excluir.", type: "error" });
      }
    }
  }

  async function handleMarcarPago(id: string) {
    try {
      await updateLancamento(id, {
        status: "pago",
        dataPagamento: new Date().toISOString().split("T")[0],
      });
      setToast({ message: "Marcado como pago!", type: "success" });
      carregar();
    } catch {
      setToast({ message: "Erro ao atualizar status.", type: "error" });
    }
  }

  const agora = new Date();
  const mesAtualKey = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const doMesAtual = lancamentos.filter((l) => l.dataVencimento.slice(0, 7) === mesAtualKey);

  const total = doMesAtual.reduce((s, l) => s + l.valor, 0);
  const pendentes = doMesAtual.filter((l) => l.status === "pendente");
  const pagos = doMesAtual.filter((l) => l.status === "pago");
  const vencidos = doMesAtual.filter((l) => l.status === "vencido");

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown size={20} className="text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Contas a Pagar</h1>
                <p className="text-sm text-slate-400">{doMesAtual.length} lançamento(s) em {agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
              </div>
            </div>
            <button
              onClick={() => { setEditando(null); setModalAberto(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={16} />
              Novo lançamento
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: "Total", value: formatCurrency(total), cls: "text-white" },
              { label: "Pendentes", value: formatCurrency(pendentes.reduce((s, l) => s + l.valor, 0)), cls: "text-yellow-400" },
              { label: "Pagos", value: formatCurrency(pagos.reduce((s, l) => s + l.valor, 0)), cls: "text-emerald-400" },
              { label: "Vencidos", value: formatCurrency(vencidos.reduce((s, l) => s + l.valor, 0)), cls: "text-red-400" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className={`text-lg font-bold ${cls}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mr-3" />
                Carregando...
              </div>
            ) : (
              <TabelaLancamentos
                lancamentos={lancamentos}
                tipo="pagar"
                onEdit={handleEdit}
                onDelete={handleDelete}
                onMarcarPago={handleMarcarPago}
              />
            )}
          </div>
        </div>
      </main>

      <Modal
        open={modalAberto}
        onClose={() => { setModalAberto(false); setEditando(null); }}
        title={editando ? "Editar lançamento" : "Nova conta a pagar"}
      >
        <LancamentoForm
          tipo="pagar"
          inicial={editando ?? undefined}
          permitirRecorrencia
          onSave={handleSave}
          onCancel={() => { setModalAberto(false); setEditando(null); }}
        />
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
