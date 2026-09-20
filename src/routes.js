import { readJsonBody, sameOrigin, sendJson } from './http.js'

const ROUTE = '/dsh-hako-workspace'

function methodNotAllowed(response) { sendJson(response, 405, { error: 'method not allowed' }) }
function requireSameOrigin(request, response) { if (!sameOrigin(request)) { sendJson(response, 403, { error: 'same-origin request required' }); return false } return true }
function fail(response, error) { const conflict = error && error.code === 'REVISION_CONFLICT'; sendJson(response, conflict ? 409 : 400, { error: error instanceof Error ? error.message : String(error), ...(conflict ? { code: error.code, currentRevision: error.currentRevision } : {}) }) }

export function mountWorkspaceRoutes(host, store) {
  const disposers = []
  const route = (path, handler) => disposers.push(host.webServer.register({ kind: 'exact', path: ROUTE + path, handler }))
  const url = request => new URL(request.url || ROUTE, 'http://' + (request.headers.host || '127.0.0.1'))

  // World view for the canvas: members of one world with per-membership layout.
  route('/world', async (request, response) => {
    try {
      if (request.method !== 'GET') return methodNotAllowed(response)
      const params = url(request).searchParams
      sendJson(response, 200, store.listWorld(params.get('worldId') || ''))
    } catch (error) { fail(response, error) }
  })

  route('/overview', async (request, response) => {
    try {
      if (request.method !== 'GET') return methodNotAllowed(response)
      sendJson(response, 200, store.overview({ limit: Number(url(request).searchParams.get('limit')) || undefined }))
    } catch (error) { fail(response, error) }
  })

  route('/get', async (request, response) => {
    try {
      if (request.method !== 'GET') return methodNotAllowed(response)
      sendJson(response, 200, store.get(url(request).searchParams.get('id') || '') ?? { node: null })
    } catch (error) { fail(response, error) }
  })

  route('/search', async (request, response) => {
    try {
      if (request.method !== 'POST') return methodNotAllowed(response)
      if (!requireSameOrigin(request, response)) return
      sendJson(response, 200, store.search(await readJsonBody(request)))
    } catch (error) { fail(response, error) }
  })

  route('/resume', async (request, response) => {
    try {
      if (request.method !== 'POST') return methodNotAllowed(response)
      if (!requireSameOrigin(request, response)) return
      sendJson(response, 200, store.resume(await readJsonBody(request)))
    } catch (error) { fail(response, error) }
  })

  route('/context', async (request, response) => {
    try {
      if (request.method !== 'POST') return methodNotAllowed(response)
      if (!requireSameOrigin(request, response)) return
      sendJson(response, 200, store.context(await readJsonBody(request)))
    } catch (error) { fail(response, error) }
  })

  route('/node', async (request, response) => {
    try {
      if (!requireSameOrigin(request, response)) return
      const body = await readJsonBody(request)
      if (request.method === 'POST') return sendJson(response, 200, { node: store.upsertNode(body) })
      if (request.method === 'DELETE') return sendJson(response, 200, store.deleteNode(body.id))
      return methodNotAllowed(response)
    } catch (error) { fail(response, error) }
  })

  route('/edge', async (request, response) => {
    try {
      if (!requireSameOrigin(request, response)) return
      const body = await readJsonBody(request)
      if (request.method === 'POST') return sendJson(response, 200, { edge: store.upsertEdge(body) })
      if (request.method === 'DELETE') return sendJson(response, 200, store.deleteEdge(body.id))
      return methodNotAllowed(response)
    } catch (error) { fail(response, error) }
  })

  // Membership: add/update layout, or remove a node from a world.
  route('/membership', async (request, response) => {
    try {
      if (!requireSameOrigin(request, response)) return
      const body = await readJsonBody(request)
      if (request.method === 'POST') return sendJson(response, 200, store.addToWorld(body))
      if (request.method === 'DELETE') return sendJson(response, 200, store.removeFromWorld(body))
      return methodNotAllowed(response)
    } catch (error) { fail(response, error) }
  })


  route('/archive', async (request, response) => {
    try {
      if (request.method !== 'POST') return methodNotAllowed(response)
      if (!requireSameOrigin(request, response)) return
      sendJson(response, 200, store.archiveSession(await readJsonBody(request)))
    } catch (error) { fail(response, error) }
  })

  return () => { for (const dispose of disposers.splice(0)) dispose() }
}
