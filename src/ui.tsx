import { ReactNode } from 'react'

/* Peças do design system Vencedores (kit/componentes.js), portadas para o app. */

const ICONES: Record<string, string[]> = {
  seta: ['M5 12h14', 'M13 6l6 6-6 6'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  livro: ['M3 5.5c3-1.5 6-1.5 9 .5 3-2 6-2 9-.5v13c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z', 'M12 6v13'],
  relogio: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M12 7v5l3 2'],
  casa: ['M4 11l8-7 8 7', 'M6 9.5V20h12V9.5'],
  conversa: ['M4 5h16v11H9l-5 4z'],
  estrela: ['M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z'],
  busca: ['M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z', 'M16.5 16.5L21 21'],
  fechar: ['M6 6l12 12', 'M18 6L6 18'],
  mais: ['M12 5v14', 'M5 12h14'],
  voltar: ['M19 12H5', 'M11 6l-6 6 6 6'],
  sair: ['M10 4H5v16h5', 'M15 8l4 4-4 4', 'M19 12H9'],
}

export function Icone({ nome, tamanho = 20, traco = 2.4 }: { nome: string; tamanho?: number; traco?: number }) {
  const d = ICONES[nome] ?? ICONES.estrela
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={traco} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  )
}

/** Anel da logo: donut em 4 segmentos (ciano, azul, índigo, amarelo). */
export function Anel({ tamanho = 64, children }: { tamanho?: number; children?: ReactNode }) {
  const segs = ['ciano', 'azul', 'indigo', 'amarelo']
  const w = Math.round(tamanho * 0.2)
  const r = (tamanho - w) / 2
  const C = 2 * Math.PI * r
  const len = C / segs.length
  const gap = Math.min(w * 0.45, len * 0.12)
  return (
    <div className="anel" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden="true">
        <g transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}>
          {segs.map((cor, i) => (
            <circle key={cor} cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={`var(--${cor})`} strokeWidth={w} strokeDasharray={`${len - gap} ${C - len + gap}`} strokeDashoffset={-(i * len + gap / 2)} />
          ))}
        </g>
      </svg>
      {children != null && <div className="anel-centro">{children}</div>}
    </div>
  )
}

export type ArcoDado = { cor: 'ciano' | 'azul' | 'indigo' | 'amarelo'; valor: number; total: number; nome: string }

/** O anel como gráfico: cada quarto é uma etapa e enche conforme as famílias avançam. */
export function AnelProgresso({ tamanho = 232, arcos, children }: { tamanho?: number; arcos: ArcoDado[]; children?: ReactNode }) {
  const w = Math.round(tamanho * 0.14)
  const r = (tamanho - w) / 2
  const C = 2 * Math.PI * r
  const quarto = C / 4
  const gap = w * 0.5
  const resumo = arcos.map((a) => `${a.nome}: ${a.valor} de ${a.total}`).join('; ')
  return (
    <div className="anel" style={{ width: tamanho, height: tamanho }} role="img" aria-label={resumo}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden="true">
        <g transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}>
          {arcos.map((a, i) => {
            const base = i * quarto + gap / 2
            const cheio = quarto - gap
            const f = a.total ? Math.min(1, a.valor / a.total) : 0
            return (
              <g key={a.nome}>
                <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="var(--azul-gelo)" strokeWidth={w} strokeLinecap="round" strokeDasharray={`${cheio} ${C - cheio}`} strokeDashoffset={-base} />
                {f > 0 && (
                  <circle className="arco" cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={`var(--${a.cor})`} strokeWidth={w} strokeLinecap="round" strokeDasharray={`${Math.max(cheio * f, 0.01)} ${C}`} strokeDashoffset={-base} style={{ ['--cheio' as string]: cheio * f }} />
                )}
              </g>
            )
          })}
        </g>
      </svg>
      {children != null && <div className="anel-centro">{children}</div>}
    </div>
  )
}

/** Forma orgânica do canto: só decorativa, nunca atrás de texto pequeno. */
export function Forma({ className = '' }: { className?: string }) {
  return (
    <svg className={`forma ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M14 0C4 14 12 30 30 37C48 44 44 62 58 75C72 88 90 86 100 70V0Z" fill="var(--ciano-claro)" />
    </svg>
  )
}

export function PilulaLogo({ texto }: { texto: string }) {
  return (
    <span className="pilula-logo">
      <img src="/cev-logo.png" alt="" width={32} height={32} />
      <b>{texto}</b>
    </span>
  )
}
