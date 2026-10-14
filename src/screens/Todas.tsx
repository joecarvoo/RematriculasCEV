import { useState } from 'react'
import { salvarRisco } from '../acoes'
import { ETAPA_NOME, Familia, Risco, etapa, ordenar } from '../lib'

const RISCOS: Risco[] = ['verde', 'amarela', 'vermelha']

export default function Todas({
  familias,
  abrir,
  atualizar,
}: {
  familias: Familia[]
  abrir: (id: string) => void
  atualizar: () => Promise<void>
}) {
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState('')
  const q = busca.trim().toLowerCase()
  const lista = familias
    .filter(
      (f) =>
        !q ||
        (f.responsavel?.nome_completo ?? '').toLowerCase().includes(q) ||
        f.alunos.some((a) => a.nome.toLowerCase().includes(q)),
    )
    .sort(ordenar)

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
      <h2>
        Todas <small>{familias.length} famílias · classifique o risco aqui</small>
      </h2>
      <input className="busca" type="search" placeholder="Buscar responsável ou aluno" value={busca} onChange={(e) => setBusca(e.target.value)} />
      {erro && <p className="aviso">{erro}</p>}
      {lista.map((f) => (
        <div key={f.id} className={`linha-todas risco-${f.risco}`}>
          <button className="nome" onClick={() => abrir(f.id)}>
            {f.responsavel?.nome_completo}
            <small>
              {f.alunos.map((a) => a.turma).join(' · ')} · {ETAPA_NOME[etapa(f)]}
            </small>
          </button>
          <div className="riscos">
            {RISCOS.map((r) => (
              <button key={r} className={`r-${r} ${f.risco === r ? 'sel' : ''}`} aria-label={`Risco ${r}`} onClick={() => mudar(f, r)} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
