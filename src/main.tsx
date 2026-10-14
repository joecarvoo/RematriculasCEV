import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './tokens.css'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// App instalável e abrindo sem internet: o service worker só vale no site publicado.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
