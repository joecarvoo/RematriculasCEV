import { useEffect, useMemo, useRef, useState } from 'react'
import { Contagem, contagemPorDia, diasDoGrafico, rotuloDia } from '../analise'
import { Familia, hoje } from '../lib'

const SERIES: { chave: keyof Contagem; cor: string; nome: string; um: string; varios: string }[] = [
  { chave: 'contatadas', cor: 'ciano', nome: 'Contatadas', um: 'contatada', varios: 'contatadas' },
  { chave: 'responderam', cor: 'azul', nome: 'Responderam', um: 'respondeu', varios: 'responderam' },
  { chave: 'reservas', cor: 'indigo', nome: 'Reservas', um: 'reserva', varios: 'reservas' },
  { chave: 'pagas', cor: 'amarelo', nome: 'Pagas', um: 'paga', varios: 'pagas' },
]
const VAZIO: Contagem = { contatadas: 0, responderam: 0, reservas: 0, pagas: 0 }

/** Barras por dia nas cores do anel da logo. Toque num dia para ver os números (ciano e amarelo têm pouco
 *  contraste com o fundo, então os valores sempre aparecem escritos e existe a visão em tabela). */
export default function GraficoDias({ familias }: { familias: Familia[] }) {
  const porDia = useMemo(() => contagemPorDia(familias), [familias])
  const dias = useMemo(() => diasDoGrafico(porDia), [porDia])
  const dia = hoje()
  const ultimoComDado = [...porDia.keys()].sort().pop()
  const [sel, setSel] = useState<string>(porDia.has(dia) ? dia : (ultimoComDado ?? dia))
  const max = Math.max(1, ...[...porDia.values()].flatMap((c) => SERIES.map((s) => c[s.chave])))
  const rolagem = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = rolagem.current?.querySelector<HTMLElement>('[data-foco="1"]')
    if (el && rolagem.current) rolagem.current.scrollLeft = el.offsetLeft - rolagem.current.clientWidth / 2 + el.clientWidth / 2
  }, [])

  const c = porDia.get(sel) ?? VAZIO
  const total = SERIES.reduce((n, s) => n + c[s.chave], 0)

  return (
    <div className="grafico">
      <div className="rolagem" ref={rolagem}>
        <div className="colunas">
          {dias.map((d) => {
            const v = porDia.get(d) ?? VAZIO
            const r = rotuloDia(d)
            return (
              <button
                key={d}
                className={`coluna ${sel === d ? 'sel' : ''} ${d === dia ? 'hoje' : ''}`}
                data-foco={sel === d ? '1' : undefined}
                aria-pressed={sel === d}
                aria-label={`${r.cheio}: ${SERIES.map((s) => `${v[s.chave]} ${v[s.chave] === 1 ? s.um : s.varios}`).join(', ')}`}
                onClick={() => setSel(d)}
              >
                <span className="barras">
                  {SERIES.map((s) => (
                    <i key={s.chave} className={`b ${s.cor}`} style={{ height: v[s.chave] ? `${Math.max(4, (v[s.chave] / max) * 100)}%` : 0 }} />
                  ))}
                </span>
                <span className="dia-num">{r.num}</span>
                <span className="dia-sem">{r.sem}</span>
              </button>
            )
          })}
        </div>
      </div>

      <ul className="legenda-graf">
        {SERIES.map((s) => (
          <li key={s.chave}>
            <i className={`ponto ${s.cor}`} aria-hidden="true" />
            {s.nome}
          </li>
        ))}
      </ul>

      <p className="detalhe-dia" aria-live="polite">
        <b>{rotuloDia(sel).cheio}</b>
        {total === 0 ? (
          <span>Nenhum contato registrado neste dia.</span>
        ) : (
          <span>
            {SERIES.map((s) => (
              <em key={s.chave}>
                <i className={`ponto ${s.cor}`} aria-hidden="true" />
                {c[s.chave]} {c[s.chave] === 1 ? s.um : s.varios}
              </em>
            ))}
          </span>
        )}
      </p>

      <details className="tabela-graf">
        <summary>Ver em tabela</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Dia</th>
              {SERIES.map((s) => (
                <th key={s.chave} scope="col">{s.nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...porDia.keys()].sort().map((d) => (
              <tr key={d}>
                <th scope="row">{rotuloDia(d).curto}</th>
                {SERIES.map((s) => (
                  <td key={s.chave}>{(porDia.get(d) as Contagem)[s.chave]}</td>
                ))}
              </tr>
            ))}
            {porDia.size === 0 && (
              <tr>
                <td colSpan={5}>Nada registrado ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </details>
    </div>
  )
}
