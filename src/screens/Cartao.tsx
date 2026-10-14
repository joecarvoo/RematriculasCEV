import { useState } from 'react'
import { anotar, desfazer, enviarComunicado, marcar, Marco, NOME_MARCO } from '../acoes'
import { Canal, ETAPA_NOME, ETIQUETA_NOME, Familia, dataCurta, etapa, linkWhatsApp } from '../lib'

const BOTOES: { marco: Marco; campo: keyof Familia; rotulo: string }[] = [
  { marco: 'contatado_em', campo: 'contatado_em', rotulo: 'Contatado' },
  { marco: 'respondeu_em', campo: 'respondeu_em', rotulo: 'Respondeu' },
  { marco: 'reserva_confirmada_em', campo: 'reserva_confirmada_em', rotulo: 'Reserva' },
  { marco: 'pago_em', campo: 'pago_em', rotulo: 'Pagou' },
]

function lerCanal(): Canal {
  try {
    return (localStorage.getItem('canal') as Canal) || 'whatsapp'
  } catch {
    return 'whatsapp'
  }
}

export default function Cartao({
  f,
  abrir,
  atualizar,
}: {
  f: Familia
  abrir: (id: string) => void
  atualizar: () => Promise<void>
}) {
  const [canal, setCanal] = useState<Canal>(lerCanal)
  const [aberto, setAberto] = useState(false)
  const [nota, setNota] = useState('')
  const [proximo, setProximo] = useState(f.proximo_contato ?? '')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const wa = linkWhatsApp(f.responsavel?.telefone_principal)

  async function rodar(fn: () => Promise<void>) {
    setOcupado(true)
    setErro('')
    try {
      await fn()
      await atualizar()
    } catch {
      setErro('Não salvou. Tente de novo.')
    } finally {
      setOcupado(false)
    }
  }

  function tocar(marco: Marco, ativo: boolean) {
    if (ativo) {
      if (!confirm(`Desfazer "${NOME_MARCO[marco]}"? As etapas seguintes também voltam.`)) return
      return rodar(() => desfazer(f, marco, canal))
    }
    return rodar(() => marcar(f, marco, canal))
  }

  const MENSAGEM_ERRO: Record<string, string> = {
    telefone_invalido: 'O telefone dessa família não parece válido.',
    evolution_nao_configurada: 'A Evolution ainda não foi configurada no Supabase.',
    evolution_fora_do_ar: 'A Evolution não respondeu. Veja se a VPS está no ar.',
    evolution_recusou: 'A Evolution recusou o envio. Veja se o WhatsApp está conectado.',
    sem_permissao: 'Esta conta não tem permissão para enviar.',
  }

  async function enviar() {
    const nome = f.responsavel?.nome_completo ?? 'a família'
    // O plano manda conversar antes (pessoalmente) com estas famílias.
    const especial = f.risco === 'vermelha' || f.etiquetas.some((e) => ['remanejado', 'quarto_ano', 'responsavel_legal', 'integral'].includes(e))
    const aviso = especial ? `\n\nATENÇÃO: o plano diz para conversar com esta família antes de mandar mensagem (risco vermelho ou situação especial). Enviar mesmo assim?` : ''
    if (!confirm(`Enviar o comunicado geral agora para ${nome}?${aviso}`)) return
    setOcupado(true)
    setErro('')
    try {
      let r = await enviarComunicado(f.id)
      if (r === 'ja_enviado') {
        if (!confirm('O comunicado já foi enviado para essa família. Enviar de novo?')) return
        r = await enviarComunicado(f.id, true)
      }
      await atualizar()
    } catch (e) {
      setErro(MENSAGEM_ERRO[(e as Error).message] ?? 'Não consegui enviar. Nada foi marcado.')
    } finally {
      setOcupado(false)
    }
  }

  function mudarCanal(c: Canal) {
    setCanal(c)
    try {
      localStorage.setItem('canal', c)
    } catch {
      /* sem armazenamento: segue com o padrão */
    }
  }

  return (
    <article className={`cartao risco-${f.risco}`}>
      <div className="linha">
        <button className="nome" onClick={() => abrir(f.id)}>
          {f.responsavel?.nome_completo ?? 'Sem nome'}
        </button>
        <span className={`selo etapa-${etapa(f)}`}>{ETAPA_NOME[etapa(f)]}</span>
      </div>
      <p className="alunos">
        {f.alunos.map((a) => `${a.nome.split(' ')[0]} (${a.turma})`).join(' · ') || 'Sem aluno ativo em 2026'}
      </p>
      <p className="meta">
        Turno 2027: <b>{f.turno2027 ?? 'não informou'}</b>
        {f.proximo_contato && <> · Próximo contato: <b>{dataCurta(f.proximo_contato)}</b></>}
      </p>
      {f.etiquetas.length > 0 && (
        <p className="etiquetas">
          {f.etiquetas.map((e) => (
            <span key={e} className="tag">
              {ETIQUETA_NOME[e] ?? e}
            </span>
          ))}
        </p>
      )}
      {f.respostas > 0 && (
        <p className="resposta">
          💬 {f.respostas === 1 ? 'Respondeu' : `${f.respostas} respostas`} no WhatsApp{!f.respondeu_em && ' · marque "Respondeu" se for resposta de verdade'}
        </p>
      )}
      {f.observacao && <p className="obs">“{f.observacao}”</p>}

      <button className="enviar" disabled={ocupado} onClick={enviar}>
        {f.comunicadoEm ? `✓ Comunicado enviado em ${dataCurta(f.comunicadoEm)} · reenviar` : 'Enviar comunicado pelo WhatsApp'}
      </button>
      {wa && (
        <a className="whats" href={wa} target="_blank" rel="noopener noreferrer">
          Abrir WhatsApp
        </a>
      )}

      <div className="botoes">
        {BOTOES.map((b) => {
          const ativo = Boolean(f[b.campo])
          return (
            <button key={b.marco} className={ativo ? 'feito' : ''} disabled={ocupado} onClick={() => tocar(b.marco, ativo)}>
              {ativo ? '✓ ' : ''}
              {b.rotulo}
            </button>
          )
        })}
      </div>

      <div className="canal">
        Canal:
        {(['whatsapp', 'presencial', 'ligacao'] as Canal[]).map((c) => (
          <button key={c} className={canal === c ? 'sel' : ''} onClick={() => mudarCanal(c)}>
            {{ whatsapp: 'WhatsApp', presencial: 'Presencial', ligacao: 'Ligação' }[c]}
          </button>
        ))}
      </div>

      <button className="link" onClick={() => setAberto(!aberto)}>
        {aberto ? 'Fechar anotação' : 'Anotar e agendar retorno'}
      </button>
      {aberto && (
        <div className="anotar">
          <textarea placeholder="O que ela disse?" value={nota} onChange={(e) => setNota(e.target.value)} rows={3} />
          <label>
            Próximo contato
            <input type="date" value={proximo} onChange={(e) => setProximo(e.target.value)} />
          </label>
          <button
            className="primario"
            disabled={ocupado || (!nota.trim() && proximo === (f.proximo_contato ?? ''))}
            onClick={() =>
              rodar(async () => {
                await anotar(f, canal, nota.trim(), proximo || null)
                setNota('')
                setAberto(false)
              })
            }
          >
            Salvar anotação
          </button>
        </div>
      )}
      {erro && <p className="aviso">{erro}</p>}
    </article>
  )
}
