// Safe duplicate-character diagnostics and merge manager.
// Loaded after app.js so it can reuse the existing state/model/UI helpers.
(function(){
  const MERGE_BACKUP_KEY='memoriaLector.preMergeBackup';
  const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('es').replace(/\s+/g,' ');
  const relFor=(b,id)=>(b.relationships||[]).filter(r=>r.from===id||r.to===id);
  const sessionsFor=(b,id)=>(b.sessions||[]).filter(s=>(s.characterIds||[]).includes(id));
  const quoteRefsFor=(b,id)=>(b.quotes||[]).filter(q=>q.characterId===id||q.characterIds?.includes?.(id));
  function groups(){
    const b=active(),m=new Map();
    (b?.characters||[]).forEach(c=>{
      const k=normalize(c.name);
      if(!k)return;
      if(!m.has(k))m.set(k,[]);m.get(k).push(c);
    });
    return [...m.values()].filter(g=>g.length>1);
  }
  function summary(c,b){return `<div class="card"><h3>${esc(c.name||'?')}</h3><div class="muted">ID: ${esc(c.id)}</div><p><strong>Nombre corto:</strong> ${esc(c.shortName||'—')}</p><p><strong>Descripción:</strong> ${esc(c.description||'—')}</p><p><strong>Primera aparición:</strong> ${esc(c.firstChapter||'?')}</p><div><span class="tag">${relFor(b,c.id).length} relación(es)</span> <span class="tag">${sessionsFor(b,c.id).length} sesión(es)</span> <span class="tag">${quoteRefsFor(b,c.id).length} fragmento(s)</span></div></div>`}
  window.characterDuplicateDiagnostics=function(){
    const b=active(),gs=groups();
    if(!gs.length){modal('<h2>🔍 Revisar personajes duplicados</h2><div class="empty">No se encontraron posibles duplicados por nombre.</div><div class="actions"><button class="secondary" onclick="close()">Cerrar</button></div>');return;}
    const html=gs.map((g,i)=>`<div class="item"><h3>⚠️ Posible duplicado ${i+1}</h3><div class="grid">${g.map(c=>summary(c,b)).join('')}</div><div class="actions"><button class="secondary" onclick="compareCharacters('${g[0].id}','${g[1].id}')">Comparar</button><button class="primary" onclick="openCharacterMerge('${g[0].id}','${g[1].id}')">Fusionar</button></div></div>`).join('');
    modal(`<h2>🔍 Revisar personajes duplicados</h2><p class="muted">Se comparan nombres normalizados. Ningún personaje se fusiona automáticamente.</p><div class="list">${html}</div><div class="actions"><button class="secondary" onclick="close()">Cerrar</button></div>`);
  };
  window.compareCharacters=function(aid,bid){
    const b=active(),a=b.characters.find(c=>c.id===aid),z=b.characters.find(c=>c.id===bid);if(!a||!z)return;
    modal(`<h2>Comparar personajes</h2><div class="grid">${summary(a,b)}${summary(z,b)}</div><div class="actions"><button class="primary" onclick="openCharacterMerge('${aid}','${bid}')">Fusionar estos registros</button><button class="secondary" onclick="characterDuplicateDiagnostics()">Volver</button></div>`);
  };
  window.openCharacterMerge=function(aid,bid){
    const b=active(),a=b.characters.find(c=>c.id===aid),z=b.characters.find(c=>c.id===bid);if(!a||!z)return;
    modal(`<h2>🔗 Fusionar personajes</h2><div class="notice"><strong>⚠️ Esta operación modifica datos.</strong><br>Primero se creará un backup completo. La fusión no se ejecutará hasta confirmar.</div><form onsubmit="mergeCharacters(event,'${aid}','${bid}')"><div class="field"><label>Personaje que se conservará</label><div class="check-grid"><label class="check-option"><input type="radio" name="keep" value="${aid}" checked onchange="setMergeSource('${aid}')"> ${esc(a.name)}</label><label class="check-option"><input type="radio" name="keep" value="${bid}" onchange="setMergeSource('${bid}')"> ${esc(z.name)}</label></div></div><div class="grid"><div class="field"><label>Nombre final</label><input name="name" value="${esc(a.name||z.name||'')}" required></div><div class="field"><label>Nombre corto final</label><input name="shortName" value="${esc(a.shortName||z.shortName||'')}"></div></div><div class="field"><label>Descripción final</label><textarea name="description">${esc(a.description||z.description||'')}</textarea></div><div class="field"><label>Primera aparición final</label><input name="firstChapter" type="number" min="0" value="${esc(a.firstChapter||z.firstChapter||'')}"></div><div class="hint">Se actualizarán referencias en relaciones, sesiones y fragmentos. Los IDs de las relaciones se conservarán siempre que sea posible.</div><div class="field"><label>Confirmación</label><select name="confirm"><option value="no">No fusionar</option><option value="yes">Sí, fusionar</option></select></div><button class="primary">Fusionar personajes</button></form>`);
  };
  function replaceInValue(v,from,to){return v===from?to:v}
  function updateArrayIds(arr,from,to){return Array.isArray(arr)?[...new Set(arr.map(x=>replaceInValue(x,from,to)).filter(Boolean))]:arr}
  function relationSignature(r){return `${r.from}→${r.to}`}
  function mergeCharacters(e,aid,bid){
    e.preventDefault();const f=new FormData(e.target);if(f.get('confirm')!=='yes'){toast('Fusión cancelada');return;}
    const b=active(),a=b.characters.find(c=>c.id===aid),z=b.characters.find(c=>c.id===bid);if(!a||!z)return;
    const keepId=f.get('keep'),removeId=keepId===aid?bid:aid,keep=b.characters.find(c=>c.id===keepId),remove=b.characters.find(c=>c.id===removeId);if(!keep||!remove)return;
    try{
      localStorage.setItem(MERGE_BACKUP_KEY,JSON.stringify({savedAt:new Date().toISOString(),data:state}));
      const beforeRelationships=JSON.stringify(b.relationships||[]);
      keep.name=String(f.get('name')||keep.name||remove.name).trim();
      keep.shortName=String(f.get('shortName')||keep.shortName||remove.shortName||'').trim();
      keep.description=String(f.get('description')||keep.description||remove.description||'').trim();
      keep.firstChapter=f.get('firstChapter')||keep.firstChapter||remove.firstChapter||'';
      if(remove.discoveryPoint&&!keep.discoveryPoint)keep.discoveryPoint=remove.discoveryPoint;
      if(remove.sessionId&&!keep.sessionId)keep.sessionId=remove.sessionId;

      // Update relationship endpoints while preserving relationship IDs.
      const rels=[];
      for(const r of (b.relationships||[])){
        const nr={...r,from:replaceInValue(r.from,removeId,keepId),to:replaceInValue(r.to,removeId,keepId),items:Array.isArray(r.items)?r.items.map(x=>({...x})):[]};
        if(nr.from===nr.to)continue;
        const same=rels.find(x=>relationSignature(x)===relationSignature(nr));
        if(!same){rels.push(nr);continue;}
        const labels=new Map((same.items||[]).map(i=>[normalize(i.label),i]));
        (nr.items||[]).forEach(i=>{const k=normalize(i.label);if(!labels.has(k)){same.items.push(i);labels.set(k,i)}});
        same.types=(same.items||[]).map(i=>i.label);
        const chapters=[same.chapter,nr.chapter].map(v=>parseInt(v,10)).filter(Number.isFinite);if(chapters.length)same.chapter=String(Math.min(...chapters));
        if(!same.discoveryPoint&&nr.discoveryPoint)same.discoveryPoint=nr.discoveryPoint;
        // Preserve an existing relationship ID; do not manufacture a new one.
        if(!same.sessionId&&nr.sessionId)same.sessionId=nr.sessionId;
      }
      b.relationships=rels;

      // Update every known session reference to the surviving character.
      (b.sessions||[]).forEach(s=>{
        s.characterIds=updateArrayIds(s.characterIds,removeId,keepId);
        if(Array.isArray(s.participantIds))s.participantIds=updateArrayIds(s.participantIds,removeId,keepId);
      });

      // Update possible quote references without assuming a single quote schema.
      (b.quotes||[]).forEach(q=>{
        if(q.characterId===removeId)q.characterId=keepId;
        if(Array.isArray(q.characterIds))q.characterIds=updateArrayIds(q.characterIds,removeId,keepId);
      });

      b.characters=b.characters.filter(c=>c.id!==removeId);
      if(typeof mapState!=='undefined'){
        if(mapState.focus===removeId)mapState.focus=keepId;
        if(mapState.networkSelected===removeId)mapState.networkSelected=keepId;
      }
      save();
      close();
      renderCharacters();
      toast(`${keep.name} quedó como personaje conservado`);
      // Keep backup until the user explicitly confirms the library is correct.
      console.info('Fusión completada. Backup disponible en',MERGE_BACKUP_KEY,'Relaciones antes:',JSON.parse(beforeRelationships).length,'después:',b.relationships.length);
    }catch(err){
      try{
        const raw=localStorage.getItem(MERGE_BACKUP_KEY);if(raw){const backup=JSON.parse(raw);state=backup.data;save();}
      }catch(_){ }
      console.error(err);toast('La fusión falló. Los datos anteriores fueron restaurados.');
    }
  }
  window.mergeCharacters=mergeCharacters;
  window.setMergeSource=function(id){const b=active(),c=b.characters.find(x=>x.id===id);if(!c)return;const form=document.querySelector('#modalBody form');if(!form)return;['name','shortName','description','firstChapter'].forEach(k=>{const el=form.elements[k];if(el)el.value=c[k]||''})};
})();
