import { salvarRisco } from '../acoes'
import { useState } from 'react'
import { ETAPA_NOME, Familia, Risco, etapa, ordenar } from '../lib'
import { Anel, Icone } from '../ui'

const RISCOS: { r: Risco; nome: string }[] = [
  { r: 'verde', nome: 'verde' },
  { r: 'amarela', nome: 'amarelo' },
  { r: 'vermelha', nome: 'vermelho' },
]

export default function Todas({
  familias,
  abrir,
  atualizar,
}: {
  familias: Familia[]
  abrir: (id: string) => void
  atualizar: () => Promise<void>
}) {
  const [erro, setErro] = useState('')
  const lista = [...familias].sort(ordenar)

  async function mudar(f: Familia, r: Risco) {
    if (f.risco === r) return
    setErro('')
    try {
      await salvarRisco(f.id, r)
      await atualizar()
    } catch {
      setErro('Não salvou o risco. Tente de novo.')
    }
  }

  return (
    <section>
      <header className="cab">
        <Anel tamanho={72} numero={familias.length} />
        <div>
          <h2>Todas</h2>
          <p>Toque na bolinha para classificar o risco</p>
        </div>
      </header>
      {erro && <p className="aviso" role="alert">{erro}</p>}
      <ul className="lista">
        {lista.map((f) => (
          <li key={f.id} className="linha-todas">
            <button className="nome" onClick={() => abrir(f.id)}>
              {f.responsavel?.nome_completo}
              <small>
                {f.alunos.map((a) => a.turma).join(' · ')} · {ETAPA_NOME[etapa(f)]}
              </small>
            </button>
            <div className="riscos" role="group" aria-label={`Risco de ${f.responsavel?.nome_completo}`}>
              {RISCOS.map(({ r, nome }) => (
                <button key={r} className={`r-${r} ${f.risco === r ? 'sel' : ''}`} aria-label={`Risco ${nome}`} aria-pressed={f.risco === r} onClick={() => mudar(f, r)}>
                  {f.risco === r && <Icone nome="check" tamanho={16} traco={3.2} />}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
