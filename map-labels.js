/* Oculta las etiquetas de relaciones del mapa sin ocultar los nombres de los nodos. */
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
  const observer=new MutationObserver(()=>hideRelationLabels());
  function start(){
    const app=document.getElementById('app');
    if(app)observer.observe(app,{subtree:true,childList:true});
    hideRelationLabels();
    setTimeout(hideRelationLabels,100);
    setTimeout(hideRelationLabels,500);
    setTimeout(hideRelationLabels,1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
