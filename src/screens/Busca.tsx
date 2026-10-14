import { useMemo, useState } from 'react'
import { buscar, resumoEtapa } from '../busca'
import { Familia } from '../lib'

export default function Busca({ familias, abrir }: { familias: Familia[]; abrir: (id: string) => void }) {
  const [q, setQ] = useState('')
  const achados = useMemo(() => buscar(familias, q), [familias, q])
  const digitou = q.trim().length > 0
  const pronto = q.replace(/\s/g, '').length >= 3

  return (
    <div className="busca-geral">
      <input
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="Buscar aluno ou responsável (3 letras já acham)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Buscar aluno ou responsável"
      />
      {digitou && (
        <div className="resultados">
          {!pronto && <p className="meta">Digite pelo menos 3 letras.</p>}
          {pronto && achados.length === 0 && <p className="meta">Ninguém encontrado. Confira a escrita.</p>}
          {achados.slice(0, 10).map(({ familia: f, porAluno }) => (
            <button
              key={f.id}
              className={`achado risco-${f.risco}`}
              onClick={() => {
                setQ('')
                abrir(f.id)
              }}
            >
              <b>{f.responsavel?.nome_completo}</b>
              <small>
                {f.alunos.map((a) => `${a.nome.split(' ')[0]} (${a.turma})`).join(' · ')} · {resumoEtapa(f)}
                {porAluno && ` · achou pelo aluno ${porAluno.split(' ')[0]}`}
              </small>
            </button>
          ))}
          {achados.length > 10 && <p className="meta">Mais {achados.length - 10}. Digite mais letras para afinar.</p>}
        </div>
      )}
    </div>
  )
}
