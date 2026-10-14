// Recebe os avisos da Evolution API (messages.update e messages.upsert) e atualiza o painel:
// entregue, lida e respostas das famílias. Sem JWT: quem chama é a Evolution, então a
// proteção é um token na URL (?t=...) guardado em rematricula_config (só o servidor lê).
// Só guarda mensagem de quem é família da campanha; o resto é descartado. Nada de nome ou
// telefone em log.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ok = () => new Response('ok', { status: 200 })
const RANK: Record<string, number> = { enviada: 0, entregue: 1, lida: 2 }
const STATUS: Record<string, string> = {
  DELIVERY_ACK: 'entregue',
  DELIVERED: 'entregue',
  READ: 'lida',
  PLAYED: 'lida',
  ERROR: 'falhou',
}

const hoje = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Manaus' }).format(new Date())

// Toque num botão de resposta rápida: devolve o id do botão e o rótulo, em qualquer um dos formatos do WhatsApp.
function botaoDe(msg: Record<string, any> | undefined): { id: string; rotulo: string } | null {
  if (!msg) return null
  const b = msg.buttonsResponseMessage ?? msg.templateButtonReplyMessage ?? msg.listResponseMessage
  if (b) {
    return {
      id: String(b.selectedButtonId ?? b.selectedId ?? b.singleSelectReply?.selectedRowId ?? ''),
      rotulo: String(b.selectedDisplayText ?? b.title ?? ''),
    }
  }
  const nf = msg.interactiveResponseMessage?.nativeFlowResponseMessage
  if (nf?.paramsJson) {
    try {
      const p = JSON.parse(nf.paramsJson)
      return { id: String(p.id ?? ''), rotulo: String(p.display_text ?? msg.interactiveResponseMessage?.body?.text ?? '') }
    } catch {
      return null
    }
  }
  return null
}

const digitos = (s: unknown) => String(s ?? '').replace(/\D/g, '')
const final8 = (s: unknown) => digitos(s).slice(-8)

function textoDe(msg: Record<string, any> | undefined, tipo: string | undefined): string | null {
  if (!msg) return null
  if (tipo === 'reactionMessage' || tipo === 'protocolMessage') return null
  const t = msg.conversation ?? msg.extendedTextMessage?.text ?? msg.imageMessage?.caption ?? msg.videoMessage?.caption
  if (t) return String(t)
  return `[${tipo ?? 'mensagem'} sem texto: abra o WhatsApp para ver]`
}

// Cada botão vira uma ação. Responder pelo botão é resposta de verdade: marca "Respondeu".
// Reserva fica com o Joel (ele só confirma depois de conversar).
async function aplicarBotao(db: ReturnType<typeof createClient>, familiaId: string, id: string, rotulo: string) {
  let resultado: string | null = null
  let retornoHoje = false
  if (id === 'manter') resultado = 'Pelo botão: pode manter o turno'
  else if (id === 'mudar') {
    resultado = 'Pelo botão: quer mudar o turno'
    retornoHoje = true
  } else if (id === 'conversar') {
    resultado = 'Pelo botão: prefere conversar com a equipe'
    retornoHoje = true
  } else if (id.startsWith('turno_')) resultado = `Pelo botão: escolheu o turno ${id.slice(6)}`
  if (!resultado) return

  const agora = new Date().toISOString()
  const { data: fam } = await db.from('rematricula_familias').select('contatado_em, respondeu_em').eq('id', familiaId).maybeSingle()
  const patch: Record<string, string | null> = {}
  if (fam && !fam.contatado_em) patch.contatado_em = agora
  if (fam && !fam.respondeu_em) patch.respondeu_em = agora
  if (retornoHoje) patch.proximo_contato = hoje()
  if (Object.keys(patch).length) await db.from('rematricula_familias').update(patch).eq('id', familiaId)
  await db.from('rematricula_registros').insert({
    familia_id: familiaId,
    canal: 'whatsapp',
    resultado,
    nota: `Botão tocado: ${rotulo}`,
    proximo_contato: retornoHoje ? hoje() : null,
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('metodo', { status: 405 })

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const token = new URL(req.url).searchParams.get('t') ?? ''
  const { data: cfg } = await db.from('rematricula_config').select('valor').eq('chave', 'webhook_token').maybeSingle()
  if (!cfg || !token || token !== cfg.valor) return new Response('nao autorizado', { status: 401 })

  let corpo: any
  try {
    corpo = await req.json()
  } catch {
    return ok()
  }
  const evento = String(corpo?.event ?? '').toLowerCase().replace(/_/g, '.')
  const itens: any[] = Array.isArray(corpo?.data) ? corpo.data : corpo?.data ? [corpo.data] : []

  try {
    if (evento === 'messages.update') {
      for (const d of itens) {
        const id = d.keyId ?? d.key?.id ?? d.messageId
        const novo = STATUS[String(d.status ?? d.update?.status ?? '').toUpperCase()]
        if (!id || !novo) continue
        const { data: atual } = await db.from('rematricula_mensagens').select('status').eq('evolution_id', id).maybeSingle()
        if (!atual) continue
        if (novo !== 'falhou' && (RANK[novo] ?? 0) <= (RANK[atual.status] ?? 0)) continue
        await db.from('rematricula_mensagens').update({ status: novo, atualizado_em: new Date().toISOString() }).eq('evolution_id', id)
      }
    } else if (evento === 'messages.upsert') {
      const { data: familias } = await db
        .from('rematricula_familias')
        .select('id, responsavel:pessoas!responsavel_id(telefone_principal)')
      const porFinal = new Map<string, string>()
      for (const f of familias ?? []) {
        const tel = (f.responsavel as unknown as { telefone_principal: string | null } | null)?.telefone_principal
        if (tel) porFinal.set(final8(tel), f.id)
      }
      for (const d of itens) {
        const k = d.key ?? {}
        if (k.fromMe) continue
        const jids = [k.senderPn, k.remoteJidAlt, d.senderPn, k.remoteJid].filter(
          (j) => typeof j === 'string' && j.endsWith('@s.whatsapp.net'),
        ) as string[]
        const familiaId = jids.map((j) => porFinal.get(final8(j))).find(Boolean)
        const botao = botaoDe(d.message)
        const texto = botao ? botao.rotulo || botao.id : textoDe(d.message, d.messageType)
        if (!familiaId || !texto || !k.id) continue
        const quando = Number(d.messageTimestamp)
        const { data: nova } = await db
          .from('rematricula_mensagens')
          .upsert(
            {
              familia_id: familiaId,
              direcao: 'recebida',
              tipo: botao ? 'botao' : null,
              texto,
              evolution_id: k.id,
              status: 'recebida',
              criado_em: quando > 0 ? new Date(quando * 1000).toISOString() : new Date().toISOString(),
            },
            { onConflict: 'evolution_id', ignoreDuplicates: true },
          )
          .select('id')
        // Só age uma vez por mensagem (o aviso pode chegar repetido).
        if (botao && nova && nova.length > 0) await aplicarBotao(db, familiaId, botao.id, texto)
      }
    }
  } catch {
    // A Evolution só precisa de um 200; o erro não leva dados para o log.
  }
  return ok()
})
