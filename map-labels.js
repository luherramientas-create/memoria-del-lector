/* Oculta las etiquetas de relaciones y corrige la flecha inicial de relaciones simétricas. */
(function(){
  const norm=s=>String(s||'').trim().toLocaleLowerCase('es');
  function relationLabels(){
    const labels=new Set();
    try{
      const books=window.state?.books || (typeof state!=='undefined' ? state.books : []);
      for(const b of books||[]){
        for(const r of b.relationships||[]){
          for(const it of r.items||[]){ if(it.label) labels.add(norm(it.label)); }
          for(const t of r.types||[]){ if(t) labels.add(norm(t)); }
        }
      }
    }catch(e){}
    return labels;
  }
  function hideRelationLabels(){
    const labels=relationLabels();
    document.querySelectorAll('#app svg text').forEach(el=>{
      const text=norm(el.textContent);
      if(!text)return;
      const isChapter=/\bcap\.\s*\?\b|\bcapítulo\s+\?\b|\bcap\.\s*\d+/i.test(text);
      const isRelation=[...labels].some(label=>label && (text===label || text.startsWith(label+' ·') || text.includes(' · '+label) || text===label+'…'));
      if(isChapter||isRelation){
        el.style.display='none';
        el.setAttribute('data-hidden-map-relation-label','true');
      }
    });
  }
  function fixSymmetricArrows(){
    try{
      const b=typeof state!=='undefined' ? state.books?.find(x=>x.id===state.activeBookId) : null;
      if(!b || typeof mapFilterData!=='function')return;
      const filtered=mapFilterData(b), rels=filtered?.rels||[];
      const svg=document.getElementById('mapSvg');
      if(!svg)return;
      let defs=svg.querySelector('defs');
      if(!defs){defs=document.createElementNS('http://www.w3.org/2000/svg','defs');svg.insertBefore(defs,svg.firstChild)}
      let startMarker=defs.querySelector('#arrowHeadStart');
      if(!startMarker){
        startMarker=document.createElementNS('http://www.w3.org/2000/svg','marker');
        startMarker.setAttribute('id','arrowHeadStart');
        startMarker.setAttribute('viewBox','0 0 10 10');
        startMarker.setAttribute('refX','8');
        startMarker.setAttribute('refY','5');
        startMarker.setAttribute('markerWidth','7');
        startMarker.setAttribute('markerHeight','7');
        startMarker.setAttribute('orient','auto-start-reverse');
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d','M 0 0 L 10 5 L 0 10 z');
        path.setAttribute('fill','#687080');
        startMarker.appendChild(path);defs.appendChild(startMarker);
      }
      const edges=[...svg.querySelectorAll('.map-edge')];
      edges.forEach((g,i)=>{
        const r=rels[i];if(!r)return;
        const items=r.items||[];
        const hasSym=items.some(x=>x.mode==='symmetric');
        const hasDir=items.some(x=>x.mode==='directed');
        const line=g.querySelector('line');if(!line)return;
        if(hasSym&&!hasDir)line.setAttribute('marker-start','url(#arrowHeadStart)');
        else line.removeAttribute('marker-start');
      });
    }catch(e){}
  }
  const observer=new MutationObserver(()=>{hideRelationLabels();fixSymmetricArrows()});
  function start(){
    const app=document.getElementById('app');
    if(app)observer.observe(app,{subtree:true,childList:true});
    hideRelationLabels();fixSymmetricArrows();
    setTimeout(()=>{hideRelationLabels();fixSymmetricArrows()},100);
    setTimeout(()=>{hideRelationLabels();fixSymmetricArrows()},500);
    setTimeout(()=>{hideRelationLabels();fixSymmetricArrows()},1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
