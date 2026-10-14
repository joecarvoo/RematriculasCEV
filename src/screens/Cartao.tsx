import { useState } from 'react'
import { anotar, desfazer, marcar, Marco, NOME_MARCO } from '../acoes'
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
      {f.observacao && <p className="obs">“{f.observacao}”</p>}

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
