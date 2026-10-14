import { supabase } from './supabase'
import { Canal, Familia, Risco } from './lib'

export type Marco = 'contatado_em' | 'respondeu_em' | 'reserva_confirmada_em' | 'pago_em'
const SEQUENCIA: Marco[] = ['contatado_em', 'respondeu_em', 'reserva_confirmada_em', 'pago_em']
const RESULTADO: Record<Marco, string> = {
  contatado_em: 'Contatada',
  respondeu_em: 'Respondeu',
  reserva_confirmada_em: 'Reserva confirmada',
  pago_em: 'Pagou',
}
export const NOME_MARCO = RESULTADO

export async function registrar(
  familiaId: string,
  canal: Canal,
  resultado: string,
  nota?: string,
  proximo?: string | null,
) {
  const { error } = await supabase.from('rematricula_registros').insert({
    familia_id: familiaId,
    canal,
    resultado,
    nota: nota || null,
    proximo_contato: proximo || null,
  })
  if (error) throw new Error('registrar')
}

/** Marca uma etapa. Quem reservou já foi contatado e respondeu: as anteriores sobem juntas. */
export async function marcar(f: Familia, marco: Marco, canal: Canal) {
  const agora = new Date().toISOString()
  const patch: Partial<Record<Marco, string>> = {}
  for (const m of SEQUENCIA.slice(0, SEQUENCIA.indexOf(marco) + 1)) {
    if (!f[m]) patch[m] = agora
  }
  const { error } = await supabase.from('rematricula_familias').update(patch).eq('id', f.id)
  if (error) throw new Error('marcar')
  await registrar(f.id, canal, RESULTADO[marco])
}

/** Desfaz uma etapa e as seguintes. O histórico fica (a correção também é registrada). */
export async function desfazer(f: Familia, marco: Marco, canal: Canal) {
  const patch: Partial<Record<Marco, null>> = {}
  for (const m of SEQUENCIA.slice(SEQUENCIA.indexOf(marco))) patch[m] = null
  const { error } = await supabase.from('rematricula_familias').update(patch).eq('id', f.id)
  if (error) throw new Error('desfazer')
  await registrar(f.id, canal, `Corrigido: "${RESULTADO[marco]}" desfeito`)
}

export async function anotar(f: Familia, canal: Canal, nota: string, proximo: string | null) {
  const { error } = await supabase
    .from('rematricula_familias')
    .update({ observacao: nota || f.observacao, proximo_contato: proximo })
    .eq('id', f.id)
  if (error) throw new Error('anotar')
  await registrar(f.id, canal, 'Anotação', nota, proximo)
}

export async function salvarRisco(id: string, risco: Risco) {
  const { error } = await supabase.from('rematricula_familias').update({ risco }).eq('id', id)
  if (error) throw new Error('risco')
}

export async function salvarEtiquetas(id: string, etiquetas: string[]) {
  const { error } = await supabase.from('rematricula_familias').update({ etiquetas }).eq('id', id)
  if (error) throw new Error('etiquetas')
}
