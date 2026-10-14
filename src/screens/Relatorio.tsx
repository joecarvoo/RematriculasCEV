import { useMemo, useState } from 'react'
import { Contagem, FIM_CAMPANHA, INICIO_CAMPANHA, SEMANA, contagemPorDia, diaDe, diasEntre, hesitacoes, rotuloDia } from '../analise'
import { Familia, Registro, hoje } from '../lib'
import { Anel, Icone } from '../ui'

type Periodo = 'semana' | 'tudo'
const soma = (a: Contagem, b: Contagem): Contagem => ({ contatadas: a.contatadas + b.contatadas, responderam: a.responderam + b.responderam, reservas: a.reservas + b.reservas, pagas: a.pagas + b.pagas })
const VAZIO: Contagem = { contatadas: 0, responderam: 0, reservas: 0, pagas: 0 }

export default function Relatorio({ familias, registros, abrir }: { familias: Familia[]; registros: Registro[]; abrir: (id: string) => void }) {
  // Antes de 19/10 a semana ainda está vazia: abre em "Tudo até hoje" para o relatório mostrar alguma coisa.
  const [periodo, setPeriodo] = useState<Periodo>(hoje() >= SEMANA.inicio ? 'semana' : 'tudo')
  const [aberto, setAberto] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const ini = periodo === 'semana' ? SEMANA.inicio : '0000-00-00'
  const fim = periodo === 'semana' ? SEMANA.fim : '9999-99-99'
  const dentro = (iso: string | null) => {
    const d = diaDe(iso)
    return d !== null && d >= ini && d <= fim
  }

  const porDia = useMemo(() => contagemPorDia(familias), [familias])
  const dias = periodo === 'semana' ? diasEntre(SEMANA.inicio, SEMANA.fim) : [...porDia.keys()].sort().filter((d) => d >= INICIO_CAMPANHA.slice(0, 4) && d <= FIM_CAMPANHA)
  const totais = dias.reduce((t, d) => soma(t, porDia.get(d) ?? VAZIO), VAZIO)

  // Por turma: cada família conta na turma de cada filho (uma família com dois filhos em turmas diferentes aparece nas duas).
  const porTurma = useMemo(() => {
    const m = new Map<string, { familias: number; c: Contagem; semResposta: number }>()
    for (const f of familias)
      for (const turma of new Set(f.alunos.map((a) => a.turma))) {
        const t = m.get(turma) ?? { familias: 0, c: { ...VAZIO }, semResposta: 0 }
        t.familias++
        if (dentro(f.contatado_em)) t.c.contatadas++
        if (dentro(f.respondeu_em)) t.c.responderam++
        if (dentro(f.reserva_confirmada_em)) t.c.reservas++
        if (f.contatado_em && !f.respondeu_em) t.semResposta++
        m.set(turma, t)
      }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR', { numeric: true }))
  }, [familias, periodo])

  const motivos = useMemo(() => hesitacoes(familias, registros, (iso) => dentro(iso)), [familias, registros, periodo])
  const semResposta = familias
    .filter((f) => f.contatado_em && !f.respondeu_em)
    .map((f) => ({ f, dias: Math.floor((Date.now() - new Date(f.contatado_em as string).getTime()) / 86400000) }))
    .sort((a, b) => b.dias - a.dias)

  const rotuloPeriodo = periodo === 'semana' ? 'de 19 a 23/10' : 'até hoje'

  async function copiar() {
    const linhas = [
      `Rematrícula 2027 · ${rotuloPeriodo}`,
      `Contatadas: ${totais.contatadas} de ${familias.length} · Responderam: ${totais.responderam} · Reservas: ${totais.reservas}`,
      ...dias.map((d) => `${rotuloDia(d).cheio}: ${(porDia.get(d) ?? VAZIO).contatadas} contatadas, ${(porDia.get(d) ?? VAZIO).responderam} responderam, ${(porDia.get(d) ?? VAZIO).reservas} reservas`),
      `Sem resposta: ${semResposta.length}`,
      ...(motivos.length ? ['Hesitações: ' + motivos.map((m) => `${m.nome} (${m.notas.length})`).join(', ')] : []),
    ]
    try {
      await navigator.clipboard.writeText(linhas.join('\n'))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      window.prompt('Copie o resumo:', linhas.join('\n'))
    }
  }

  return (
    <section>
      <header className="cab">
        <Anel tamanho={72} numero={totais.contatadas} />
        <div>
          <h2>Relatório</h2>
          <p>famílias contatadas {rotuloPeriodo}</p>
        </div>
      </header>

      <div className="chips periodo" role="group" aria-label="Período">
        <button className={`chip ${periodo === 'semana' ? 'sel' : ''}`} aria-pressed={periodo === 'semana'} onClick={() => setPeriodo('semana')}>19 a 23/10</button>
        <button className={`chip ${periodo === 'tudo' ? 'sel' : ''}`} aria-pressed={periodo === 'tudo'} onClick={() => setPeriodo('tudo')}>Tudo até hoje</button>
        <button className="chip copiar" onClick={copiar}>
          <Icone nome={copiado ? 'check' : 'copiar'} tamanho={16} /> {copiado ? 'Copiado' : 'Copiar resumo'}
        </button>
      </div>

      <h3>Por dia</h3>
      <table className="tabela">
        <thead>
          <tr>
            <th scope="col">Dia</th>
            <th scope="col">Contatadas</th>
            <th scope="col">Responderam</th>
            <th scope="col">Reservas</th>
          </tr>
        </thead>
        <tbody>
          {dias.map((d) => {
            const c = porDia.get(d) ?? VAZIO
            return (
              <tr key={d}>
                <th scope="row">{rotuloDia(d).cheio}</th>
                <td>{c.contatadas}</td>
                <td>{c.responderam}</td>
                <td>{c.reservas}</td>
              </tr>
            )
          })}
          {dias.length === 0 && (
            <tr>
              <td colSpan={4}>Nada registrado ainda.</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>{totais.contatadas}</td>
            <td>{totais.responderam}</td>
            <td>{totais.reservas}</td>
          </tr>
        </tfoot>
      </table>
      {periodo === 'semana' && <p className="meta">Meta de sexta 23/10: {familias.length} contatadas e pelo menos 38 com resposta.</p>}

      <h3>Por turma</h3>
      <ul className="turmas">
        {porTurma.map(([turma, t]) => (
          <li key={turma}>
            <b>{turma}</b>
            <span>
              <em>{t.familias} {t.familias === 1 ? 'família' : 'famílias'}</em>
              <em>{t.c.contatadas} {t.c.contatadas === 1 ? 'contatada' : 'contatadas'}</em>
              <em>{t.c.responderam} {t.c.responderam === 1 ? 'respondeu' : 'responderam'}</em>
              <em>{t.c.reservas} {t.c.reservas === 1 ? 'reserva' : 'reservas'}</em>
            </span>
          </li>
        ))}
      </ul>
      <p className="meta">Família com filhos em turmas diferentes aparece em cada uma.</p>

      <h3>Motivos de hesitação</h3>
      {motivos.length === 0 ? (
        <p className="vazio">
          <b>Nenhuma anotação ainda.</b>
          Use “Anotar e agendar retorno” no cartão da família: as palavras da anotação viram os motivos aqui.
        </p>
      ) : (
        <ul className="motivos">
          {motivos.map((m) => (
            <li key={m.id}>
              <button aria-expanded={aberto === m.id} onClick={() => setAberto(aberto === m.id ? null : m.id)}>
                <span>{m.nome}</span>
                <b>{m.notas.length}</b>
              </button>
              {aberto === m.id && (
                <ul className="notas">
                  {m.notas.map((n, i) => (
                    <li key={i}>
                      <button className="nome" onClick={() => abrir(n.familia.id)}>{n.familia.responsavel?.nome_completo}</button>
                      <p>{n.texto}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <h3>
        Sem resposta <span className="contagem">{semResposta.length}</span>
      </h3>
      {semResposta.length === 0 ? (
        <p className="vazio">
          <b>Ninguém sem resposta.</b>
          Todas as famílias contatadas já responderam.
        </p>
      ) : (
        <ul className="lista">
          {semResposta.map(({ f, dias: n }) => (
            <li key={f.id} className="linha-todas">
              <button className="nome" onClick={() => abrir(f.id)}>
                {f.responsavel?.nome_completo}
                <small>{n === 0 ? 'contatada hoje' : `contatada há ${n} ${n === 1 ? 'dia' : 'dias'}`} · {f.alunos.map((a) => a.turma).join(' · ')}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
