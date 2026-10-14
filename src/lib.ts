export type Risco = 'verde' | 'amarela' | 'vermelha'
export type Canal = 'presencial' | 'whatsapp' | 'ligacao'

export const ETIQUETAS = [
  'remanejado',
  'quarto_ano',
  'irmaos',
  'responsavel_legal',
  'integral',
  'matricula_27xxx',
] as const

export const ETIQUETA_NOME: Record<string, string> = {
  remanejado: 'Remanejado',
  quarto_ano: '4º ano',
  irmaos: 'Irmãos',
  responsavel_legal: 'Resp. legal',
  integral: 'Integral',
  matricula_27xxx: 'Matrícula 27',
}

export type Familia = {
  id: string
  responsavel_id: string
  risco: Risco
  contatado_em: string | null
  respondeu_em: string | null
  reserva_confirmada_em: string | null
  pago_em: string | null
  proximo_contato: string | null
  observacao: string | null
  etiquetas: string[]
  responsavel: { nome_completo: string; telefone_principal: string | null; email: string | null } | null
  alunos: { nome: string; turma: string; periodo: string }[]
  turno2027: string | null
}

export type Registro = {
  id: string
  familia_id: string
  criado_em: string
  canal: Canal
  resultado: string
  nota: string | null
  proximo_contato: string | null
}

export type Etapa = 'sem_contato' | 'contatada' | 'respondeu' | 'reserva' | 'paga'

export function etapa(f: Familia): Etapa {
  if (f.pago_em) return 'paga'
  if (f.reserva_confirmada_em) return 'reserva'
  if (f.respondeu_em) return 'respondeu'
  if (f.contatado_em) return 'contatada'
  return 'sem_contato'
}

export const ETAPA_NOME: Record<Etapa, string> = {
  sem_contato: 'Sem contato',
  contatada: 'Contatada',
  respondeu: 'Respondeu',
  reserva: 'Reserva confirmada',
  paga: 'Paga',
}

/** Data de hoje (AAAA-MM-DD) em Manaus, não importa o fuso do aparelho. */
export function hoje(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Manaus' }).format(new Date())
}

export function dataCurta(iso: string | null): string {
  if (!iso) return ''
  const d = iso.length === 10 ? new Date(iso + 'T12:00:00-04:00') : new Date(iso)
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Manaus',
    day: '2-digit',
    month: '2-digit',
    ...(iso.length === 10 ? {} : { hour: '2-digit', minute: '2-digit' }),
  }).format(d)
}

const ORDEM_RISCO: Record<Risco, number> = { vermelha: 0, amarela: 1, verde: 2 }

export function ordenar(a: Familia, b: Familia): number {
  return (
    ORDEM_RISCO[a.risco] - ORDEM_RISCO[b.risco] ||
    (a.proximo_contato ?? '').localeCompare(b.proximo_contato ?? '') ||
    (a.responsavel?.nome_completo ?? '').localeCompare(b.responsavel?.nome_completo ?? '', 'pt-BR')
  )
}

/** Aparece em "Hoje": não pagou e (nunca foi contatada ou o próximo contato venceu). */
export function deveAbordarHoje(f: Familia, dia: string): boolean {
  if (f.pago_em) return false
  if (!f.contatado_em) return true
  return Boolean(f.proximo_contato && f.proximo_contato <= dia)
}

export function soDigitos(s: string | null | undefined): string {
  return (s ?? '').replace(/\D/g, '')
}

export function linkWhatsApp(tel: string | null | undefined): string | null {
  const d = soDigitos(tel)
  if (d.length < 10) return null
  return `https://wa.me/${d.startsWith('55') && d.length >= 12 ? d : '55' + d}`
}

/** Marcos da campanha (proposta do briefing, ajustável aqui). */
export const MARCOS = [
  { data: '2026-10-23', rotulo: 'Sex 23/10', texto: '54 contatadas e 38 com resposta', campo: 'respondeu', meta: 38 },
  { data: '2026-10-31', rotulo: 'Sáb 31/10', texto: '54 com reserva confirmada', campo: 'reserva', meta: 54 },
  { data: '2026-11-10', rotulo: 'Ter 10/11', texto: '27 pagas (50%)', campo: 'paga', meta: 27 },
  { data: '2026-11-20', rotulo: 'Sex 20/11', texto: '43 pagas (80%)', campo: 'paga', meta: 43 },
  { data: '2026-11-27', rotulo: 'Sex 27/11', texto: '54 pagas', campo: 'paga', meta: 54 },
] as const
