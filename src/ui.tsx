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

/** Anel oficial Vencedores: segmentos ciano 45%, azul 25%, índigo 20% e amarelo 10%.
 *  Com `numero`, vira contador sobre disco branco. Não reordenar os segmentos. */
const SEGMENTOS: [string, number][] = [['ciano', 0.45], ['azul', 0.25], ['indigo', 0.2], ['amarelo', 0.1]]

export function Anel({ tamanho = 72, numero }: { tamanho?: number; numero?: number | string }) {
  const comNumero = numero !== undefined && numero !== ''
  const r = comNumero ? tamanho * 0.37 : tamanho * 0.4
  const sw = comNumero ? tamanho * 0.18 : tamanho * 0.2
  const c = tamanho / 2
  const C = 2 * Math.PI * r
  let off = 0
  return (
    <div className="anel" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden="true">
        {comNumero && <circle cx={c} cy={c} r={c} fill="var(--superficie)" />}
        <g transform={`translate(${c} ${c}) rotate(-90)`} strokeWidth={sw}>
          {SEGMENTOS.map(([cor, f]) => {
            const len = C * f
            const el = <circle key={cor} r={r} fill="none" stroke={`var(--${cor})`} strokeDasharray={`${len.toFixed(1)} ${C.toFixed(1)}`} strokeDashoffset={(-off).toFixed(1)} />
            off += len
            return el
          })}
        </g>
      </svg>
      {comNumero && (
        <span className="anel-num" style={{ fontSize: tamanho * 0.42 }}>
          {numero}
        </span>
      )}
    </div>
  )
}

/** Estatística oficial: anel de progresso que enche até `valor`%, ponto amarelo na ponta. */
export function Estatistica({ numero, valor, legenda, tamanho = 220 }: { numero: string; valor: number; legenda?: string; tamanho?: number }) {
  const sw = tamanho * 0.09
  const r = (tamanho - sw) / 2
  const c = tamanho / 2
  const C = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, valor)) / 100
  const ang = v * 2 * Math.PI - Math.PI / 2
  return (
    <div className="est">
      <div className="est-anel" style={{ width: tamanho, height: tamanho }} role="img" aria-label={legenda ? `${numero} ${legenda}` : numero}>
        <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden="true">
          <circle cx={c} cy={c} r={r} fill="none" strokeWidth={sw} stroke="var(--ponto-inativo)" />
          {v > 0 && (
            <>
              <circle className="est-arco" cx={c} cy={c} r={r} fill="none" strokeWidth={sw} strokeLinecap="round" stroke="var(--azul)" strokeDasharray={`${(C * v).toFixed(1)} ${C.toFixed(1)}`} transform={`rotate(-90 ${c} ${c})`} />
              <circle className="est-ponto" cx={c + r * Math.cos(ang)} cy={c + r * Math.sin(ang)} r={sw * 0.8} fill="var(--amarelo)" stroke="var(--fundo)" strokeWidth={Math.max(2, tamanho * 0.012)} />
            </>
          )}
        </svg>
        <div className="est-num" style={{ fontSize: tamanho * 0.29 }}>{numero}</div>
      </div>
      {legenda && <p className="est-leg">{legenda}</p>}
    </div>
  )
}

/** Forma do canto: círculo grande ciano-claro (token `forma`), só decorativo, longe de texto pequeno. */
export function Forma({ className = '' }: { className?: string }) {
  return <span className={`forma ${className}`} aria-hidden="true" />
}

export function PilulaLogo({ texto }: { texto: string }) {
  return (
    <span className="pilula-logo">
      <img src="/cev-logo.png" alt="" width={32} height={32} />
      <b>{texto}</b>
    </span>
  )
}
