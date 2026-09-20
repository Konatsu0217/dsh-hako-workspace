import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const client = readFileSync(new URL('../client/client.js', import.meta.url), 'utf8')

test('graph nodes suppress native SVG focus artifacts and capture drag pointers', () => {
  assert.match(client, /style:\{outline:'none'/)
  assert.match(client, /tabIndex:0,draggable:false/)
  assert.match(client, /setPointerCapture\?\.\(ev\.pointerId\)/)
  assert.match(client, /Math\.hypot\(ev\.clientX-drag\.startX,ev\.clientY-drag\.startY\)>=3/)
  assert.match(client, /onPointerCancel:e=>up\(e,true\)/)
  assert.doesNotMatch(client, /onPointerLeave:up/)
})

test('canvas reads worlds and persists membership layout, not node props', () => {
  assert.match(client, /api\('\/world\?worldId='/)
  assert.match(client, /queueLayoutSave\(\{nodeId:positioned\.id,worldId:world\|\|''/)
  assert.match(client, /persistLayoutNow\(payload,? ?keepalive ?= ?false\)/)
  assert.doesNotMatch(client, /api\('\/graph'\)/)
  assert.doesNotMatch(client, /props\?\.parentId/)
  assert.doesNotMatch(client, /childMap/)
  assert.match(client, /setCrumbData\(g\.breadcrumb/)
  assert.match(client, /'world','file'/)
  assert.match(client, /world:'#7c3aed'/)
})

test('stored layouts are respected without recentering root world', () => {
  assert.match(client, /const hasStoredLayout = out.some/)
  assert.ok(client.includes('if (hasStoredLayout) return out'))
  assert.ok(client.includes('return out.map(n=>({...n,x:snap(n.x-mid)}))'))
})

test('graph nodes render as circular translucent neon concepts with full labels', () => {
  assert.match(client, /function radius\(n\)/)
  assert.match(client, /function labelWidth\(n\)/)
  assert.match(client, /h\('circle',\{'data-node-body':'1'/)
  assert.match(client, /fillOpacity:.34/)
  assert.match(client, /id:'hakoGlow'/)
  assert.match(client, /fontSize:11,fill:'var\(--dsw-alias-label-primary/)
  assert.doesNotMatch(client, /function nodeBox\(n\)/)
  assert.doesNotMatch(client, /h\('rect',\{'data-node-body':'1'/)
})

test('inspector chips and labels use readable contrast tokens', () => {
  assert.match(client, /chip:\{fontSize:11,fontWeight:650/)
  assert.match(client, /color:'var\(--dsw-alias-label-primary/)
  assert.match(client, /border:'1px solid var\(--dsw-alias-border-l3/)
  assert.match(client, /label:\{fontSize:11,fontWeight:800/)
  assert.match(client, /muted:\{fontSize:12,color:'var\(--dsw-alias-label-secondary/)
})


test('dragged layouts are queued and flushed on page leave', () => {
  assert.match(client, /pendingLayouts ?= ?useRef\(new Map\(\)\)/)
  assert.match(client, /function queueLayoutSave\(item\)/)
  assert.match(client, /function flushLayouts\(keepalive ?= ?false\)/)
  assert.match(client, /setInterval\(\(\) => \{ if \(pendingLayouts\.current\.size\) flushLayouts\(false\) \}, 200\)/)
  assert.match(client, /pagehide/)
  assert.match(client, /beforeunload/)
  assert.match(client, /visibilitychange/)
  assert.match(client, /navigator\.sendBeacon/)
  assert.match(client, /keepalive/)
  assert.match(client, /queueLayoutSave\(\{nodeId:positioned\.id,worldId:world\|\|''/)
  assert.doesNotMatch(client, /api\('\/membership',\{method:'POST',body:JSON\.stringify\(\{nodeId:positioned\.id/)
})


test('graph UI no longer exposes automatic arrange action', () => {
  assert.doesNotMatch(client, /整理布局/)
  assert.doesNotMatch(client, /function arrange\(\)/)
  assert.doesNotMatch(client, /\/arrange/)
})

test('link and edit mutations flush pending layout saves before reload', () => {
  assert.ok(client.includes('function flushLayouts(keepalive = false)'))
  assert.ok(client.includes('return Promise.allSettled(writes)'))
  assert.ok(client.includes("async function saveDraft() { await flushLayouts(false); await api('/edge'"))
  assert.ok(client.includes("async function saveEdit() { await flushLayouts(false); if (edit.type === 'node')"))
  assert.ok(client.includes("async function del() { if (!selected) return; await flushLayouts(false); await api"))
})
