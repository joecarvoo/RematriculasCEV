import { supabase } from './supabase'
import { Familia, Registro, soDigitos } from './lib'

type LinhaAluno = {
  responsavel_id: string
  alunos: {
    pessoa: { nome_completo: string } | null
    matriculas: {
      status: string
      turma: { nome: string; periodo: string; ano: { ano: number } | null } | null
    }[]
  } | null
}

export async function carregarFamilias(): Promise<Familia[]> {
  const [fam, alu, pref, com] = await Promise.all([
    supabase
      .from('rematricula_familias')
      .select('*, responsavel:pessoas!responsavel_id(nome_completo, telefone_principal, email)'),
    supabase
      .from('responsaveis_alunos')
      .select(
        'responsavel_id, alunos(pessoa:pessoas(nome_completo), matriculas(status, turma:turmas(nome, periodo, ano:anos_letivos(ano))))',
      )
      .eq('responsavel_financeiro', true),
    supabase.from('preferencias_turno_2027').select('telefone, turno_preferido'),
    supabase.from('rematricula_registros').select('familia_id, criado_em').eq('resultado', 'Comunicado geral enviado'),
  ])
  if (fam.error) throw new Error('familias')
  if (alu.error) throw new Error('alunos')
  // Preferência é opcional: se falhar, o painel continua sem o turno.
  const prefs = pref.error ? [] : (pref.data ?? [])

  const alunosPorResp = new Map<string, Familia['alunos']>()
  for (const l of (alu.data ?? []) as unknown as LinhaAluno[]) {
    const m = l.alunos?.matriculas.find((x) => x.status === 'Ativo' && x.turma?.ano?.ano === 2026)
    if (!l.alunos || !m?.turma) continue
    const lista = alunosPorResp.get(l.responsavel_id) ?? []
    lista.push({ nome: l.alunos.pessoa?.nome_completo ?? '', turma: m.turma.nome, periodo: m.turma.periodo })
    alunosPorResp.set(l.responsavel_id, lista)
  }

  // Telefones da preferência vêm com 55 e, às vezes, sem o 9: compara pelos 8 últimos dígitos.
  const turnoPorFinal = new Map<string, string>()
  for (const p of prefs) turnoPorFinal.set(soDigitos(p.telefone).slice(-8), p.turno_preferido)

  const comunicados = new Map<string, string>()
  for (const c of com.data ?? []) comunicados.set(c.familia_id, c.criado_em)

  return (fam.data ?? []).map((f) => {
    const r = f.responsavel as Familia['responsavel']
    return {
      ...f,
      responsavel: r,
      alunos: alunosPorResp.get(f.responsavel_id) ?? [],
      turno2027: turnoPorFinal.get(soDigitos(r?.telefone_principal).slice(-8)) ?? null,
      comunicadoEm: comunicados.get(f.id) ?? null,
    } as Familia
  })
}

export async function carregarRegistros(familiaId: string): Promise<Registro[]> {
  const { data, error } = await supabase
    .from('rematricula_registros')
    .select('*')
    .eq('familia_id', familiaId)
    .order('criado_em', { ascending: false })
  if (error) throw new Error('registros')
  return data as Registro[]
}
