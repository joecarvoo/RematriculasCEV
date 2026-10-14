/* Service worker do painel de rematrícula.
   Faz duas coisas: deixa o app abrir sem internet (só a casca: páginas, imagens, fontes) e o torna instalável.
   NUNCA guarda dados: nada de Supabase, nada de família, telefone ou mensagem passa pelo cache. */
const VERSAO = 'rematricula-v1'
const CASCA = ['/', '/manifest.webmanifest', '/cev-logo.png', '/icons/icon-192.png', '/icons/icon-512.png']
const FONTES = ['fonts.googleapis.com', 'fonts.gstatic.com']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(CASCA)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n)))).then(() => self.clients.claim()),
  )
})

async function guardar(req, res) {
  if (res && res.ok) (await caches.open(VERSAO)).put(req, res.clone())
  return res
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // Só a própria casca e as fontes. Qualquer outra origem (Supabase, Evolution) passa direto, sem cache.
  const mesmaOrigem = url.origin === self.location.origin
  if (!mesmaOrigem && !FONTES.includes(url.hostname)) return

  // Abrir o app: tenta a internet (versão nova) e, sem internet, usa a última guardada.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => guardar('/', r)).catch(() => caches.match('/')))
    return
  }

  // Arquivos com nome único (/assets/...) nunca mudam: cache primeiro.
  if (mesmaOrigem && url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(req).then((c) => c || fetch(req).then((r) => guardar(req, r))))
    return
  }

  // Ícones, logo e fontes: mostra o guardado e atualiza por trás.
  e.respondWith(
    caches.match(req).then((c) => {
      const rede = fetch(req).then((r) => guardar(req, r)).catch(() => c)
      return c || rede
    }),
  )
})
