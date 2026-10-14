import { useEffect, useState } from 'react'
import { carregarMensagens, carregarRegistros } from '../data'
import { salvarEtiquetas, salvarRisco } from '../acoes'
import { ETAPA_NOME, ETIQUETAS, ETIQUETA_NOME, Familia, Mensagem, Registro, Risco, STATUS_MENSAGEM, dataCurta, etapa, linkWhatsApp } from '../lib'
import Cartao from './Cartao'

export default function FamiliaTela({
  familia,
  voltar,
  atualizar,
}: {
  familia: Familia
  voltar: () => void
  atualizar: () => Promise<void>
}) {
  const [registros, setRegistros] = useState<Registro[] | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[] | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregarRegistros(familia.id)
      .then(setRegistros)
      .catch(() => setErro('Não consegui carregar o histórico.'))
  }, [familia])

  // Entregue, lida e respostas chegam sozinhas pelo aviso da Evolution: recarrega a cada 15 s.
  useEffect(() => {
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
  }, [familia.id, familia.comunicadoEm])

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
      <header className="topo">
        <button className="link" onClick={voltar}>← Voltar</button>
        <h1>Família</h1>
      </header>
      <main>
        <Cartao f={familia} abrir={() => {}} atualizar={atualizar} />

        <h3>Risco</h3>
        <div className="chips">
          {(['verde', 'amarela', 'vermelha'] as Risco[]).map((r) => (
            <button key={r} className={`chip r-${r} ${familia.risco === r ? 'sel' : ''}`} onClick={() => salvar(() => salvarRisco(familia.id, r))}>
              {r}
            </button>
          ))}
        </div>

        <h3>Etiquetas</h3>
        <div className="chips">
          {ETIQUETAS.map((t) => (
            <button key={t} className={`chip ${familia.etiquetas.includes(t) ? 'sel' : ''}`} onClick={() => alternar(t)}>
              {ETIQUETA_NOME[t]}
            </button>
          ))}
        </div>

        <h3>Contato</h3>
        <p className="meta">
          {familia.responsavel?.telefone_principal ?? 'Sem telefone'}
          {familia.responsavel?.email && <> · {familia.responsavel.email}</>}
          {linkWhatsApp(familia.responsavel?.telefone_principal) && ''}
        </p>
        <p className="meta">Situação: <b>{ETAPA_NOME[etapa(familia)]}</b></p>

        <h3>Mensagens</h3>
        {mensagens?.length === 0 && <p className="vazio">Nenhuma mensagem enviada ou recebida pelo painel ainda.</p>}
        <ul className="mensagens">
          {mensagens?.map((m) => (
            <li key={m.id} className={m.direcao}>
              <small>
                {m.direcao === 'enviada' ? 'Enviada por nós' : m.tipo === 'botao' ? 'Resposta pelo botão' : 'Resposta da família'} · {dataCurta(m.criado_em)}
                {m.direcao === 'enviada' && <b className={`st-${m.status}`}> · {STATUS_MENSAGEM[m.status]}</b>}
              </small>
              <details>
                <summary>{m.texto.split('\n').find((l) => l.trim()) ?? ''}</summary>
                <p>{m.texto}</p>
              </details>
            </li>
          ))}
        </ul>

        <h3>Histórico</h3>
        {erro && <p className="aviso">{erro}</p>}
        {registros === null && !erro && <p className="meta">Carregando…</p>}
        {registros?.length === 0 && <p className="vazio">Nenhum contato registrado ainda.</p>}
        <ul className="historico">
          {registros?.map((r) => (
            <li key={r.id}>
              <b>{r.resultado}</b> <small>{dataCurta(r.criado_em)} · {r.canal}</small>
              {r.nota && <p>{r.nota}</p>}
              {r.proximo_contato && <small>Retorno: {dataCurta(r.proximo_contato)}</small>}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
