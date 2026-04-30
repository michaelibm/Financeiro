export type TipoLancamento = "pagar" | "receber";
export type StatusLancamento = "pendente" | "pago" | "vencido" | "cancelado";
export type Categoria =
  | "aluguel"
  | "energia"
  | "agua"
  | "internet"
  | "salario"
  | "fornecedor"
  | "cliente"
  | "imposto"
  | "manutencao"
  | "outros";

export interface Lancamento {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: StatusLancamento;
  categoria: Categoria;
  observacao?: string;
  criadoEm: string;
  recorrenciaId?: string;
}
