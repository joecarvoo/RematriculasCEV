import { useMemo, useState } from 'react'
import { buscar, resumoEtapa } from '../busca'
import { Familia } from '../lib'
import { Icone } from '../ui'

export default function Busca({ familias, abrir }: { familias: Familia[]; abrir: (id: string) => void }) {
  const [q, setQ] = useState('')
  const achados = useMemo(() => buscar(familias, q), [familias, q])
  const digitou = q.trim().length > 0
  const pronto = q.replace(/\s/g, '').length >= 3

  return (
    <div className="busca-geral">
      <label className="busca-campo">
        <Icone nome="busca" tamanho={20} />
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Buscar aluno ou responsável"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar aluno ou responsável"
        />
      </label>
      {digitou && (
        <div className="resultados">
          {!pronto && <p className="meta">Digite pelo menos 3 letras.</p>}
          {pronto && achados.length === 0 && <p className="meta">Ninguém encontrado. Confira a escrita.</p>}
          {achados.slice(0, 10).map(({ familia: f, porAluno }) => (
            <button
              key={f.id}
              className="achado"
              onClick={() => {
                setQ('')
                abrir(f.id)
              }}
            >
              <i className={`ponto-risco r-${f.risco}`} aria-hidden="true" />
              <span>
                <b>{f.responsavel?.nome_completo}</b>
                <small>
                  {f.alunos.map((a) => `${a.nome.split(' ')[0]} (${a.turma})`).join(' · ')} · {resumoEtapa(f)}
                  {porAluno && ` · achou pelo aluno ${porAluno.split(' ')[0]}`}
                </small>
              </span>
            </button>
          ))}
          {achados.length > 10 && <p className="meta">Mais {achados.length - 10}. Digite mais letras para afinar.</p>}
        </div>
      )}
    </div>
  )
}
