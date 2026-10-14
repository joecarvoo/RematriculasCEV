import { ETAPA_NOME, Familia, etapa } from './lib'

export const tirarAcento = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Distância de edição limitada a 1 (troca, falta ou sobra de uma letra). */
function ateUmaLetra(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  if (i === a.length && i === b.length) return true
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1)
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1)
}

/** Pontuação de uma palavra do nome para o trecho digitado. 0 = não combina. */
function pontuar(palavra: string, q: string): number {
  if (palavra.startsWith(q)) return 3 // começa igual: melhor
  if (palavra.includes(q)) return 2 // tem no meio
  // erro de digitação: uma letra a mais, a menos ou trocada no começo da palavra
  if (q.length >= 4 && [0, 1, -1].some((d) => ateUmaLetra(palavra.slice(0, q.length + d), q))) return 1
  return 0
}

export type Achado = { familia: Familia; nota: number; porAluno: string | null }

export function buscar(familias: Familia[], consulta: string): Achado[] {
  const termos = tirarAcento(consulta).split(/\s+/).filter(Boolean)
  if (termos.join('').length < 3) return []

  const achados: Achado[] = []
  for (const f of familias) {
    const nomes = [{ texto: f.responsavel?.nome_completo ?? '', aluno: false }, ...f.alunos.map((a) => ({ texto: a.nome, aluno: true }))]
    let melhor = 0
    let porAluno: string | null = null
    for (const n of nomes) {
      const palavras = tirarAcento(n.texto).split(/\s+/)
      // Todos os termos digitados precisam combinar com alguma palavra do mesmo nome.
      const notas = termos.map((t) => Math.max(0, ...palavras.map((p) => pontuar(p, t))))
      if (notas.every((x) => x > 0)) {
        const total = notas.reduce((x, y) => x + y, 0) / termos.length
        if (total > melhor) {
          melhor = total
          porAluno = n.aluno ? n.texto : null
        }
      }
    }
    if (melhor > 0) achados.push({ familia: f, nota: melhor, porAluno })
  }
  return achados.sort(
    (a, b) => b.nota - a.nota || (a.familia.responsavel?.nome_completo ?? '').localeCompare(b.familia.responsavel?.nome_completo ?? '', 'pt-BR'),
  )
}

export const resumoEtapa = (f: Familia) => ETAPA_NOME[etapa(f)]
