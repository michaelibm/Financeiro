"use server";

import sql from "./db";
import { Lancamento, TipoLancamento } from "./types";

function toDateStr(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function rowToLancamento(row: Record<string, unknown>): Lancamento {
  return {
    id: row.id as string,
    tipo: row.tipo as TipoLancamento,
    descricao: row.descricao as string,
    valor: Number(row.valor),
    dataVencimento: toDateStr(row.data_vencimento),
    dataPagamento: row.data_pagamento ? toDateStr(row.data_pagamento) : undefined,
    status: row.status as Lancamento["status"],
    categoria: row.categoria as Lancamento["categoria"],
    observacao: row.observacao as string | undefined,
    criadoEm: row.criado_em instanceof Date
      ? (row.criado_em as Date).toISOString()
      : row.criado_em as string,
    recorrenciaId: row.recorrencia_id as string | undefined,
  };
}

export async function getLancamentos(): Promise<Lancamento[]> {
  const rows = await sql`
    SELECT * FROM lancamentos ORDER BY data_vencimento ASC
  `;
  return rows.map(rowToLancamento);
}

export async function addLancamento(
  dados: Omit<Lancamento, "id" | "criadoEm">
): Promise<Lancamento> {
  const rows = await sql`
    INSERT INTO lancamentos
      (tipo, descricao, valor, data_vencimento, data_pagamento, status, categoria, observacao)
    VALUES
      (${dados.tipo}, ${dados.descricao}, ${dados.valor}, ${dados.dataVencimento},
       ${dados.dataPagamento ?? null}, ${dados.status}, ${dados.categoria},
       ${dados.observacao ?? null})
    RETURNING *
  `;
  return rowToLancamento(rows[0]);
}

export async function updateLancamento(
  id: string,
  dados: Partial<Omit<Lancamento, "id" | "criadoEm">>
): Promise<void> {
  await sql`
    UPDATE lancamentos SET
      tipo             = COALESCE(${dados.tipo ?? null}, tipo),
      descricao        = COALESCE(${dados.descricao ?? null}, descricao),
      valor            = COALESCE(${dados.valor ?? null}, valor),
      data_vencimento  = COALESCE(${dados.dataVencimento ?? null}::date, data_vencimento),
      data_pagamento   = CASE WHEN ${dados.dataPagamento !== undefined} THEN ${dados.dataPagamento ?? null}::date ELSE data_pagamento END,
      status           = COALESCE(${dados.status ?? null}, status),
      categoria        = COALESCE(${dados.categoria ?? null}, categoria),
      observacao       = CASE WHEN ${dados.observacao !== undefined} THEN ${dados.observacao ?? null} ELSE observacao END
    WHERE id = ${id}
  `;
}

export async function deleteLancamento(id: string): Promise<void> {
  await sql`DELETE FROM lancamentos WHERE id = ${id}`;
}

export async function addLancamentosRecorrentes(
  dados: Omit<Lancamento, "id" | "criadoEm">,
  meses: number
): Promise<void> {
  // Gera um UUID para vincular todas as parcelas desta recorrência
  const recorrenciaRows = await sql`SELECT gen_random_uuid() AS uid`;
  const recorrenciaId = recorrenciaRows[0].uid as string;

  const diaOriginal = new Date(dados.dataVencimento + "T00:00:00").getDate();

  for (let i = 0; i < meses; i++) {
    const d = new Date(dados.dataVencimento + "T00:00:00");
    const ano = d.getFullYear();
    const mes = d.getMonth() + i;
    const anoFinal = ano + Math.floor(mes / 12);
    const mesFinal = mes % 12;
    const ultimoDia = new Date(anoFinal, mesFinal + 1, 0).getDate();
    d.setFullYear(anoFinal, mesFinal, Math.min(diaOriginal, ultimoDia));

    const dataVencimento = d.toISOString().slice(0, 10);
    await sql`
      INSERT INTO lancamentos
        (tipo, descricao, valor, data_vencimento, data_pagamento, status, categoria, observacao, recorrencia_id)
      VALUES
        (${dados.tipo}, ${dados.descricao}, ${dados.valor}, ${dataVencimento},
         ${dados.dataPagamento ?? null}, ${dados.status}, ${dados.categoria},
         ${dados.observacao ?? null}, ${recorrenciaId}::uuid)
    `;
  }
}
