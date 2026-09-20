import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { DatabaseSync } from 'node:sqlite'
import { WorkspaceStore, SCHEMA_VERSION } from '../src/store.js'

function withStore(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'hako-'))
  try { return fn(new WorkspaceStore(join(dir, 'workspace.db')), dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}

test('a node can belong to multiple worlds with independent layout', () => {
  withStore(store => {
    store.upsertNode({ id: 'world:a', kind: 'world', title: 'World A' })
    store.upsertNode({ id: 'world:b', kind: 'world', title: 'World B' })
    const node = store.upsertNode({ id: 'note:x', kind: 'note', title: '共享笔记', worlds: [{ worldId: 'world:a', layout: { x: 10, y: 10 } }, { worldId: 'world:b' }] })
    assert.deepEqual(node.worlds.sort(), ['world:a', 'world:b'])
    store.addToWorld({ nodeId: 'note:x', worldId: 'world:a', layout: { x: 120, y: 96 } })
    const inA = store.listWorld('world:a').nodes.find(n => n.id === 'note:x')
    const inB = store.listWorld('world:b').nodes.find(n => n.id === 'note:x')
    assert.deepEqual(inA.layout, { x: 120, y: 96, pinned: false })
    assert.deepEqual(inB.layout, { x: null, y: null, pinned: false })
    store.removeFromWorld({ nodeId: 'note:x', worldId: 'world:a' })
    assert.equal(store.listWorld('world:a').nodes.some(n => n.id === 'note:x'), false)
    assert.equal(store.get('note:x').worlds.includes('world:b'), true)
  })
})

test('agent can persist its own proposed nodes without impersonating user facts', () => {
  withStore(store => {
    const obs = store.upsertNode({ kind: 'note', title: 'Agent 观察', owner: 'agent', assertionLevel: 'proposed' })
    assert.equal(obs.owner, 'agent')
    assert.equal(obs.assertionLevel, 'proposed')
    const found = store.search({ owner: 'agent' }).nodes
    assert.equal(found.length, 1)
    assert.equal(store.overview({ limit: 5 }).agentNotes[0].id, obs.id)
  })
})

test('membership blocks containment cycles', () => {
  withStore(store => {
    store.upsertNode({ id: 'world:a', kind: 'world', title: 'A' })
    store.upsertNode({ id: 'world:b', kind: 'world', title: 'B', worlds: [{ worldId: 'world:a' }] })
    assert.throws(() => store.addToWorld({ nodeId: 'world:a', worldId: 'world:b' }), /cycle/)
  })
})


test('search supports FTS, id/kind, filters, pagination, external identity and ACL', () => {
  withStore(store => {
    store.upsertNode({ id: 'world:p', kind: 'world', title: 'Hako 项目' })
    store.upsertNode({ kind: 'note', title: '图谱检索设计', summary: 'Hako 工作区检索', tags: ['hako','retrieval'], source: 'lark', sourceScope: 'tenant-a', externalId: 'doc-1', worlds: [{ worldId: 'world:p' }] })
    const dup = store.upsertNode({ kind: 'note', title: '图谱检索设计更新', source: 'lark', sourceScope: 'tenant-a', externalId: 'doc-1' })
    const other = store.upsertNode({ kind: 'note', title: '另一租户同 ID', source: 'lark', sourceScope: 'tenant-b', externalId: 'doc-1' })
    assert.notEqual(dup.id, other.id)
    assert.equal(store.search({ q: '图谱检索', kinds: ['note'] }).nodes[0].id, dup.id)
    assert.equal(store.search({ q: dup.id }).nodes[0].id, dup.id)
    assert.ok(store.search({ q: 'note', limit: 20 }).nodes.every(n => n.kind === 'note'))
    assert.match(store.search({ q: '图谱检索' }).hits[0].reason, /^text match/)
    store.upsertNode({ id: 'note:secret', kind: 'note', title: '图谱秘密', status: 'unauthorized' })
    assert.equal(store.search({ q: '图谱', limit: 20 }).nodes.some(n => n.id === 'note:secret'), false)
    assert.equal(store.context({ nodeIds: ['note:secret'] }).nodes.length, 0)
    for (let i = 0; i < 3; i++) store.upsertNode({ id: 'x:' + i, kind: 'note', title: 'X ' + i })
    const p1 = store.search({ kinds: ['note'], limit: 2, includeEdges: false })
    const p2 = store.search({ kinds: ['note'], limit: 2, cursor: p1.nextCursor, includeEdges: false })
    assert.equal(p1.nodes.length, 2); assert.equal(p2.nodes.length, 2); assert.notEqual(p1.nodes[0].id, p2.nodes[0].id)
  })
})

test('overview and resume prioritize active work with weighted, budgeted context', () => {
  withStore(store => {
    store.upsertNode({ id: 'world:p', kind: 'world', title: 'Hako' })
    store.upsertNode({ id: 'todo:next', kind: 'todo', title: '实现新会话入口', status: 'in_progress', worlds: [{ worldId: 'world:p' }], props: { nextAction: '实现 resume' } })
    store.upsertNode({ id: 'decision:nav', kind: 'decision', title: '图用于导航', worlds: [{ worldId: 'world:p' }] })
    store.upsertNode({ id: 'feed:x', kind: 'feed_item', title: '收藏文章', worlds: [{ worldId: 'world:p' }] })
    store.upsertEdge({ from: 'todo:next', to: 'decision:nav', kind: 'todo_for', confidence: 1 })
    store.upsertEdge({ from: 'todo:next', to: 'feed:x', kind: 'related_to', confidence: .5 })
    assert.equal(store.overview({ limit: 5 }).todos[0].id, 'todo:next')
    assert.equal(store.resume({ q: '新会话入口', limit: 3 }).candidates[0].node.id, 'todo:next')
    const ctx = store.context({ nodeIds: ['todo:next'], maxNodes: 4, maxChars: 3000 })
    assert.equal(ctx.nodes[0].id, 'todo:next')
    assert.ok(ctx.nodes.findIndex(n => n.id === 'decision:nav') < ctx.nodes.findIndex(n => n.id === 'feed:x'))
    assert.match(ctx.text, /untrusted-data/)
    const tiny = store.context({ nodeIds: ['todo:next'], maxNodes: 4, maxChars: 1000 })
    assert.ok(tiny.text.length <= 1000)
    assert.doesNotThrow(() => JSON.parse(tiny.text.split('\n').slice(1).join('\n')))
  })
})

test('optimistic revision conflicts throw for nodes and edges', () => {
  withStore(store => {
    const a = store.upsertNode({ id: 'note:a', kind: 'note', title: 'A' })
    const b = store.upsertNode({ id: 'note:b', kind: 'note', title: 'B' })
    assert.equal(a.revision, 1)
    assert.equal(store.upsertNode({ id: 'note:a', kind: 'note', title: 'A2', expectedRevision: 1 }).revision, 2)
    assert.throws(() => store.upsertNode({ id: 'note:a', kind: 'note', title: 'stale', expectedRevision: 1 }), /revision conflict/)
    const e = store.upsertEdge({ from: 'note:a', to: 'note:b', kind: 'references' })
    assert.equal(store.upsertEdge({ id: e.id, from: 'note:a', to: 'note:b', kind: 'references', expectedRevision: 1 }).revision, 2)
    assert.throws(() => store.upsertEdge({ id: e.id, from: 'note:a', to: 'note:b', kind: 'references', expectedRevision: 1 }), /revision conflict/)
  })
})

test('soft deletes tombstone nodes and clear membership', () => {
  withStore(store => {
    store.upsertNode({ id: 'world:p', kind: 'world', title: 'P' })
    store.upsertNode({ id: 'note:x', kind: 'note', title: 'X', worlds: [{ worldId: 'world:p' }] })
    assert.equal(store.deleteNode('note:x').tombstoned, true)
    assert.equal(store.getNode('note:x'), null)
    assert.equal(store.listWorld('world:p').nodes.some(n => n.id === 'note:x'), false)
  })
})

test('archives a session with agent-owned references', () => {
  withStore(store => {
    const result = store.archiveSession({ sessionId: 'abc', title: 'RSS parser work', summary: 'Compared article with parser.', nodes: [{ id: 'file:parser', kind: 'file', title: 'Parser', uri: '/repo/parser.ts' }], edges: [] })
    assert.equal(result.session.id, 'session:abc')
    assert.equal(result.session.owner, 'agent')
    assert.equal(result.edges.length, 1)
    const ctx = store.context({ q: 'parser' })
    assert.match(ctx.text, /Parser/)
  })
})

test('refuses to open an incompatible pre-existing store, never migrating', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hako-incompat-'))
  try {
    const path = join(dir, 'workspace.db')
    const db = new DatabaseSync(path); db.exec('PRAGMA user_version=99'); db.close()
    assert.throws(() => new WorkspaceStore(path), /incompatible workspace store schema/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('reports the current schema version', () => {
  withStore(store => { assert.equal(Number(store.db.prepare('PRAGMA user_version').get().user_version), SCHEMA_VERSION) })
})

test('search ranks title above tags via corrected bm25 weights', () => {
  withStore(store => {
    store.upsertNode({ id: 'n:title', kind: 'note', title: '架构设计文档', summary: 'x' })
    store.upsertNode({ id: 'n:tag', kind: 'note', title: '无关标题', summary: 'y', tags: ['架构设计文档'] })
    const hits = store.search({ q: '架构设计文档', kinds: ['note'] }).nodes
    assert.equal(hits[0].id, 'n:title')
  })
})

test('multi short-token queries fall back to LIKE instead of returning nothing', () => {
  withStore(store => {
    store.upsertNode({ id: 'n:ab', kind: 'note', title: 'ab report', summary: 'contains cd marker' })
    const hits = store.search({ q: 'ab cd', kinds: ['note'] }).nodes
    assert.equal(hits.some(n => n.id === 'n:ab'), true)
  })
})

test('get() member count and worlds exclude unauthorized nodes', () => {
  withStore(store => {
    store.upsertNode({ id: 'world:p', kind: 'world', title: 'P' })
    store.upsertNode({ id: 'note:ok', kind: 'note', title: 'OK', worlds: [{ worldId: 'world:p' }] })
    store.upsertNode({ id: 'note:bad', kind: 'note', title: 'Bad', status: 'unauthorized', worlds: [{ worldId: 'world:p' }] })
    assert.equal(store.get('world:p').memberCount, 1)
    store.upsertNode({ id: 'world:secret', kind: 'world', title: 'Secret' })
    store.upsertNode({ id: 'note:m', kind: 'note', title: 'M', worlds: [{ worldId: 'world:p' }, { worldId: 'world:secret' }] })
    store.upsertNode({ id: 'world:secret', kind: 'world', title: 'Secret', status: 'unauthorized' })
    assert.deepEqual(store.get('note:m').worlds, ['world:p'])
  })
})

