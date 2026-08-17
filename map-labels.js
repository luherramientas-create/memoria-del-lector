/* FASE 3.0 — Una conexión visual por pareja + consulta interactiva de relaciones. */
(function(){
  const NS='http://www.w3.org/2000/svg';
  const pairKey=(a,b)=>[a,b].sort().join('|');
  const itemsOf=r=>Array.isArray(r?.items)&&r.items.length?r.items:[{label:r?.label||'otra relación',mode:r?.mode||'directed'}];
  const modeOf=r=>itemsOf(r).some(i=>i.mode==='symmetric')?'symmetric':'directed';
  const activeBook=()=>typeof active==='function'?active():null;
  const nameOf=id=>activeBook()?.characters?.find(c=>c.id===id)?.name||'?';
  const pairRelations=(a,b)=>(activeBook()?.relationships||[]).filter(r=>(r.from===a&&r.to===b)||(r.from===b&&r.to===a));
  const labelsOf=r=>itemsOf(r).map(i=>i.label).filter(Boolean).join(' · ')||'otra relación';

  function pairDirection(a,b,rels){
    let ab=false,ba=false;
    rels.forEach(r=>{if(modeOf(r)==='symmetric'){ab=true;ba=true;}else if(r.from===a&&r.to===b)ab=true;else if(r.from===b&&r.to===a)ba=true;});
    return ab&&ba?'both':ab?'forward':'reverse';
  }

  function ensureStartMarker(svg){
    let defs=svg.querySelector('defs');
    if(!defs){defs=document.createElementNS(NS,'defs');svg.insertBefore(defs,svg.firstChild);}
    if(defs.querySelector('#arrowHeadStart'))return;
    const m=document.createElementNS(NS,'marker');m.id='arrowHeadStart';m.setAttribute('viewBox','0 0 10 10');m.setAttribute('refX','8');m.setAttribute('refY','5');m.setAttribute('markerWidth','7');m.setAttribute('markerHeight','7');m.setAttribute('orient','auto-start-reverse');
    const p=document.createElementNS(NS,'path');p.setAttribute('d','M 0 0 L 10 5 L 0 10 z');p.setAttribute('fill','#687080');m.appendChild(p);defs.appendChild(m);
  }

  function showPairRelations(a,b){
    const rels=pairRelations(a,b);if(!rels.length)return;
    const rows=rels.map(r=>{
      const arrow=modeOf(r)==='symmetric'?'↔':(r.from===a?'→':'←');
      return `<button class="map-relation-choice" onclick="selectMapRelation('${r.id}')"><span>${arrow}</span><strong>${esc(labelsOf(r))}</strong></button>`;
    }).join('');
    modal(`<h2>🔗 Relaciones</h2><div class="relationship"><span class="node">${esc(nameOf(a))}</span><span class="arrow">↔</span><span class="node">${esc(nameOf(b))}</span></div><p class="muted">Selecciona la relación que quieres consultar.</p><div class="map-relation-list">${rows}</div><div class="actions"><button class="secondary" onclick="close()">Cerrar</button></div>`);
  }

  window.showMapPairRelations=showPairRelations;
  window.selectMapRelation=function(id){
    const b=activeBook(),r=b?.relationships?.find(x=>x.id===id);if(!r)return;
    const arrow=modeOf(r)==='symmetric'?'↔':'→';
    const chapter=typeof hasKnownChapter==='function'&&hasKnownChapter(r.chapter)?`Capítulo ${esc(r.chapter)}`:'Capítulo desconocido';
    modal(`<h2>🔗 Relación</h2><div class="relationship"><span class="node">${esc(nameOf(r.from))}</span><span class="arrow">${arrow}</span><span class="node">${esc(nameOf(r.to))}</span></div><p><strong>${esc(labelsOf(r))}</strong></p><p class="muted">Descubierto: ${chapter}</p>${r.sessionId?'<p class="muted">Asociada a una sesión de lectura.</p>':''}<div class="actions"><button class="primary" onclick="editRelationship('${r.id}')">Editar relación</button>${r.sessionId?`<button class="secondary" onclick="viewSession('${r.sessionId}')">Ver sesión</button>`:''}<button class="secondary" onclick="showMapPairRelations('${r.from}','${r.to}')">Volver a relaciones</button></div>`);
  };

  function hideLabels(){document.querySelectorAll('#app svg .network-edge text').forEach(t=>t.remove());}

  function collapsePairs(){
    const svg=document.getElementById('mapSvg'),b=activeBook();if(!svg||!b)return;
    ensureStartMarker(svg);hideLabels();
    const groups=[...svg.querySelectorAll('.network-edge')],byPair=new Map();
    groups.forEach(g=>{const k=pairKey(g.dataset.from,g.dataset.to);if(!byPair.has(k))byPair.set(k,[]);byPair.get(k).push(g);});
    byPair.forEach((gs,k)=>{
      const [a,b]=k.split('|'),rels=pairRelations(a,b);if(!rels.length)return;
      const old=gs[0],g=old.cloneNode(true);g.dataset.from=a;g.dataset.to=b;g.dataset.pairKey=k;g.dataset.relIds=rels.map(r=>r.id).join(',');old.replaceWith(g);gs.slice(1).forEach(x=>x.remove());
      const line=g.querySelector('line');if(!line)return;
      const d=pairDirection(a,b,rels);line.removeAttribute('marker-start');line.removeAttribute('marker-end');
      if(d==='both'){line.setAttribute('marker-start','url(#arrowHeadStart)');line.setAttribute('marker-end','url(#arrowHead)');}
      else if(d==='forward')line.setAttribute('marker-end','url(#arrowHead)');
      else line.setAttribute('marker-start','url(#arrowHeadStart)');
      g.addEventListener('click',e=>{e.stopPropagation();showPairRelations(a,b);});
      g.addEventListener('touchstart',e=>{e.stopPropagation();showPairRelations(a,b);},{passive:true});
    });
  }

  function styles(){
    if(document.getElementById('mapRelationInteractionStyles'))return;
    const s=document.createElement('style');s.id='mapRelationInteractionStyles';s.textContent=`.network-edge line:first-child,.network-edge-hit{cursor:pointer}.map-relation-list{display:flex;flex-direction:column;gap:8px;margin:12px 0}.map-relation-choice{display:flex;align-items:center;gap:8px;width:100%;text-align:left;border:1px solid rgba(91,75,138,.18);border-radius:10px;background:#f7f4ff;padding:10px 12px;cursor:pointer;color:inherit}.map-relation-choice:hover{background:#eee8ff}`;document.head.appendChild(s);
  }

  function apply(){styles();collapsePairs();}
  const original=window.renderMap;
  if(typeof original==='function')window.renderMap=function(){original.apply(this,arguments);setTimeout(apply,0);setTimeout(apply,120);setTimeout(apply,500);};
  const observer=new MutationObserver(()=>{if(document.getElementById('mapSvg')){clearTimeout(window.__mapRelationTimer);window.__mapRelationTimer=setTimeout(apply,30);}});
  const app=document.getElementById('app');if(app)observer.observe(app,{subtree:true,childList:true});
  styles();
})();
