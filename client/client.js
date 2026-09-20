window.__ModuleLoader__.load({ id: 'dsh-hako-workspace', factory: (require) => {
  const module = { exports: {} }
  const exports = module.exports
  const React = require('react')
  const { createElement: h, useEffect, useMemo, useRef, useState } = React
  const primitives = require('@deepseek-ai/dsh-client-ui-primitives')
  const Button = primitives.Button || ((props) => h('button', props, props.children))
  const Icon = primitives.IconDatabaseOutline16 || primitives.IconContextInjectionOutline16 || ((props) => h('span', props, '◇'))

  const NS = 'dsh-hako-workspace'
  const NODE_KINDS = ['world','file','directory','url','session','message','artifact','todo','feed_item','note','decision','command','other']
  const EDGE_KINDS = ['references','related_to','derived_from','belongs_to_project','mentioned_in_session','opened_by_user','edited_by_agent','todo_for','follow_up_of','decides','blocks','unblocks','other']
  const DIRECTED = new Set(['references','derived_from','belongs_to_project','mentioned_in_session','opened_by_user','edited_by_agent','todo_for','follow_up_of','decides','blocks','unblocks'])
  const COLORS = { world:'#7c3aed', file:'#3b82f6', directory:'#6366f1', url:'#06b6d4', session:'#8b5cf6', message:'#a855f7', artifact:'#ec4899', todo:'#22c55e', feed_item:'#14b8a6', note:'#64748b', decision:'#f59e0b', command:'#f97316', other:'#94a3b8' }
  const S = {
    root:{position:'relative',width:'100%',height:'100%',minHeight:660,overflow:'hidden',background:'var(--dsw-alias-bg-layer-1,#f8fafc)',color:'var(--dsw-alias-label-primary,#0f172a)',touchAction:'none',fontSize:12,lineHeight:'18px',fontFamily:'-apple-system,BlinkMacSystemFont,"PingFang SC","Segoe UI",sans-serif'},
    grid:{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle, rgba(148,163,184,.5) 0.7px, transparent 0.7px)',opacity:.5,pointerEvents:'none'},
    crumbs:{display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:500},
    crumb:{border:0,background:'transparent',color:'inherit',cursor:'pointer',padding:'4px 5px',borderRadius:6},
    back:{height:30,padding:'0 10px',borderRadius:8,border:'1px solid rgba(148,163,184,.45)',background:'var(--dsw-alias-bg-layer-2,rgba(255,255,255,.9))',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4},
    toolbar:{position:'absolute',zIndex:30,left:0,right:0,top:0,height:48,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,padding:'0 14px',background:'var(--dsw-alias-bg-layer-2,rgba(255,255,255,.88))',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(148,163,184,.28)'},
    brand:{display:'flex',alignItems:'center',gap:8,fontWeight:650,fontSize:13},
    badge:{width:26,height:26,borderRadius:8,display:'grid',placeItems:'center',background:'#475569',color:'white'},
    tools:{display:'flex',alignItems:'center',gap:8},
    input:{height:30,width:230,border:'1px solid rgba(148,163,184,.5)',borderRadius:7,padding:'0 9px',background:'var(--dsw-alias-bg-layer-2,rgba(255,255,255,.88))',fontSize:12},
    select:{height:32,border:'1px solid rgba(148,163,184,.55)',borderRadius:8,padding:'0 8px',background:'var(--dsw-alias-bg-layer-2,rgba(255,255,255,.88))',fontSize:12,color:'inherit'},
    btn:{height:30,padding:'0 10px',borderRadius:8,border:'1px solid rgba(148,163,184,.45)',background:'var(--dsw-alias-bg-layer-2,rgba(255,255,255,.9))',fontSize:12,cursor:'pointer'},
    svg:{position:'absolute',inset:0,width:'100%',height:'100%',cursor:'grab',userSelect:'none',WebkitUserSelect:'none'},
    card:{position:'absolute',zIndex:40,left:18,top:64,width:320,maxHeight:'calc(100% - 84px)',overflow:'auto',borderRadius:14,background:'var(--dsw-alias-bg-layer-2,rgba(255,255,255,.92))',backdropFilter:'blur(18px)',border:'1px solid rgba(148,163,184,.32)',boxShadow:'0 14px 42px rgba(15,23,42,.12)',padding:12},
    cardHead:{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:12},
    kind:{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'.08em'},
    title:{fontSize:14,lineHeight:'20px',margin:'1px 0 3px',fontWeight:650},
    muted:{fontSize:12,color:'var(--dsw-alias-label-secondary,#475569)',lineHeight:'18px',wordBreak:'break-all'},
    section:{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(148,163,184,.22)'},
    label:{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--dsw-alias-label-secondary,#475569)',marginBottom:8},
    relRow:{fontSize:12,padding:'6px 8px',borderRadius:8,background:'rgba(241,245,249,.72)',cursor:'pointer',marginBottom:5},
    chip:{fontSize:11,fontWeight:650,lineHeight:'17px',border:'1px solid var(--dsw-alias-border-l3,#94a3b8)',borderRadius:999,padding:'2px 7px',background:'color-mix(in srgb, var(--dsw-alias-bg-layer-2,#fff) 78%, var(--dsw-alias-label-primary,#0f172a) 10%)',color:'var(--dsw-alias-label-primary,#0f172a)',marginRight:6,marginBottom:5,display:'inline-flex',alignItems:'center'},
    actions:{display:'flex',gap:8,flexWrap:'wrap',marginTop:14},
    pop:{position:'absolute',zIndex:50,width:300,borderRadius:14,background:'var(--dsw-alias-bg-layer-2,rgba(255,255,255,.95))',backdropFilter:'blur(14px)',border:'1px solid rgba(148,163,184,.35)',boxShadow:'0 12px 40px rgba(15,23,42,.16)',padding:12},
    area:{width:'100%',minHeight:64,resize:'vertical',border:'1px solid rgba(148,163,184,.45)',borderRadius:8,padding:8,fontSize:12,boxSizing:'border-box'}
  }
  async function api(path, init) {
    const res = await fetch('/dsh-hako-workspace' + path, { ...init, headers: { 'content-type': 'application/json', ...(init && init.headers || {}) } })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || res.statusText)
    return data
  }
  function degree(nodes, edges) {
    const m = Object.fromEntries(nodes.map(n => [n.id, 0]))
    for (const e of edges) { if (m[e.from] != null) m[e.from]++; if (m[e.to] != null) m[e.to]++ }
    return m
  }
  const GRID = 12
  function snap(v) { return Math.round(v / GRID) * GRID }
  function worldLayout(nodes, edges) {
    const d = degree(nodes, edges || [])
    if (!nodes.length) return []
    const by = new Map(nodes.map(n => [n.id, n]))
    const adj = new Map(nodes.map(n => [n.id, []]))
    for (const e of edges || []) if (adj.has(e.from) && adj.has(e.to)) { adj.get(e.from).push(e.to); adj.get(e.to).push(e.from) }
    const seen = new Set(); const comps = []
    for (const n of nodes) {
      if (seen.has(n.id)) continue
      const q=[n.id], ids=[]; seen.add(n.id)
      while(q.length){const id=q.shift();ids.push(id);for(const nb of adj.get(id)||[]) if(!seen.has(nb)){seen.add(nb);q.push(nb)}}
      comps.push(ids.map(id=>by.get(id)).sort((a,b)=>(d[b.id]||0)-(d[a.id]||0)||a.title.localeCompare(b.title)||a.id.localeCompare(b.id)))
    }
    comps.sort((a,b)=>b.length-a.length)
    const out=[]; let cursorX=0
    for (const comp of comps) {
      const n=comp.length; const radiusBase=Math.max(96, Math.min(360, 38*n + Math.max(...comp.map(labelWidth))/2))
      if (n===1) { const node=comp[0], l=node.layout; out.push({...node,degree:d[node.id]||0,x:l&&Number.isFinite(l.x)?snap(l.x):snap(cursorX),y:l&&Number.isFinite(l.y)?snap(l.y):0}); cursorX += Math.max(180,labelWidth(node)+72); continue }
      const center = comp[0]
      const cx=cursorX, cy=0
      for (let i=0;i<n;i++) {
        const node=comp[i], l=node.layout
        if (l&&Number.isFinite(l.x)&&Number.isFinite(l.y)) { out.push({...node,degree:d[node.id]||0,x:snap(l.x),y:snap(l.y)}); continue }
        if (i===0) { out.push({...node,degree:d[node.id]||0,x:snap(cx),y:snap(cy)}); continue }
        const ring=Math.floor((i-1)/10); const pos=(i-1)%10; const count=Math.min(10,n-1-ring*10)
        const angle=(Math.PI*2)*(pos/count)+ring*.37
        const rr=radiusBase + ring*92 + labelWidth(node)*.18
        out.push({...node,degree:d[node.id]||0,x:snap(cx+Math.cos(angle)*rr),y:snap(cy+Math.sin(angle)*rr)})
      }
      cursorX += Math.max(340, radiusBase*2 + 220)
    }
    const hasStoredLayout = out.some(n => n.layout && Number.isFinite(n.layout.x) && Number.isFinite(n.layout.y))
    if (hasStoredLayout) return out
    const mid=(Math.min(...out.map(n=>n.x))+Math.max(...out.map(n=>n.x)))/2
    return out.map(n=>({...n,x:snap(n.x-mid)}))
  }
  function cameraFor(list, size) { if(!list.length)return{x:0,y:0,scale:1};const minX=Math.min(...list.map(n=>n.x)),maxX=Math.max(...list.map(n=>n.x)),minY=Math.min(...list.map(n=>n.y)),maxY=Math.max(...list.map(n=>n.y));const spanX=Math.max(220,maxX-minX+260),spanY=Math.max(220,maxY-minY+190);const scale=Math.max(.2,Math.min(2.5,Math.min(size.width/spanX,(size.height-70)/spanY)));return{scale,x:-(minX+maxX)/2*scale,y:30-(minY+maxY)/2*scale} }
  function radius(n) { return Math.min(18, 10 + Math.sqrt((n.degree || 0) + 1) * 1.9) }
  function labelWidth(n) { return Math.max(64, Math.min(180, String(n.title || n.id).length * 7.2)) }
  function truncate(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n-1) + '…' : s }
  function components(nodes, edges) {
    const by = new Map(nodes.map(n => [n.id, n])); const adj = new Map(nodes.map(n => [n.id, []]))
    for (const e of edges) if (adj.has(e.from) && adj.has(e.to)) { adj.get(e.from).push(e.to); adj.get(e.to).push(e.from) }
    const seen = new Set(); const out = []
    for (const n of nodes) {
      if (seen.has(n.id)) continue
      const q = [n.id]; const ids = []; seen.add(n.id)
      while (q.length) { const id = q.shift(); ids.push(id); for (const nb of adj.get(id) || []) if (!seen.has(nb)) { seen.add(nb); q.push(nb) } }
      if (ids.length > 1) out.push(ids.map(id => by.get(id)).filter(Boolean))
    }
    return out
  }
  function componentName(c) {
    const tags = new Map()
    for (const n of c) for (const t of n.tags || []) tags.set(t, (tags.get(t) || 0) + 1)
    return ([...tags.entries()].sort((a,b) => b[1]-a[1])[0] || ['聚类'])[0]
  }
  function field(label, value, onChange, area) {
    return h('label', { style:{display:'grid',gap:4,marginTop:8} },
      h('div', { style:S.muted }, label),
      area ? h('textarea', { style:S.area, value, onChange:e=>onChange(e.target.value) }) : h('input', { style:{...S.input,width:'100%',boxSizing:'border-box'}, value, onChange:e=>onChange(e.target.value) })
    )
  }
  function Graph() {
    const box = useRef(null); const svg = useRef(null); const initialFit = useRef(false); const capturedPointer = useRef(null); const pendingLayouts = useRef(new Map()); const flushTimer = useRef(null)
    const [graph,setGraph] = useState({nodes:[],edges:[],totalNodes:0,totalEdges:0})
    const [nodes,setNodes] = useState([]); const [q,setQ] = useState(''); const [kind,setKind] = useState('')
    const [selected,setSelected] = useState(null); const [hover,setHover] = useState(null); const [drag,setDrag] = useState(null)
    const [link,setLink] = useState(null); const [draft,setDraft] = useState(null); const [edit,setEdit] = useState(null)
    const [err,setErr] = useState(''); const [showClusters,setShowClusters] = useState(true); const [clusterRevision,setClusterRevision] = useState(0)
    const [world,setWorld] = useState(''); const [crumbData,setCrumbData] = useState([]); const [camera,setCamera] = useState({x:0,y:0,scale:1}); const [size,setSize] = useState({width:1000,height:700}); const [pan,setPan] = useState(null)
    const fitNext = useRef(false)
    const load = (worldId=world) => api('/world?worldId='+encodeURIComponent(worldId||'')).then(g => { setGraph(g); setCrumbData(g.breadcrumb||[]); setNodes(worldLayout(g.nodes, g.edges)); setErr(''); if(fitNext.current){fitNext.current=false} }).catch(e => setErr(e.message))
    useEffect(() => { load(world) }, [world])
    useEffect(() => { if (!box.current) return; const update=()=>{const r=box.current.getBoundingClientRect();setSize({width:r.width,height:r.height})}; update(); const ro=new ResizeObserver(update);ro.observe(box.current);return()=>ro.disconnect() }, [])
    const by = useMemo(() => new Map(nodes.map(n => [n.id,n])), [nodes])
    const worldNodes = nodes
    const crumbs = crumbData
    useEffect(()=>{if(!initialFit.current&&nodes.length&&size.width){initialFit.current=true;setCamera(cameraFor(nodes,size))}},[nodes,size.width,size.height])
    const visible = useMemo(() => worldNodes.filter(n => { const s = q.trim().toLowerCase(); if (kind && n.kind !== kind) return false; if (!s) return true; return [n.id,n.kind,n.title,n.uri,n.summary,...(n.tags||[])].join('\\n').toLowerCase().includes(s) }), [worldNodes,q,kind])
    const ids = new Set(visible.map(n => n.id))
    const edges = graph.edges.filter(e => ids.has(e.from) && ids.has(e.to))
    const viewX = size.width/2 + camera.x; const viewY = size.height/2 + camera.y
    const viewTransform = 'translate('+viewX+','+viewY+') scale('+camera.scale+')'
    const gridSize = GRID * camera.scale; const gridX = ((viewX % gridSize) + gridSize) % gridSize; const gridY = ((viewY % gridSize) + gridSize) % gridSize
    const selectedObj = selected?.type === 'node' ? by.get(selected.id) : selected?.type === 'edge' ? graph.edges.find(e => e.id === selected.id) : null
    const neigh = selected?.type === 'node' ? graph.edges.filter(e => e.from === selected.id || e.to === selected.id) : []
    const nids = new Set(neigh.flatMap(e => [e.from, e.to]))
    function screenPoint(ev) { const r = svg.current.getBoundingClientRect(); return {x:ev.clientX-r.left,y:ev.clientY-r.top} }
    function worldPoint(ev) { const p=screenPoint(ev); return {x:(p.x-viewX)/camera.scale,y:(p.y-viewY)/camera.scale} }
    function capture(ev) { ev.currentTarget.setPointerCapture?.(ev.pointerId); capturedPointer.current={id:ev.pointerId,target:ev.currentTarget} }
    function release(ev) { const captured=capturedPointer.current;if(!captured||captured.id!==ev.pointerId)return;capturedPointer.current=null;if(captured.target.hasPointerCapture?.(captured.id))captured.target.releasePointerCapture?.(captured.id) }
    function down(ev,n) { if(ev.button!==0)return;ev.stopPropagation(); const p=worldPoint(ev); const sp=screenPoint(ev); if(link){if(link.from!==n.id)setDraft({from:link.from,to:n.id,x:sp.x,y:sp.y,kind:'related_to',rationale:''});setLink(null);return} if(ev.altKey){setLink({from:n.id,x:p.x,y:p.y});return} capture(ev);setSelected({type:'node',id:n.id});setDrag({id:n.id,pointerId:ev.pointerId,startX:ev.clientX,startY:ev.clientY,originX:n.x,originY:n.y,dx:p.x-n.x,dy:p.y-n.y,moved:false}) }
    function canvasDown(ev) { if(ev.button!==0)return; capture(ev);setSelected(null);setPan({pointerId:ev.pointerId,sx:ev.clientX,sy:ev.clientY,x:camera.x,y:camera.y}) }
    function move(ev) { if(pan?.pointerId===ev.pointerId){setCamera(c=>({...c,x:pan.x+ev.clientX-pan.sx,y:pan.y+ev.clientY-pan.sy}));return} const p=worldPoint(ev);if(link)setLink(l=>l&&({...l,x:p.x,y:p.y}));if(drag?.pointerId===ev.pointerId){const moved=drag.moved||Math.hypot(ev.clientX-drag.startX,ev.clientY-drag.startY)>=3;if(!moved)return;if(!drag.moved)setDrag(d=>d&&({...d,moved:true}));setNodes(ns=>ns.map(n=>n.id===drag.id?({...n,x:snap(p.x-drag.dx),y:snap(p.y-drag.dy)}):n))} }
    function persistLayoutNow(payload, keepalive = false) {
      const body = JSON.stringify(payload)
      if (keepalive && navigator.sendBeacon) {
        try { const blob = new Blob([body], { type: 'application/json' }); if (navigator.sendBeacon('/dsh-hako-workspace/membership', blob)) return Promise.resolve() } catch {}
      }
      return keepalive ? fetch('/dsh-hako-workspace/membership', { method:'POST', headers:{ 'content-type':'application/json' }, body, keepalive }).then(res => { if (!res.ok) throw new Error(res.statusText) }) : api('/membership', { method:'POST', body })
    }
    function flushLayouts(keepalive = false) {
      const items = [...pendingLayouts.current.values()]
      pendingLayouts.current.clear()
      if (flushTimer.current) { clearTimeout(flushTimer.current); flushTimer.current = null }
      const writes = items.map(item => persistLayoutNow(item, keepalive).catch(e => { if (!keepalive) { pendingLayouts.current.set(item.worldId + '::' + item.nodeId, item); setErr(e.message) } throw e }))
      return Promise.allSettled(writes)
    }
    function queueLayoutSave(item) {
      pendingLayouts.current.set(item.worldId + '::' + item.nodeId, item)
      if (flushTimer.current) clearTimeout(flushTimer.current)
      flushTimer.current = setTimeout(() => flushLayouts(false), 180)
    }
    useEffect(() => { const timer = setInterval(() => { if (pendingLayouts.current.size) flushLayouts(false) }, 200); const flush = () => flushLayouts(true); const vis = () => { if (document.visibilityState === 'hidden') flush() }; window.addEventListener('pagehide', flush); window.addEventListener('beforeunload', flush); document.addEventListener('visibilitychange', vis); return () => { clearInterval(timer); flush(); window.removeEventListener('pagehide', flush); window.removeEventListener('beforeunload', flush); document.removeEventListener('visibilitychange', vis) } }, [])
    function up(ev,cancelled=false) { if(pan?.pointerId===ev.pointerId)setPan(null);if(drag?.pointerId===ev.pointerId){const n=nodes.find(x=>x.id===drag.id);const moved=drag.moved||Math.hypot(ev.clientX-drag.startX,ev.clientY-drag.startY)>=3;setDrag(null);if(cancelled&&moved)setNodes(ns=>ns.map(x=>x.id===drag.id?({...x,x:drag.originX,y:drag.originY}):x));if(moved)setClusterRevision(v=>v+1);if(!cancelled&&moved&&n){const p=worldPoint(ev),positioned={...n,x:snap(p.x-drag.dx),y:snap(p.y-drag.dy)};setNodes(ns=>ns.map(x=>x.id===drag.id?positioned:x));queueLayoutSave({nodeId:positioned.id,worldId:world||'',layout:{x:positioned.x,y:positioned.y,pinned:true}})}}if(link)setLink(null);release(ev) }
    const wheelState = useRef({}); wheelState.current = { camera, size, viewX, viewY }
    useEffect(() => { const el = box.current; if (!el) return; const onWheel = (ev) => { ev.preventDefault(); const st = wheelState.current; const r = svg.current.getBoundingClientRect(); const px = ev.clientX - r.left, py = ev.clientY - r.top; const wx = (px - st.viewX) / st.camera.scale, wy = (py - st.viewY) / st.camera.scale; const next = Math.max(.2, Math.min(3, st.camera.scale * Math.exp(-ev.deltaY * .0012))); setCamera({ scale: next, x: px - st.size.width/2 - wx*next, y: py - st.size.height/2 - wy*next }) }; el.addEventListener('wheel', onWheel, { passive:false }); return () => el.removeEventListener('wheel', onWheel) }, [])
    function nodeUp(ev,n) { if(link&&link.from!==n.id){ev.stopPropagation();const sp=screenPoint(ev);setDraft({from:link.from,to:n.id,x:sp.x,y:sp.y,kind:'related_to',rationale:''});setLink(null)} }
    async function saveDraft() { await flushLayouts(false); await api('/edge',{method:'POST',body:JSON.stringify(draft)}); setDraft(null); await load(world) }
    async function del() { if (!selected) return; await flushLayouts(false); await api(selected.type==='node'?'/node':'/edge',{method:'DELETE',body:JSON.stringify({id:selected.id})}); setSelected(null); await load(world) }
    async function removeFromWorld(id) { await flushLayouts(false); await api('/membership',{method:'DELETE',body:JSON.stringify({nodeId:id,worldId:world||''})}); setSelected(null); await load(world) }
    async function saveEdit() { await flushLayouts(false); if (edit.type === 'node') { const x = {...edit.obj,tags:String(edit.obj.tagsText||'').split(',').map(s=>s.trim()).filter(Boolean)}; delete x.tagsText; delete x.layout; delete x.worlds; delete x.childCount; await api('/node',{method:'POST',body:JSON.stringify(x)}) } else await api('/edge',{method:'POST',body:JSON.stringify({...edit.obj,confidence:Number(edit.obj.confidence)||.7})}); setEdit(null); await load(world) }
    async function add() { await api('/node',{method:'POST',body:JSON.stringify({id:'note:'+Math.random().toString(36).slice(2,8),kind:'note',title:'新节点',summary:'新的工作区图谱节点',owner:'user',worlds:[{worldId:world||''}]})}); initialFit.current=false; await load(world) }
    function enterWorld(id) { initialFit.current=false; setWorld(id); setSelected(null) }
    function goWorld(id) { initialFit.current=false; setWorld(id||''); setSelected(null) }
    function fitWorld() { setCamera(cameraFor(visible,size)) }
    function back() { const parent=crumbs.length>=2?crumbs[crumbs.length-2].id:''; goWorld(parent) }
    return h('div', { ref:box, style:S.root, onPointerMove:move, onPointerUp:up, onPointerCancel:e=>up(e,true) },
      h('div', { style:{...S.grid,backgroundSize:gridSize+'px '+gridSize+'px',backgroundPosition:gridX+'px '+gridY+'px'} }),
      h('div', { style:S.toolbar },
        h('div', { style:S.brand }, h('div', { style:S.badge }, h(Icon,{size:16})), h('div',{style:S.crumbs},h('button',{style:S.crumb,'data-crumb-root':'1',onClick:()=>goWorld(null)},'工作区图谱'),...crumbs.flatMap(n=>[h('span',{key:'s:'+n.id,style:S.muted},'›'),h('button',{key:n.id,style:S.crumb,onClick:()=>goWorld(n.id)},n.title)])), h('span', {style:S.muted}, visible.length + ' 个节点 · ' + edges.length + ' 条关系')),
        h('div', { style:S.tools }, world&&h('button',{style:S.back,onClick:back,'data-back':'1'},'← 返回上一层'), h('input', {style:S.input,placeholder:'搜索节点…',value:q,onChange:e=>setQ(e.target.value)}), h('select', {style:S.select,value:kind,onChange:e=>setKind(e.target.value)}, h('option',{value:''},'全部类型'), ...NODE_KINDS.map(k=>h('option',{key:k,value:k},k))), h(Button,{style:S.btn,onClick:()=>setShowClusters(!showClusters)},showClusters?'显示聚类':'隐藏聚类'), h(Button,{style:S.btn,onClick:fitWorld},'适应视图'), h(Button,{style:S.btn,onClick:add},'新增节点'))
      ),
      h('svg', { ref:svg, style:{...S.svg,cursor:pan?'grabbing':'grab'}, onPointerDown:canvasDown },
        h('defs', null, h('filter',{id:'hakoGlow',x:'-70%',y:'-70%',width:'240%',height:'240%'},h('feGaussianBlur',{stdDeviation:5,result:'blur'}),h('feMerge',null,h('feMergeNode',{in:'blur'}),h('feMergeNode',{in:'SourceGraphic'}))), h('marker',{id:'hakoArrow',markerWidth:8,markerHeight:8,refX:18,refY:2.5,orient:'auto',markerUnits:'strokeWidth'},h('path',{d:'M0,0 L0,5 L7,2.5 z',fill:'#94a3b8'})), h('marker',{id:'hakoArrowActive',markerWidth:8,markerHeight:8,refX:18,refY:2.5,orient:'auto',markerUnits:'strokeWidth'},h('path',{d:'M0,0 L0,5 L7,2.5 z',fill:'#6366f1'}))),
        h('g',{'data-world-root':world||'root',transform:viewTransform},
        showClusters && !drag?.moved && h('g',{key:'clusters:'+String(world)+':'+clusterRevision,'data-cluster-layer':'1',pointerEvents:'none'},components(visible,edges).map((c,i) => { const xs=c.map(n=>n.x), ys=c.map(n=>n.y); const x=Math.min(...xs)-44, y=Math.min(...ys)-44, w=Math.max(...xs)-Math.min(...xs)+88, hg=Math.max(...ys)-Math.min(...ys)+88; return h('g',{key:'c'+i},h('rect',{x,y,width:w,height:hg,rx:28,fill:'#6366f1',fillOpacity:.045,stroke:'#6366f1',strokeOpacity:.18,strokeDasharray:'6 8',vectorEffect:'non-scaling-stroke'}),h('text',{x:x+18,y:y+22,fontSize:11,fill:'#64748b',fontWeight:700},componentName(c)+' · '+c.length+' 个节点')) })),
        edges.map(e => { const a=by.get(e.from), b=by.get(e.to); if(!a||!b) return null; const active=selected?.id===e.id||(selected?.type==='node'&&nids.has(e.from)&&nids.has(e.to)); return h('g',{key:e.id,onPointerDown:ev=>{ev.stopPropagation();setSelected({type:'edge',id:e.id})},onPointerEnter:()=>setHover({edge:e.id}),onPointerLeave:()=>setHover(null),style:{cursor:'pointer'}},h('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'transparent',strokeWidth:14,pointerEvents:'stroke'}), h('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,pointerEvents:'none',stroke:active?'#6366f1':'#94a3b8',strokeWidth:active?2.2:1.2,strokeOpacity:active?.95:.48,strokeDasharray:e.confidence<.5||e.props?.review==='pending'?'5 5':undefined,markerEnd:DIRECTED.has(e.kind)?'url(#'+(active?'hakoArrowActive':'hakoArrow')+')':undefined}), (active||hover?.edge===e.id)&&h('text',{x:(a.x+b.x)/2,y:(a.y+b.y)/2-6,textAnchor:'middle',fontSize:10,fill:active?'#4f46e5':'#64748b',paintOrder:'stroke',stroke:'var(--dsw-alias-bg-layer-2,#fff)',strokeWidth:4},e.kind)) }),
        link && by.get(link.from) && h('line',{x1:by.get(link.from).x,y1:by.get(link.from).y,x2:link.x,y2:link.y,stroke:'#6366f1',strokeWidth:1.6,strokeDasharray:'4 4'}),
        visible.map(n => { const r=radius(n), color=COLORS[n.kind]||COLORS.other, active=selected?.type==='node'&&selected.id===n.id, faded=selected?.type==='node'&&selected.id!==n.id&&!nids.has(n.id), childCount=n.childCount||0, w=labelWidth(n); return h('g',{key:n.id,'data-node-id':n.id,role:'button','aria-label':n.title+(childCount?'，包含 '+childCount+' 个子节点':''),tabIndex:0,draggable:false,transform:'translate('+n.x+','+n.y+')',opacity:faded?.38:1,onFocus:()=>setSelected({type:'node',id:n.id}),onPointerDown:e=>down(e,n),onPointerUp:e=>nodeUp(e,n),onDoubleClick:e=>{e.stopPropagation();if(childCount)enterWorld(n.id)},onKeyDown:e=>{if((e.key==='Enter'||e.key===' ')&&childCount){e.preventDefault();enterWorld(n.id)}},onPointerEnter:()=>setHover({node:n.id}),onPointerLeave:()=>setHover(null),style:{outline:'none',cursor:link?'crosshair':drag?.id===n.id?'grabbing':childCount?'zoom-in':'grab',userSelect:'none',WebkitUserSelect:'none'}}, h('circle',{r:r+9,fill:color,fillOpacity:.12,filter:'url(#hakoGlow)',pointerEvents:'none'}), h('circle',{'data-node-body':'1',r,fill:color,fillOpacity:.34,stroke:active?'#fff':color,strokeWidth:active?2.2:1.2,strokeOpacity:active?1:.85,vectorEffect:'non-scaling-stroke'}), h('circle',{r:r*.52,fill:color,fillOpacity:.62,pointerEvents:'none'}), childCount>0&&h('g',{transform:'translate('+(r+7)+','+(-r-5)+')',pointerEvents:'none'},h('circle',{r:7,fill:'var(--dsw-alias-bg-layer-2,#fff)',stroke:color,strokeWidth:1.2}),h('text',{y:3,textAnchor:'middle',fontSize:7.5,fill:color,fontWeight:800},childCount)), n.props?.review==='pending'&&h('circle',{r:r+13,fill:'none',stroke:'#f59e0b',strokeWidth:1,strokeDasharray:'3 3'}), h('text',{x:0,y:r+15,textAnchor:'middle',fontSize:11,fill:'var(--dsw-alias-label-primary,#0f172a)',fontWeight:620,paintOrder:'stroke',stroke:'var(--dsw-alias-bg-layer-1,#fff)',strokeWidth:4,pointerEvents:'none'},truncate(n.title||n.id,26)), h('text',{x:0,y:r+28,textAnchor:'middle',fontSize:9.5,fill:'#64748b',paintOrder:'stroke',stroke:'var(--dsw-alias-bg-layer-1,#fff)',strokeWidth:3,pointerEvents:'none'},n.kind), !drag?.moved&&(active||hover?.node===n.id)&&h('g',{transform:'translate(0,'+(-r-34)+')',pointerEvents:'none'},h('rect',{x:-w/2-8,y:0,width:w+16,height:24,rx:8,fill:'var(--dsw-alias-bg-layer-2,#fff)',stroke:'rgba(148,163,184,.35)'}),h('text',{x:0,y:15,textAnchor:'middle',fontSize:10.5,fontWeight:650,fill:'var(--dsw-alias-label-primary,#0f172a)'},truncate(n.title,28)))) })
        )
      ),
      selectedObj && h(Inspector,{selected,object:selectedObj,nodes,edges:graph.edges,neighbors:neigh,childCount:selectedObj.childCount||0,world,onEnter:()=>enterWorld(selectedObj.id),onClose:()=>setSelected(null),onDelete:del,onRemoveWorld:()=>removeFromWorld(selectedObj.id),onEdit:()=>setEdit({type:selected.type,obj:selected.type==='node'?{...selectedObj,tagsText:(selectedObj.tags||[]).join(', ')}:{...selectedObj}}),onFocus:id=>setSelected({type:'node',id}),onLink:id=>setLink({from:id,x:by.get(id)?.x||0,y:by.get(id)?.y||0})}),
      draft && h(RelPop,{draft,nodes:by,onChange:setDraft,onSave:saveDraft,onCancel:()=>setDraft(null)}),
      edit && h(EditPop,{edit,onChange:setEdit,onSave:saveEdit,onCancel:()=>setEdit(null)}),
      err && h('div',{style:{position:'absolute',right:16,bottom:16,zIndex:60,color:'#dc2626',background:'white',border:'1px solid #fecaca',borderRadius:10,padding:10}},err)
    )
  }
  function Inspector(p) {
    const o=p.object
    if (p.selected.type === 'edge') { const a=p.nodes.find(n=>n.id===o.from), b=p.nodes.find(n=>n.id===o.to); return h('div',{style:S.card},h('div',{style:S.cardHead},h('div',null,h('div',{style:S.kind},'关系'),h('div',{style:S.title},o.kind),h('div',{style:S.muted},o.from+' → '+o.to)),h('button',{style:S.btn,onClick:p.onClose},'×')),h('div',{style:S.section},h('div',{style:S.label},'端点'),h('div',{style:S.relRow,onClick:()=>a&&p.onFocus(a.id)},a?.title||o.from),h('div',{style:S.relRow,onClick:()=>b&&p.onFocus(b.id)},b?.title||o.to)),h('div',{style:S.section},h('div',{style:S.label},'关系说明'),h('div',{style:S.muted},o.rationale||'暂无关系说明。')),h('div',{style:S.section},h('span',{style:S.chip},'置信度 '+(o.confidence??.7)),o.props?.review&&h('span',{style:S.chip},o.props.review)),h('div',{style:S.actions},h('button',{style:S.btn,onClick:p.onEdit},'编辑'),h('button',{style:{...S.btn,color:'#dc2626'},onClick:p.onDelete},'删除'))) }
    const groups={}; for(const e of p.neighbors)(groups[e.kind]||=[]).push(e)
    return h('div',{style:S.card},h('div',{style:S.cardHead},h('div',null,h('div',{style:{...S.kind,color:COLORS[o.kind]||COLORS.other}},o.kind),h('div',{style:S.title},o.title),o.uri&&h('div',{style:S.muted},o.uri)),h('button',{style:S.btn,onClick:p.onClose},'×')),o.summary&&h('div',{style:S.section},h('div',{style:S.label},'摘要'),h('div',{style:{fontSize:13,lineHeight:'20px'}},o.summary)),(o.tags||[]).length>0&&h('div',{style:S.section},h('div',{style:S.label},'标签'),o.tags.map(t=>h('span',{key:t,style:S.chip},t))),h('div',{style:S.section},h('div',{style:S.label},'属性'),h('span',{style:S.chip},'owner '+(o.owner||'user')),o.assertionLevel&&h('span',{style:S.chip},o.assertionLevel),o.source&&h('span',{style:S.chip},'来源 '+o.source),(o.worlds||[]).length>0&&h('span',{style:S.chip},'所属 '+(o.worlds||[]).length+' 个世界'),o.status&&h('span',{style:S.chip},o.status)),h('div',{style:S.section},h('div',{style:S.label},'关系'),Object.keys(groups).length?Object.entries(groups).flatMap(([k,arr])=>arr.map(e=>{const id=e.from===o.id?e.to:e.from,n=p.nodes.find(x=>x.id===id);return h('div',{key:e.id,style:S.relRow,onClick:()=>p.onFocus(id)},k+' · '+(n?.title||id))})):h('div',{style:S.muted},'暂无关系。')),h('div',{style:S.actions},p.childCount>0&&h('button',{style:S.btn,onClick:p.onEnter},'进入小世界（'+p.childCount+'）'),o.uri&&h('button',{style:S.btn,onClick:()=>window.open(o.uri,'_blank')},'打开资源'),h('button',{style:S.btn,onClick:p.onEdit},'编辑'),h('button',{style:S.btn,onClick:()=>p.onLink(o.id)},'添加关系'),p.world&&h('button',{style:S.btn,onClick:p.onRemoveWorld},'移出本世界'),h('button',{style:{...S.btn,color:'#dc2626'},onClick:p.onDelete},'删除')))
  }
  function RelPop({draft,nodes,onChange,onSave,onCancel}) { return h('div',{style:{...S.pop,left:draft.x+12,top:draft.y+12}},h('b',null,'创建关系'),h('div',{style:S.muted},(nodes.get(draft.from)?.title||draft.from)+' → '+(nodes.get(draft.to)?.title||draft.to)),h('select',{style:{...S.select,width:'100%',marginTop:10},value:draft.kind,onChange:e=>onChange({...draft,kind:e.target.value})},...EDGE_KINDS.map(k=>h('option',{key:k,value:k},k))),field('关系说明',draft.rationale,v=>onChange({...draft,rationale:v}),true),h('div',{style:S.actions},h('button',{style:S.btn,onClick:onSave},'创建'),h('button',{style:S.btn,onClick:onCancel},'取消'))) }
  function EditPop({edit,onChange,onSave,onCancel}) { const o=edit.obj; return h('div',{style:{...S.pop,left:376,top:86}},h('b',null,edit.type==='node'?'编辑节点':'编辑关系'),edit.type==='node'?h('div',null,field('标题',o.title,v=>onChange({type:edit.type,obj:{...o,title:v}})),field('URI',o.uri||'',v=>onChange({type:edit.type,obj:{...o,uri:v}})),field('摘要',o.summary||'',v=>onChange({type:edit.type,obj:{...o,summary:v}}),true),field('标签',o.tagsText||'',v=>onChange({type:edit.type,obj:{...o,tagsText:v}}))):h('div',null,h('select',{style:{...S.select,width:'100%',marginTop:10},value:o.kind,onChange:e=>onChange({type:edit.type,obj:{...o,kind:e.target.value}})},...EDGE_KINDS.map(k=>h('option',{key:k,value:k},k))),field('关系说明',o.rationale||'',v=>onChange({type:edit.type,obj:{...o,rationale:v}}),true),field('置信度',String(o.confidence??.7),v=>onChange({type:edit.type,obj:{...o,confidence:v}}))),h('div',{style:S.actions},h('button',{style:S.btn,onClick:onSave},'保存'),h('button',{style:S.btn,onClick:onCancel},'取消'))) }
  exports.name = NS
  exports.inject = ['slots','layout']
  exports.apply = function apply(ctx) {
    ctx.slots.inject('sidebar.panellist',()=>ctx.slots.register({name:'sidebar.panellist',id:'hako-workspace',order:35,label:'工作区图谱'},()=>h(Icon,{size:18})))
    ctx.slots.inject('main',()=>ctx.slots.register({name:'main',key:'hako-workspace',id:'hako-workspace',label:'工作区图谱'},()=>h(Graph)))
  }
  return module.exports
}})
