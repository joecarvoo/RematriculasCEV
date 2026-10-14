// Envia o comunicado geral da rematrícula 2027 pela Evolution API.
// Roda com a identidade de quem clicou (RLS vale): só o administrador consegue.
// Segredos (Supabase → Edge Functions → Secrets): EVOLUTION_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE
// Opcional: EVOLUTION_VERSION ("2" é o padrão; use "1" para a Evolution v1).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const RESULTADO = 'Comunicado geral enviado'

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const primeiroNome = (n: string) => {
  const p = n.trim().split(/\s+/)[0] ?? ''
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
}

function listaNomes(nomes: string[]) {
  if (nomes.length <= 1) return nomes[0] ?? ''
  return nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1]
}

// Texto do comunicado geral (plano de 14/10), personalizado com responsável e aluno(s).
function comunicado(responsavel: string, alunos: string[]) {
  return `Olá, ${responsavel}! 💙

Estamos organizando as turmas de 2027 e queremos garantir a vaga de ${listaNomes(alunos)}, no turno que faz mais sentido para a rotina de vocês.

Nesta semana nossa equipe vai conversar com cada família, pessoalmente ou por mensagem, para reservar a vaga.

Um aviso importante: a rematrícula 2027 terá uma condição especial de 1º a 30 de novembro. Por isso, em outubro não há nada para pagar. Vamos apenas reservar a vaga e deixar tudo pronto para vocês aproveitarem a condição em novembro.

Qualquer dúvida, é só falar com a gente. Obrigado por fazer parte da história do CEV!`
}

function telefone(bruto: string | null): string | null {
  const d = (bruto ?? '').replace(/\D/g, '')
  if (d.length === 10 || d.length === 11) return '55' + d
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ erro: 'metodo' }, 405)

  const auth = req.headers.get('Authorization') ?? ''
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  })

  const { data: ehAdmin } = await db.rpc('current_pessoa_is_admin')
  if (ehAdmin !== true) return json({ erro: 'sem_permissao' }, 403)

  let pedido: { familia_id?: string; forcar?: boolean; simular?: boolean }
  try {
    pedido = await req.json()
  } catch {
    return json({ erro: 'pedido_invalido' }, 400)
  }
  if (!pedido.familia_id) return json({ erro: 'pedido_invalido' }, 400)

  const { data: fam } = await db
    .from('rematricula_familias')
    .select('id, responsavel_id, contatado_em, responsavel:pessoas!responsavel_id(nome_completo, telefone_principal)')
    .eq('id', pedido.familia_id)
    .maybeSingle()
  if (!fam) return json({ erro: 'familia_nao_encontrada' }, 404)

  const resp = fam.responsavel as unknown as { nome_completo: string; telefone_principal: string | null } | null
  const numero = telefone(resp?.telefone_principal ?? null)
  if (!resp || !numero) return json({ erro: 'telefone_invalido' }, 422)

  const { data: lig } = await db
    .from('responsaveis_alunos')
    .select('alunos(pessoa:pessoas(nome_completo), matriculas(status, turma:turmas(ano:anos_letivos(ano))))')
    .eq('responsavel_id', fam.responsavel_id)
    .eq('responsavel_financeiro', true)
  type Lig = {
    alunos: {
      pessoa: { nome_completo: string } | null
      matriculas: { status: string; turma: { ano: { ano: number } | null } | null }[]
    } | null
  }
  const alunos = ((lig ?? []) as unknown as Lig[])
    .filter((l) => l.alunos?.matriculas.some((m) => m.status === 'Ativo' && m.turma?.ano?.ano === 2026))
    .map((l) => primeiroNome(l.alunos?.pessoa?.nome_completo ?? ''))
    .filter(Boolean)
  if (alunos.length === 0) return json({ erro: 'sem_aluno' }, 422)

  const texto = comunicado(primeiroNome(resp.nome_completo), alunos)

  // Simulação: devolve só o tamanho e se sobrou algum [colchete]; não envia nada.
  if (pedido.simular) {
    return json({ simulado: true, caracteres: texto.length, sobrou_colchete: /[\[\]{}]/.test(texto), alunos: alunos.length })
  }

  if (!pedido.forcar) {
    const { data: antes } = await db
      .from('rematricula_registros')
      .select('criado_em')
      .eq('familia_id', fam.id)
      .eq('resultado', RESULTADO)
      .limit(1)
    if (antes && antes.length > 0) return json({ erro: 'ja_enviado', em: antes[0].criado_em }, 409)
  }

  const url = Deno.env.get('EVOLUTION_URL')?.replace(/\/+$/, '')
  const chave = Deno.env.get('EVOLUTION_API_KEY')
  const instancia = Deno.env.get('EVOLUTION_INSTANCE')
  if (!url || !chave || !instancia) return json({ erro: 'evolution_nao_configurada' }, 500)

  const corpo =
    Deno.env.get('EVOLUTION_VERSION') === '1' ? { number: numero, textMessage: { text: texto } } : { number: numero, text: texto }

  let resposta: Response
  try {
    resposta = await fetch(`${url}/message/sendText/${encodeURIComponent(instancia)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: chave },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    return json({ erro: 'evolution_fora_do_ar' }, 502)
  }
  if (!resposta.ok) return json({ erro: 'evolution_recusou', status: resposta.status }, 502)

  // Mensagem saiu: registra e marca como contatada (sem nome nem telefone em log).
  const { error: e1 } = await db.from('rematricula_registros').insert({
    familia_id: fam.id,
    canal: 'whatsapp',
    resultado: RESULTADO,
    nota: 'Enviado pelo painel (Evolution API)',
  })
  if (!fam.contatado_em) {
    await db.from('rematricula_familias').update({ contatado_em: new Date().toISOString() }).eq('id', fam.id)
  }
  return json({ enviado: true, registrado: !e1 })
})
