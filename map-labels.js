/* FASE 3.0 — Una conexión visual por pareja + consulta de relaciones al pasar el mouse. */
(function(){
  const NS='http://www.w3.org/2000/svg';
  const pairKey=(a,b)=>[a,b].sort().join('|');
  const itemsOf=r=>Array.isArray(r?.items)&&r.items.length?r.items:[{label:r?.label||'otra relación',mode:r?.mode||'directed'}];
  const activeBook=()=>typeof active==='function'?active():null;
  const nameOf=id=>activeBook()?.characters?.find(c=>c.id===id)?.name||'?';
  const pairRelations=(a,b)=>(activeBook()?.relationships||[]).filter(r=>(r.from===a&&r.to===b)||(r.from===b&&r.to===a));
  const modeOf=r=>itemsOf(r).some(i=>i.mode==='symmetric')?'symmetric':'directed';
  const labelsOf=r=>itemsOf(r).map(i=>i.label).filter(Boolean).join(' · ')||'otra relación';

  function pairDirection(a,b,rels){
    let ab=false,ba=false;
    rels.forEach(r=>{
      if(modeOf(r)==='symmetric'){ab=true;ba=true;}
      else if(r.from===a&&r.to===b)ab=true;
      else if(r.from===b&&r.to===a)ba=true;
    });
    return ab&&ba?'both':ab?'forward':'reverse';
  }

  function ensureStartMarker(svg){
    let defs=svg.querySelector('defs');
    if(!defs){defs=document.createElementNS(NS,'defs');svg.insertBefore(defs,svg.firstChild);}
    if(defs.querySelector('#arrowHeadStart'))return;
    const m=document.createElementNS(NS,'marker');m.id='arrowHeadStart';m.setAttribute('viewBox','0 0 10 10');m.setAttribute('refX','8');m.setAttribute('refY','5');m.setAttribute('markerWidth','7');m.setAttribute('markerHeight','7');m.setAttribute('orient','auto-start-reverse');
    const p=document.createElementNS(NS,'path');p.setAttribute('d','M 0 0 L 10 5 L 0 10 z');p.setAttribute('fill','#687080');m.appendChild(p);defs.appendChild(m);
  }

  function relationArrow(r,a,b){
    if(modeOf(r)==='symmetric')return '↔';
    return r.from===a?'→':'←';
  }

  function showPairTooltip(a,b,e){
    const tip=document.getElementById('mapTooltip'),wrap=document.getElementById('mapWrap');
    const rels=pairRelations(a,b);if(!tip||!wrap||!rels.length)return;
    const rows=rels.map(r=>`<div class="map-relation-tooltip-row"><span class="map-relation-tooltip-arrow">${relationArrow(r,a,b)}</span><strong>${esc(labelsOf(r))}</strong></div>`).join('');
    tip.innerHTML=`<strong>${esc(nameOf(a))} ↔ ${esc(nameOf(b))}</strong><div class="map-relation-tooltip-title">Relaciones:</div>${rows}`;
    tip.classList.remove('hidden');
    const rect=wrap.getBoundingClientRect();
    const clientX=e?.clientX??rect.left+20,clientY=e?.clientY??rect.top+20;
    let x=clientX-rect.left+14,y=clientY-rect.top+14;
    x=Math.max(8,Math.min(Math.max(8,rect.width-270),x));
    y=Math.max(8,Math.min(Math.max(8,rect.height-120),y));
    tip.style.left=x+'px';tip.style.top=y+'px';
  }

  window.showMapPairRelations=showPairTooltip;

  function hideLabels(){document.querySelectorAll('#app svg .map-edge text,#app svg .network-edge text').forEach(t=>t.remove());}

  function addHitTarget(g){
    const line=g.querySelector('line');if(!line)return;
    let hit=g.querySelector('.map-edge-hit');
    if(!hit){
      hit=document.createElementNS(NS,'line');
      hit.setAttribute('class','map-edge-hit');
      hit.setAttribute('stroke','transparent');
      hit.setAttribute('stroke-width','18');
      hit.setAttribute('fill','none');
      hit.setAttribute('pointer-events','stroke');
      hit.style.pointerEvents='stroke';
      g.appendChild(hit);
    }
    ['x1','y1','x2','y2'].forEach(k=>hit.setAttribute(k,line.getAttribute(k)||''));
  }

  function wirePairGroup(g,a,b,rels){
    g.dataset.from=a;g.dataset.to=b;g.dataset.pairKey=pairKey(a,b);g.dataset.relIds=rels.map(r=>r.id).join(',');g.dataset.pairCollapsed='true';
    const line=g.querySelector('line');if(!line)return;
    const d=pairDirection(a,b,rels);line.removeAttribute('marker-start');line.removeAttribute('marker-end');
    if(d==='both'){line.setAttribute('marker-start','url(#arrowHeadStart)');line.setAttribute('marker-end','url(#arrowHead)');}
    else if(d==='forward')line.setAttribute('marker-end','url(#arrowHead)');
    else line.setAttribute('marker-start','url(#arrowHeadStart)');
    addHitTarget(g);
    g.style.cursor='help';
    g.addEventListener('mouseenter',e=>showPairTooltip(a,b,e));
    g.addEventListener('mousemove',e=>showPairTooltip(a,b,e));
    g.addEventListener('mouseleave',()=>hideNodeTooltip());
    g.addEventListener('touchstart',e=>{e.stopPropagation();showPairTooltip(a,b,e.touches[0]);setTimeout(hideNodeTooltip,3200)},{passive:true});
  }

  function collapsePairs(){
    const svg=document.getElementById('mapSvg'),b=activeBook();if(!svg||!b)return;
    ensureStartMarker(svg);hideLabels();

    const network=[...svg.querySelectorAll('.network-edge')];
    if(network.length){
      const byPair=new Map();
      network.forEach(g=>{const k=pairKey(g.dataset.from,g.dataset.to);if(!byPair.has(k))byPair.set(k,[]);byPair.get(k).push(g);});
      byPair.forEach((gs,k)=>{
        const [a,z]=k.split('|'),rels=pairRelations(a,z);if(!rels.length)return;
        const old=gs[0];
        if(gs.length===1&&old.dataset.pairCollapsed==='true'){wirePairGroup(old,a,z,rels);return;}
        const g=old.cloneNode(true);old.replaceWith(g);gs.slice(1).forEach(x=>x.remove());
        wirePairGroup(g,a,z,rels);
      });
    }else{
      const focusEdges=[...svg.querySelectorAll('.map-edge')];
      if(!focusEdges.length)return;
      const filtered=(typeof mapFilterData==='function'?mapFilterData(b):{rels:b.relationships||[]}).rels||[];
      const byPair=new Map();
      focusEdges.forEach((g,i)=>{
        if(g.dataset.pairCollapsed==='true')return;
        const r=filtered[i];
        if(!r)return;
        g.dataset.from=r.from;g.dataset.to=r.to;g.dataset.relId=r.id;
        const k=pairKey(r.from,r.to);
        if(!byPair.has(k))byPair.set(k,[]);byPair.get(k).push({g,r});
      });
      byPair.forEach((entries,k)=>{
        const [a,z]=k.split('|'),rels=pairRelations(a,z);if(!rels.length)return;
        const old=entries[0].g;
        const g=old.cloneNode(true);old.replaceWith(g);
        entries.slice(1).forEach(x=>x.g.remove());
        wirePairGroup(g,a,z,rels);
      });
    }
  }

  function styles(){
    if(document.getElementById('mapRelationInteractionStyles'))return;
    const s=document.createElement('style');s.id='mapRelationInteractionStyles';s.textContent=`.map-edge line,.network-edge line,.network-edge-hit,.map-edge-hit{cursor:help}.map-edge-hit{pointer-events:stroke!important}.map-relation-tooltip-title{margin-top:5px;font-weight:600}.map-relation-tooltip-row{display:flex;gap:7px;align-items:center;margin-top:3px}.map-relation-tooltip-arrow{display:inline-block;min-width:18px;font-weight:700}`;document.head.appendChild(s);
  }

  function apply(){styles();collapsePairs();hideLabels();}
  const original=window.renderMap;
  if(typeof original==='function')window.renderMap=function(){original.apply(this,arguments);setTimeout(apply,0);setTimeout(apply,120);setTimeout(apply,500);};
  const observer=new MutationObserver(()=>{if(document.getElementById('mapSvg')){clearTimeout(window.__mapRelationTimer);window.__mapRelationTimer=setTimeout(apply,30);}});
  const app=document.getElementById('app');if(app)observer.observe(app,{subtree:true,childList:true});
  styles();
})();