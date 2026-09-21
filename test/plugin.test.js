import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Readable } from 'node:stream'
import { apply } from '../src/index.js'

function harness(dir) {
  const tools = [], routes = [], skills = []
  const webServer = { register(route) { routes.push(route); return () => {} } }
  const ctx = {
    tools: { register(tool) { tools.push(tool) } },
    skills: { register(skill) { skills.push(skill); return () => {} } },
    systemPrompt: { section() { throw new Error('must not register a systemPrompt section') } },
    provide() {},
    inject(_deps, callback) { callback({ webServer, effect(effect) { effect() } }) }
  }
  apply(ctx, { storePath: join(dir, 'workspace.db') })
  return { tools, routes, skills }
}

test('converges Harness surface to one skill and one tool, no prompt section', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hako-plugin-'))
  try {
    const { tools, routes, skills } = harness(dir)
    assert.equal(skills.length, 1)
    assert.equal(skills[0].name, 'hako-workspace')
    assert.equal(skills[0].source, 'dsh-hako-workspace')
    assert.ok(skills[0].content.includes('hako_workspace'))
    assert.ok(skills[0].content.includes('多 World'))
    assert.equal(tools.length, 1)
    assert.equal(tools[0].name, 'hako_workspace')
    assert.deepEqual(tools[0].parameters.properties.action.enum.includes('add_to_world'), true)
    assert.deepEqual(tools[0].parameters.properties.action.enum.includes('arrange'), false)
    assert.deepEqual(routes.map(r => r.path).sort(), [
      '/dsh-hako-workspace/archive', '/dsh-hako-workspace/context',
      '/dsh-hako-workspace/edge', '/dsh-hako-workspace/get', '/dsh-hako-workspace/membership',
      '/dsh-hako-workspace/node', '/dsh-hako-workspace/overview', '/dsh-hako-workspace/resume',
      '/dsh-hako-workspace/search', '/dsh-hako-workspace/world'
    ])
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('hako_workspace action envelope dispatches reads and writes', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hako-envelope-'))
  try {
    const { tools } = harness(dir)
    const tool = tools[0]
    const world = await tool.execute({ action: 'upsert_node', input: { id: 'world:p', kind: 'world', title: 'P' } })
    assert.equal(world.node.id, 'world:p')
    const note = await tool.execute({ action: 'upsert_node', input: { kind: 'note', title: '共享', owner: 'agent', worlds: [{ worldId: 'world:p' }] } })
    assert.equal(note.node.owner, 'agent')
    const listed = await tool.execute({ action: 'list_world', input: { worldId: 'world:p' } })
    assert.equal(listed.nodes.length, 1)
    const overview = await tool.execute({ action: 'overview', input: {} })
    assert.ok(overview.recent.length >= 1)
    await assert.rejects(() => tool.execute({ action: 'nope', input: {} }), /must be one of/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('stale HTTP writes map to a 409 conflict response', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hako-conflict-'))
  try {
    const { routes } = harness(dir)
    const nodeRoute = routes.find(r => r.path.endsWith('/node'))
    const call = async body => {
      const request = Readable.from([JSON.stringify(body)])
      request.method = 'POST'; request.url = '/dsh-hako-workspace/node'; request.headers = { host: '127.0.0.1', origin: 'http://127.0.0.1' }
      let status, payload
      const response = { writeHead(v) { status = v }, end(v) { payload = JSON.parse(v) } }
      await nodeRoute.handler(request, response)
      return { status, payload }
    }
    assert.equal((await call({ id: 'note:a', kind: 'note', title: 'A' })).status, 200)
    const conflict = await call({ id: 'note:a', kind: 'note', title: 'stale', expectedRevision: 0 })
    assert.equal(conflict.status, 409)
    assert.equal(conflict.payload.code, 'REVISION_CONFLICT')
    assert.equal(conflict.payload.currentRevision, 1)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
