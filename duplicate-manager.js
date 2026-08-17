// Safe duplicate-character diagnostics and merge manager.
(function(){
  const MERGE_BACKUP_KEY='memoriaLector.preMergeBackup';
  const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('es').replace(/\s+/g,' ');
  const relFor=(b,id)=>(b.relationships||[]).filter(r=>r.from===id||r.to===id);
  const sessionsFor=(b,id)=>(b.sessions||[]).filter(s=>(s.characterIds||[]).includes(id));
  const quoteRefsFor=(b,id)=>(b.quotes||[]).filter(q=>q.characterId===id||q.characterIds?.includes?.(id));
  const directedKey=(r)=>`${r.from}→${r.to}::${normalize((r.items||[])[0]?.label||r.label||'')}::${((r.items||[])[0]?.mode||r.mode||'directed')}`;
  const relationKey=(r)=>{const item=(r.items||[])[0]||{};const label=normalize(item.label||r.label||'');const mode=item.mode||r.mode||'directed';if(mode==='symmetric'){const ends=[String(r.from),String(r.to)].sort();return `${ends[0]}↔${ends[1]}::${label}::symmetric`;}return `${r.from}→${r.to}::${label}::directed`;};
  const relMode=r=>((r.items||[]).some(i=>i.mode==='symmetric')?'symmetric':((r.items||[])[0]?.mode||r.mode||'directed'));
  const relItems=r=>Array.isArray(r.items)&&r.items.length?r.items:[{label:r.label||'otra relación',mode:r.mode||'directed',category:'Otra'}];
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
    modal(`<h2>🔗 Fusionar personajes</h2><div class="notice"><strong>⚠️ Esta operación modifica datos.</strong><br>Primero se creará un backup completo. La fusión no se ejecutará hasta confirmar.</div><form onsubmit="mergeCharacters(event,'${aid}','${bid}')"><div class="field"><label>Personaje que se conservará</label><div class="check-grid"><label class="check-option"><input type="radio" name="keep" value="${aid}" checked onchange="setMergeSource('${aid}')"> ${esc(a.name)}</label><label class="check-option"><input type="radio" name="keep" value="${bid}" onchange="setMergeSource('${bid}')"> ${esc(z.name)}</label></div></div><div class="grid"><div class="field"><label>Nombre final</label><input name="name" value="${esc(a.name||z.name||'')}" required></div><div class="field"><label>Nombre corto final</label><input name="shortName" value="${esc(a.shortName||z.shortName||'')}"></div></div><div class="field"><label>Descripción final</label><textarea name="description">${esc(a.description||z.description||'')}</textarea></div><div class="field"><label>Primera aparición final</label><input name="firstChapter" type="number" min="0" value="${esc(a.firstChapter||z.firstChapter||'')}"></div><div class="hint">Se actualizarán referencias en relaciones, sesiones y fragmentos. Las relaciones se comparan por extremos + etiqueta + dirección; las simétricas son independientes del orden. Los IDs supervivientes se conservan.</div><div class="field"><label>Confirmación</label><select name="confirm"><option value="no">No fusionar</option><option value="yes">Sí, fusionar</option></select></div><button class="primary">Fusionar personajes</button></form>`);
  };
  function replaceInValue(v,from,to){return v===from?to:v}
  function updateArrayIds(arr,from,to){return Array.isArray(arr)?[...new Set(arr.map(x=>replaceInValue(x,from,to)).filter(Boolean))]:arr}

  function validateState(b){
    const charIds=new Set((b.characters||[]).map(c=>c.id));
    const relIds=new Set((b.relationships||[]).map(r=>r.id));
    for(const r of (b.relationships||[])){
      if(!r.from||!r.to||r.from===r.to||!charIds.has(r.from)||!charIds.has(r.to))return false;
      const items=relItems(r);
      if(!items.length||items.some(i=>!String(i.label||'').trim()||!['directed','symmetric'].includes(i.mode||'directed')))return false;
    }
    for(const s of (b.sessions||[])){
      if((s.characterIds||[]).some(id=>!charIds.has(id)))return false;
      if((s.relationshipIds||[]).some(id=>!relIds.has(id)))return false;
    }
    for(const q of (b.quotes||[])){
      if(q.characterId&&!charIds.has(q.characterId))return false;
      if(Array.isArray(q.characterIds)&&q.characterIds.some(id=>!charIds.has(id)))return false;
    }
    return true;
  }

  function mergeCharacters(e,aid,bid){
    e.preventDefault();
    const f=new FormData(e.target);
    if(f.get('confirm')!=='yes'){toast('Fusión cancelada');return;}
    const b=active(),a=b?.characters?.find(c=>c.id===aid),z=b?.characters?.find(c=>c.id===bid);
    if(!b||!a||!z||aid===bid){toast('No se pudo iniciar la fusión');return;}
    const keepId=f.get('keep'),removeId=keepId===aid?bid:aid,keep=b.characters.find(c=>c.id===keepId),remove=b.characters.find(c=>c.id===removeId);
    if(!keep||!remove)return;
    const original=JSON.stringify(state);
    try{
      localStorage.setItem(MERGE_BACKUP_KEY,JSON.stringify({savedAt:new Date().toISOString(),data:JSON.parse(original)}));

      keep.name=String(f.get('name')||keep.name||remove.name).trim();
      keep.shortName=String(f.get('shortName')||keep.shortName||remove.shortName||'').trim();
      keep.description=String(f.get('description')||keep.description||remove.description||'').trim();
      keep.firstChapter=f.get('firstChapter')||keep.firstChapter||remove.firstChapter||'';
      if(remove.discoveryPoint&&!keep.discoveryPoint)keep.discoveryPoint=remove.discoveryPoint;
      if(remove.sessionId&&!keep.sessionId)keep.sessionId=remove.sessionId;

      // Build old relationship -> surviving relationship map while preserving
      // distinct directed/symmetric labels and relationship IDs.
      const relationshipIdMap=new Map();
      const rels=[];
      const keyToRel=new Map();
      for(const originalRel of (b.relationships||[])){
        const nr={...originalRel,from:replaceInValue(originalRel.from,removeId,keepId),to:replaceInValue(originalRel.to,removeId,keepId),items:relItems(originalRel).map(x=>({...x})),types:Array.isArray(originalRel.types)?[...originalRel.types]:undefined};
        if(nr.from===nr.to){
          relationshipIdMap.set(originalRel.id,null);
          continue;
        }
        const key=relationKey(nr);
        const existing=keyToRel.get(key);
        if(!existing){
          rels.push(nr);
          keyToRel.set(key,nr);
          relationshipIdMap.set(originalRel.id,nr.id);
          continue;
        }
        // Same logical relationship after the endpoint replacement.
        // Keep the first ID and merge distinct items without collapsing
        // different labels/modes.
        const existingLabels=new Set(existing.items.map(i=>`${normalize(i.label)}::${i.mode||'directed'}`));
        nr.items.forEach(item=>{
          const ik=`${normalize(item.label)}::${item.mode||'directed'}`;
          if(!existingLabels.has(ik)){existing.items.push(item);existingLabels.add(ik);}
        });
        existing.types=existing.items.map(i=>i.label);
        const chapters=[existing.chapter,nr.chapter].map(v=>parseInt(v,10)).filter(Number.isFinite);
        if(chapters.length)existing.chapter=String(Math.min(...chapters));
        if(!existing.discoveryPoint&&nr.discoveryPoint)existing.discoveryPoint=nr.discoveryPoint;
        relationshipIdMap.set(originalRel.id,existing.id);
      }
      b.relationships=rels;

      // Every session must point to the surviving character and surviving
      // relationship IDs. Removed self-relations disappear from sessions.
      (b.sessions||[]).forEach(s=>{
        s.characterIds=updateArrayIds(s.characterIds,removeId,keepId);
        if(Array.isArray(s.participantIds))s.participantIds=updateArrayIds(s.participantIds,removeId,keepId);
        if(Array.isArray(s.relationshipIds)){
          s.relationshipIds=[...new Set(s.relationshipIds.map(id=>relationshipIdMap.has(id)?relationshipIdMap.get(id):id).filter(id=>id&&rels.some(r=>r.id===id)))];
        }
      });

      // Update quote/fragment references without assuming one schema.
      (b.quotes||[]).forEach(q=>{
        if(q.characterId===removeId)q.characterId=keepId;
        if(Array.isArray(q.characterIds))q.characterIds=updateArrayIds(q.characterIds,removeId,keepId);
      });

      b.characters=b.characters.filter(c=>c.id!==removeId);
      if(typeof mapState!=='undefined'){
        if(mapState.focus===removeId)mapState.focus=keepId;
        if(mapState.networkSelected===removeId)mapState.networkSelected=keepId;
      }

      if(!validateState(b))throw new Error('La validación de integridad falló; se restaurará el estado original.');
      save();
      close();
      renderCharacters();
      toast(`${keep.name} quedó como personaje conservado`);
      console.info('Fusión completada y validada. Backup:',MERGE_BACKUP_KEY,'Relaciones finales:',b.relationships.length);
    }catch(err){
      try{const backup=JSON.parse(localStorage.getItem(MERGE_BACKUP_KEY)||'null');if(backup?.data){state=backup.data;save();}}catch(_){state=JSON.parse(original);try{save()}catch(__){}}
      console.error(err);toast('La fusión falló. Los datos anteriores fueron restaurados.');
    }
  }
  window.mergeCharacters=mergeCharacters;
  window.setMergeSource=function(id){const b=active(),c=b.characters.find(x=>x.id===id);if(!c)return;const form=document.querySelector('#modalBody form');if(!form)return;['name','shortName','description','firstChapter'].forEach(k=>{const el=form.elements[k];if(el)el.value=c[k]||''})};
})();
