import { useEffect, useState } from 'react'
import { carregarMensagens, carregarRegistros } from '../data'
import { salvarEtiquetas, salvarRisco } from '../acoes'
import { ETAPA_NOME, ETIQUETAS, ETIQUETA_NOME, Familia, Mensagem, Registro, Risco, STATUS_MENSAGEM, dataCurta, etapa } from '../lib'
import { Icone } from '../ui'
import Cartao from './Cartao'

export default function FamiliaTela({
  familia,
  voltar,
  atualizar,
  demo,
}: {
  familia: Familia
  voltar: () => void
  atualizar: () => Promise<void>
  demo?: { mensagens: Mensagem[]; registros: Registro[] }
}) {
  const [registros, setRegistros] = useState<Registro[] | null>(demo?.registros ?? null)
  const [mensagens, setMensagens] = useState<Mensagem[] | null>(demo?.mensagens ?? null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (demo) return
    carregarRegistros(familia.id)
      .then(setRegistros)
      .catch(() => setErro('Não consegui carregar o histórico.'))
  }, [familia, demo])

  // Entregue, lida e respostas chegam sozinhas pelo aviso da Evolution: recarrega a cada 15 s.
  useEffect(() => {
    if (demo) return
    let vivo = true
    const buscar = () =>
      carregarMensagens(familia.id)
        .then((m) => vivo && setMensagens(m))
        .catch(() => undefined)
    buscar()
    const t = setInterval(buscar, 15000)
    return () => {
      vivo = false
      clearInterval(t)
    }
  }, [familia.id, familia.comunicadoEm, demo])

  async function salvar(fn: () => Promise<void>) {
    setErro('')
    try {
      await fn()
      await atualizar()
    } catch {
      setErro('Não salvou. Tente de novo.')
    }
  }

  function alternar(tag: string) {
    const novas = familia.etiquetas.includes(tag) ? familia.etiquetas.filter((t) => t !== tag) : [...familia.etiquetas, tag]
    return salvar(() => salvarEtiquetas(familia.id, novas))
  }

  return (
    <div className="app">
      <header className="topo-simples">
        <button className="voltar" onClick={voltar}>
          <Icone nome="voltar" tamanho={18} /> Voltar
        </button>
      </header>
      <main className="familia">
        <div className="fam-a">
        <Cartao f={familia} abrir={() => {}} atualizar={atualizar} />

        <h3>Risco</h3>
        <div className="chips">
          {(['verde', 'amarela', 'vermelha'] as Risco[]).map((r) => (
            <button key={r} className={`chip risco-chip r-${r} ${familia.risco === r ? 'sel' : ''}`} aria-pressed={familia.risco === r} onClick={() => salvar(() => salvarRisco(familia.id, r))}>
              <i aria-hidden="true" />
              {{ verde: 'Verde', amarela: 'Amarelo', vermelha: 'Vermelho' }[r]}
            </button>
          ))}
        </div>

        <h3>Etiquetas</h3>
        <div className="chips">
          {ETIQUETAS.map((t) => (
            <button key={t} className={`chip ${familia.etiquetas.includes(t) ? 'sel' : ''}`} aria-pressed={familia.etiquetas.includes(t)} onClick={() => alternar(t)}>
              {ETIQUETA_NOME[t]}
            </button>
          ))}
        </div>

        <h3>Contato</h3>
        <p className="contato">
          {familia.responsavel?.telefone_principal ?? 'Sem telefone'}
          {familia.responsavel?.email && <span>{familia.responsavel.email}</span>}
          <small>Situação: <b>{ETAPA_NOME[etapa(familia)]}</b></small>
        </p>

        </div>

        <div className="fam-b">
        <h3>Mensagens</h3>
        {mensagens?.length === 0 && <p className="vazio"><b>Nada trocado ainda.</b>As mensagens enviadas pelo painel e as respostas aparecem aqui.</p>}
        <ul className="conversa">
          {[...(mensagens ?? [])].reverse().map((m) => {
            const longa = m.texto.length > 90 || m.texto.includes('\n')
            return (
              <li key={m.id} className={m.direcao}>
                <div className="balao">
                  {longa ? (
                    <details>
                      <summary>
                        <span className="previa">{m.texto.split('\n').find((l) => l.trim()) ?? ''}</span>
                        <span className="ver">Ver mensagem completa</span>
                      </summary>
                      <p>{m.texto}</p>
                    </details>
                  ) : (
                    m.texto
                  )}
                </div>
                <small>
                  {m.direcao === 'recebida' && (m.tipo === 'botao' ? 'Resposta pelo botão · ' : 'Resposta da família · ')}
                  {dataCurta(m.criado_em)}
                  {m.direcao === 'enviada' && <b className={`st-${m.status}`}> · {STATUS_MENSAGEM[m.status]}</b>}
                </small>
              </li>
            )
          })}
        </ul>

        <h3>Histórico</h3>
        {erro && <p className="aviso" role="alert">{erro}</p>}
        {registros === null && !erro && <p className="meta">Carregando…</p>}
        {registros?.length === 0 && <p className="vazio"><b>Nenhum contato registrado.</b>Cada toque nos botões de etapa entra aqui.</p>}
        <ol className="historico">
          {registros?.map((r) => (
            <li key={r.id}>
              <b>{r.resultado}</b>
              <small>{dataCurta(r.criado_em)} · {r.canal}</small>
              {r.nota && <p>{r.nota}</p>}
              {r.proximo_contato && <small>Retorno {dataCurta(r.proximo_contato)}</small>}
            </li>
          ))}
        </ol>
        </div>
      </main>
    </div>
  )
}
