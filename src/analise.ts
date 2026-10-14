import { Familia, Registro, hoje } from './lib'
import { tirarAcento } from './busca'

/** Cálculos do Painel e do Relatório. Tudo no horário de Manaus. */
export const INICIO_CAMPANHA = '2026-10-19'
export const FIM_CAMPANHA = '2026-11-30'
export const SEMANA = { inicio: '2026-10-19', fim: '2026-10-23' }
export const LIMITE_PARADA_DIAS = 3

const fmtDia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Manaus' })
export const diaDe = (iso: string | null): string | null => (iso ? fmtDia.format(new Date(iso)) : null)

export function diasEntre(a: string, b: string): string[] {
  const out: string[] = []
  const fim = new Date(b + 'T12:00:00Z').getTime()
  for (let t = new Date(a + 'T12:00:00Z').getTime(); t <= fim && out.length < 90; t += 86400000) out.push(new Date(t).toISOString().slice(0, 10))
  return out
}

export function rotuloDia(d: string) {
  const dt = new Date(d + 'T12:00:00Z')
  const sem = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(dt).replace('.', '')
  const [, m, dia] = d.split('-')
  return { num: dia, sem, curto: `${dia}/${m}`, cheio: `${sem} ${dia}/${m}` }
}

export type Contagem = { contatadas: number; responderam: number; reservas: number; pagas: number }
const zero = (): Contagem => ({ contatadas: 0, responderam: 0, reservas: 0, pagas: 0 })

/** Quantas famílias cumpriram cada etapa em cada dia (pelo dia em que o botão foi tocado). */
export function contagemPorDia(familias: Familia[]): Map<string, Contagem> {
  const m = new Map<string, Contagem>()
  const campos: [keyof Familia, keyof Contagem][] = [
    ['contatado_em', 'contatadas'],
    ['respondeu_em', 'responderam'],
    ['reserva_confirmada_em', 'reservas'],
    ['pago_em', 'pagas'],
  ]
  for (const f of familias)
    for (const [campo, chave] of campos) {
      const d = diaDe(f[campo] as string | null)
      if (!d) continue
      const c = m.get(d) ?? zero()
      c[chave]++
      m.set(d, c)
    }
  return m
}

/** Dias do gráfico: do início da campanha (ou do primeiro registro, se vier antes) até 30/11. */
export function diasDoGrafico(porDia: Map<string, Contagem>): string[] {
  const antes = [...porDia.keys()].sort()[0]
  return diasEntre(antes && antes < INICIO_CAMPANHA ? antes : INICIO_CAMPANHA, FIM_CAMPANHA)
}

export function ultimaAtividade(f: Familia, registros: Registro[]): string | null {
  const datas = [f.contatado_em, f.respondeu_em, f.reserva_confirmada_em, f.pago_em]
  for (const r of registros) if (r.familia_id === f.id) datas.push(r.criado_em)
  return datas.filter(Boolean).sort().pop() ?? null
}

export type Parada = { familia: Familia; dias: number }

/** Em andamento e sem nenhuma atividade há mais de 3 dias. Depois de 1º/11, quem reservou e não pagou também entra. */
export function paradas(familias: Familia[], registros: Registro[], agora = Date.now()): Parada[] {
  const emNovembro = hoje() >= '2026-11-01'
  const out: Parada[] = []
  for (const f of familias) {
    if (!f.contatado_em || f.pago_em) continue
    if (f.reserva_confirmada_em && !emNovembro) continue
    const u = ultimaAtividade(f, registros)
    if (!u) continue
    const dias = Math.floor((agora - new Date(u).getTime()) / 86400000)
    if (dias > LIMITE_PARADA_DIAS) out.push({ familia: f, dias })
  }
  return out.sort((a, b) => b.dias - a.dias)
}

/** Motivos de hesitação, achados nas anotações (palavras-chave, sem acento). */
export const MOTIVOS = [
  { id: 'preco', nome: 'Preço e desconto', re: /pre[cç]o|caro|valor|desconto|mensalidade|reajuste|boleto|pagar/ },
  { id: 'turno', nome: 'Turno e horário', re: /turno|hor[aá]rio|manha|tarde|integral|rotina/ },
  { id: 'turma', nome: 'Turma e série', re: /turma|remaneja|s[eé]rie|[34]\s*[ºo°]?\s*ano|quarto ano/ },
  { id: 'escola', nome: 'Comparando escolas', re: /outra escola|outras escolas|comparar|conhecer outr|mudar de escola|transfer/ },
  { id: 'familia', nome: 'Decisão em família', re: /marido|esposa|esposo|conjuge|pensar|conversar com|avo\b/ },
  { id: 'logistica', nome: 'Transporte e mudança', re: /transporte|mudanca|mudando|distancia|longe|viagem|\bvan\b/ },
] as const

export type Hesitacao = { id: string; nome: string; notas: { familia: Familia; texto: string; quando: string }[] }

export function hesitacoes(familias: Familia[], registros: Registro[], dentro: (iso: string) => boolean): Hesitacao[] {
  const porId = new Map(familias.map((f) => [f.id, f]))
  const out: Hesitacao[] = [...MOTIVOS.map((m) => ({ id: m.id, nome: m.nome, notas: [] as Hesitacao['notas'] })), { id: 'outros', nome: 'Outros motivos', notas: [] }]
  for (const r of registros) {
    const f = porId.get(r.familia_id)
    if (!f || r.resultado !== 'Anotação' || !r.nota || !dentro(r.criado_em)) continue
    const t = tirarAcento(r.nota)
    const achou = MOTIVOS.filter((m) => m.re.test(t))
    for (const m of achou.length ? achou : [{ id: 'outros' }]) out.find((o) => o.id === m.id)!.notas.push({ familia: f, texto: r.nota, quando: r.criado_em })
  }
  return out.filter((o) => o.notas.length > 0).sort((a, b) => b.notas.length - a.notas.length)
}
