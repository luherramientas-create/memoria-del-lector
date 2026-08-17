// Session manager V2.4: create + safe edit sessions, stable typing, free-form relations, explicit direction.
(function(){
  const draft={characters:[],relations:[]};
  const editDraft={sessionId:null,chapter:'',page:'',summary:'',note:'',characters:[],relations:[]};

  // Internal dependency adapter: delegates to the existing global implementations.
  // No business logic is duplicated and no global API is removed.
  const api={
    active:(...args)=>active(...args),
    save:(...args)=>save(...args),
    uid:(...args)=>uid(...args),
    modal:(...args)=>modal(...args),
    close:(...args)=>close(...args),
    toast:(...args)=>toast(...args),
    esc:(...args)=>esc(...args),
    inferRel:(...args)=>inferRel(...args),
    relationshipLabelNormalize:(...args)=>relationshipLabelNormalize(...args),
    relationshipExists:(...args)=>relationshipExists(...args),
    normalizeCharacterText:(...args)=>normalizeCharacterText(...args),
    renderSessions:(...args)=>renderSessions(...args)
  };

  const book=()=>api.active();
  const relationLabel=r=>(r.items||[]).map(i=>i.label).join(' · ')||'otra relación';
  const relationArrow=r=>{const sym=(r.items||[]).some(i=>i.mode==='symmetric'),dir=(r.items||[]).some(i=>i.mode==='directed');return sym&&!dir?'↔':'→'};
  const catalogInfo=label=>api.inferRel(label);
  const normalizeLabel=v=>api.relationshipLabelNormalize(v);
  function resetDraft(){draft.characters=[];draft.relations=[]}
  function resetEditDraft(){Object.assign(editDraft,{sessionId:null,chapter:'',page:'',summary:'',note:'',characters:[],relations:[]})}
  function getDraftContext(){return editDraft.sessionId?editDraft:draft}
  function allDraftCharacters(){const b=book(),ctx=getDraftContext();return [...(b?.characters||[]),...(ctx.characters||[]).filter(c=>c.name.trim())]}

  function relationSuggestions(ctx){
    const types=typeof relTypes!=='undefined'?relTypes:[];
    const custom=(ctx?.relations||[]).map(r=>String(r.label||'').trim()).filter(Boolean);
    return [...new Set([...types,...custom].map(x=>String(x).trim()).filter(Boolean))];
  }
  function relationTypesMarkup(ctx){return relationSuggestions(ctx).map(x=>`<option value="${api.esc(x)}"></option>`).join('')}
  function relationModeForLabel(label){const info=catalogInfo(label);return {mode:info?.mode||'directed',category:info?.category||'Otra'}}
  function updateRelationModeFromLabel(r,label){if(r.modeManuallySet)return;r.mode=relationModeForLabel(label).mode}
  function characterOptions(selected,ctx){
    const b=book();
    const all=[...(b?.characters||[]),...(ctx?.characters||[]).filter(c=>c.name.trim())];
    const seen=new Set();
    return `<option value="">Seleccionar…</option>`+all.filter(c=>{if(seen.has(c.id))return false;seen.add(c.id);return true}).map(c=>`<option value="${api.esc(c.id)}" ${c.id===selected?'selected':''}>${api.esc(c.name)}</option>`).join('');
  }

  function openSessionForm(title,ctx,onsubmit,sessionId){
    api.modal(`<h2>📖 ${title}</h2><form id="sessionV2Form" onsubmit="${onsubmit}">
      <div class="grid"><div class="field"><label>Capítulo</label><input name="chapter" type="number" min="0" value="${api.esc(ctx.chapter)}" required></div><div class="field"><label>Página</label><input name="page" type="number" min="0" value="${api.esc(ctx.page)}"></div></div>
      <div class="field"><label>📖 Trama</label><textarea name="summary" placeholder="¿Qué ocurre en este capítulo?">${api.esc(ctx.summary)}</textarea></div>
      <div class="field"><label>💭 Mi impresión</label><textarea name="note">${api.esc(ctx.note)}</textarea></div>
      <hr>
      <div class="section-title"><div><h3>👥 Personajes descubiertos</h3><div class="muted">Puedes agregar varios sin perder el foco al escribir.</div></div><button type="button" class="secondary" onclick="sessionAddCharacter()">+ Personaje</button></div>
      <div id="sessionCharacters" class="list"><div class="muted">Aún no has agregado personajes.</div></div>
      <hr>
      <div class="section-title"><div><h3>🔗 Relaciones descubiertas</h3><div class="muted">Escribe una relación nueva o usa una sugerencia; luego elige → o ↔.</div></div><button type="button" class="secondary" onclick="sessionAddRelation()">+ Relación</button></div>
      <div id="sessionRelations" class="list"><div class="muted">Aún no has agregado relaciones.</div></div>
      <div class="actions"><button type="button" class="secondary" onclick="closeSessionEditor()">Cancelar</button><button class="primary">${sessionId?'Guardar cambios':'Guardar sesión'}</button></div>
    </form>`);
    renderDraft();
  }

  function newSession(){
    resetDraft();
    openSessionForm('Nueva sesión de lectura',draft,'createSession(event)',null);
  }

  function editSession(id){
    const b=book(),s=b?.sessions?.find(x=>x.id===id);
    if(!b||!s){api.toast('No se encontró la sesión.');return}
    resetEditDraft();
    editDraft.sessionId=s.id;
    editDraft.chapter=s.chapter??'';
    editDraft.page=s.page??'';
    editDraft.summary=s.summary??s.plot??'';
    editDraft.note=s.note??s.impression??'';
    editDraft.characters=(s.characterIds||[]).map(cid=>{
      const c=b.characters.find(x=>x.id===cid);
      return c?{id:c.id,name:c.name||'',shortName:c.shortName||'',description:c.description||'',firstChapter:c.firstChapter??''}:null;
    }).filter(Boolean);
    editDraft.relations=(s.relationshipIds||[]).map(rid=>{
      const r=b.relationships.find(x=>x.id===rid);
      if(!r)return null;
      const item=(r.items||[])[0]||{};
      return {id:r.id,originalId:r.id,from:r.from||'',to:r.to||'',label:item.label||relationLabel(r),mode:item.mode||'directed',modeManuallySet:true,chapter:r.chapter??s.chapter??'',category:item.category||'Otra'};
    }).filter(Boolean);
    openSessionForm('Editar sesión de lectura',editDraft,'updateSession(event)',s.id);
  }

  function closeSessionEditor(){resetDraft();resetEditDraft();api.close()}

  function currentFormChapter(){return document.querySelector('#sessionV2Form [name=chapter]')?.value||''}
  function currentContext(){return editDraft.sessionId?editDraft:draft}

  function sessionAddCharacter(){
    const b=book(); if(!b)return;
    const ctx=currentContext();
    const id='draftc_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    ctx.characters.push({id,name:'',shortName:'',description:'',firstChapter:currentFormChapter()});
    renderDraft();
    setTimeout(()=>document.querySelector(`#sessionCharacters [data-draft-id="${id}"]`)?.focus(),0);
  }

  function sessionRemoveCharacter(id){
    const ctx=currentContext();
    ctx.characters=ctx.characters.filter(c=>c.id!==id);
    ctx.relations=ctx.relations.filter(r=>r.from!==id&&r.to!==id);
    renderDraft();
  }

  function sessionAddRelation(){
    const b=book(),ctx=currentContext();
    const all=allDraftCharacters();
    if(all.length<2){api.toast('Primero agrega o selecciona al menos dos personajes.');return}
    ctx.relations.push({id:'draftr_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),originalId:null,from:all[0]?.id||'',to:all[1]?.id||'',label:'',mode:'directed',modeManuallySet:false,chapter:currentFormChapter(),category:'Otra'});
    renderDraft();
  }

  function sessionRemoveRelation(id){const ctx=currentContext();ctx.relations=ctx.relations.filter(r=>r.id!==id);renderDraft()}

  function renderDraft(){
    const cc=document.getElementById('sessionCharacters'),rr=document.getElementById('sessionRelations');
    if(!cc||!rr)return;
    const ctx=currentContext();
    const activeEl=document.activeElement;
    const activeId=activeEl?.dataset?.draftId||'';
    const activeStart=activeEl?.selectionStart;
    const activeEnd=activeEl?.selectionEnd;
    cc.innerHTML=ctx.characters.length?ctx.characters.map(c=>`<div class="card session-draft-character"><div class="grid"><div class="field"><label>Nombre completo</label><input data-draft-id="${api.esc(c.id)}" value="${api.esc(c.name)}" oninput="sessionUpdateCharacter('${c.id}','name',this.value)" required></div><div class="field"><label>Nombre corto <span class="muted">(opcional)</span></label><input value="${api.esc(c.shortName)}" oninput="sessionUpdateCharacter('${c.id}','shortName',this.value)"></div></div><div class="field"><label>Descripción</label><textarea oninput="sessionUpdateCharacter('${c.id}','description',this.value)">${api.esc(c.description)}</textarea></div><button type="button" class="danger" onclick="sessionRemoveCharacter('${c.id}')">Eliminar de esta sesión</button></div>`).join(''):'<div class="muted">Aún no has agregado personajes.</div>';
    rr.innerHTML=ctx.relations.length?ctx.relations.map(r=>{
      const catalog=relationModeForLabel(r.label),checkedDir=r.mode!=='symmetric',checkedSym=r.mode==='symmetric';
      return `<div class="card session-draft-relation"><div class="grid"><div class="field"><label>Personaje A</label><select onchange="sessionUpdateRelation('${r.id}','from',this.value)">${characterOptions(r.from,ctx)}</select></div><div class="field"><label>Personaje B</label><select onchange="sessionUpdateRelation('${r.id}','to',this.value)">${characterOptions(r.to,ctx)}</select></div></div><div class="grid"><div class="field"><label>Relación</label><input list="sessionRelationshipSuggestions" value="${api.esc(r.label)}" placeholder="Escribe o selecciona una relación…" oninput="sessionUpdateRelation('${r.id}','label',this.value)"></div><div class="field"><label>Dirección</label><div class="seg"><button type="button" class="${checkedDir?'active':''}" onclick="sessionSetRelationMode('${r.id}','directed')">→ Dirigida</button><button type="button" class="${checkedSym?'active':''}" onclick="sessionSetRelationMode('${r.id}','symmetric')">↔ Simétrica</button></div></div></div><div class="grid"><div class="field"><label>Capítulo descubierto</label><input type="number" min="0" value="${api.esc(r.chapter??currentFormChapter())}" disabled></div><div class="field"><label>Categoría</label><input value="${api.esc(r.category||catalog.category||'Otra')}" disabled></div></div><button type="button" class="danger" onclick="sessionRemoveRelation('${r.id}')">Eliminar relación</button></div>`;
    }).join(''):'<div class="muted">Aún no has agregado relaciones.</div>';
    let dl=document.getElementById('sessionRelationshipSuggestions');
    if(!dl){dl=document.createElement('datalist');dl.id='sessionRelationshipSuggestions';document.getElementById('sessionV2Form')?.appendChild(dl)}
    dl.innerHTML=relationTypesMarkup(ctx);
    if(activeId){
      const el=document.querySelector(`#sessionCharacters [data-draft-id="${activeId}"]`);
      if(el){el.focus();if(typeof activeStart==='number')el.setSelectionRange(activeStart,typeof activeEnd==='number'?activeEnd:activeStart)}
    }
  }

  function sessionUpdateCharacter(id,key,value){const ctx=currentContext(),c=ctx.characters.find(x=>x.id===id);if(c)c[key]=value}
  function sessionUpdateRelation(id,key,value){const ctx=currentContext(),r=ctx.relations.find(x=>x.id===id);if(!r)return;r[key]=value;if(key==='label')updateRelationModeFromLabel(r,value)}
  function sessionSetRelationMode(id,mode){const ctx=currentContext(),r=ctx.relations.find(x=>x.id===id);if(!r)return;r.mode=mode;r.modeManuallySet=true;renderDraft()}

  function resolveDraftCharacters(b,ctx,chapter){
    const idMap=new Map();
    ctx.characters.forEach(c=>{
      if(!c.name.trim())return;
      if(!String(c.id).startsWith('draftc_')){idMap.set(c.id,c.id);return}
      const existing=(b.characters||[]).find(x=>api.normalizeCharacterText(x.name)===api.normalizeCharacterText(c.name));
      if(existing){idMap.set(c.id,existing.id);return}
      const obj={id:api.uid(),name:c.name.trim(),shortName:c.shortName.trim(),description:c.description.trim(),firstChapter:chapter||c.firstChapter||''};
      b.characters.push(obj);idMap.set(c.id,obj.id);
    });
    return idMap;
  }

  function relationshipCandidate(r,b,idMap,chapter,sessionId){
    const from=idMap.get(r.from)||r.from,to=idMap.get(r.to)||r.to,label=String(r.label||'').trim()||'otra relación';
    if(!from||!to||from===to)return {error:`Relación incompleta: ${label}`};
    if(String(from).startsWith('draftc_')||String(to).startsWith('draftc_'))return {error:`No se pudo resolver: ${label}`};
    const info=relationModeForLabel(label),mode=r.modeManuallySet?r.mode:info.mode,category=info.category||'Otra';
    return {from,to,label,mode,category,chapter,sessionId};
  }

  function findRelationshipForSession(b,candidate,excludeId){
    return api.relationshipExists(b,candidate,excludeId)||null;
  }

  function createSession(e){
    e.preventDefault();
    const f=new FormData(e.target),b=book();if(!b)return;
    const chapter=f.get('chapter')||'',page=f.get('page')||'',sessionId=api.uid();
    const ctx=draft,idMap=resolveDraftCharacters(b,ctx,chapter),findId=id=>idMap.get(id)||id;
    const charIds=[...new Set(ctx.characters.map(c=>findId(c.id)).filter(id=>id&&!String(id).startsWith('draftc_')))];
    const relationshipIds=[],errors=[];
    ctx.relations.forEach(r=>{
      const candidate=relationshipCandidate(r,b,idMap,chapter,sessionId);if(candidate.error){errors.push(candidate.error);return}
      const dup=findRelationshipForSession(b,candidate,null);
      if(dup){relationshipIds.push(dup.id);return}
      const data={id:api.uid(),from:candidate.from,to:candidate.to,items:[{label:candidate.label,mode:candidate.mode,category:candidate.category}],types:[candidate.label],chapter,discoveryPoint:`Capítulo ${chapter}`,sessionId};
      b.relationships.push(data);relationshipIds.push(data.id);
    });
    if(errors.length){api.toast('Hay relaciones incompletas. Revisa Personaje A, Personaje B y Relación.');return}
    const session={id:sessionId,date:new Date().toLocaleString('es-CR'),chapter,page,summary:f.get('summary'),note:f.get('note'),plot:f.get('summary'),impression:f.get('note'),sessionType:'chapter',characterIds:charIds,relationshipIds:[...new Set(relationshipIds)],quoteIds:[],context:'',pointStart:`Capítulo ${chapter}`,pointEnd:`Capítulo ${chapter}${page?` · pág. ${page}`:''}`};
    b.sessions.push(session);api.save();closeSessionEditor();api.renderSessions();api.toast('Sesión guardada con personajes y relaciones');
  }

  function updateSession(e){
    e.preventDefault();
    const f=new FormData(e.target),b=book(),s=b?.sessions?.find(x=>x.id===editDraft.sessionId);if(!b||!s)return;
    const chapter=f.get('chapter')||'',page=f.get('page')||'',ctx=editDraft,idMap=resolveDraftCharacters(b,ctx,chapter),findId=id=>idMap.get(id)||id;
    const charIds=[...new Set(ctx.characters.map(c=>findId(c.id)).filter(id=>id&&!String(id).startsWith('draftc_')))];
    const originalIds=new Set(s.relationshipIds||[]),newRelationshipIds=[],errors=[];
    const currentIds=new Set();
    ctx.relations.forEach(r=>{
      const candidate=relationshipCandidate(r,b,idMap,chapter,s.id);if(candidate.error){errors.push(candidate.error);return}
      const originalId=r.originalId&&originalIds.has(r.originalId)?r.originalId:null;
      if(originalId){
        const existing=b.relationships.find(x=>x.id===originalId);
        if(existing){
          const otherSessions=(b.sessions||[]).filter(os=>os.id!==s.id&&(os.relationshipIds||[]).includes(existing.id));
          const same=String(existing.from)===String(candidate.from)&&String(existing.to)===String(candidate.to)&&normalizeLabel(relationLabel(existing))===normalizeLabel(candidate.label)&&relationArrow(existing)===(candidate.mode==='symmetric'?'↔':'→');
          if(otherSessions.length){
            if(same){newRelationshipIds.push(existing.id);currentIds.add(existing.id);return}
            const data={id:api.uid(),from:candidate.from,to:candidate.to,items:[{label:candidate.label,mode:candidate.mode,category:candidate.category}],types:[candidate.label],chapter,discoveryPoint:`Capítulo ${chapter}`,sessionId:s.id};
            b.relationships.push(data);newRelationshipIds.push(data.id);currentIds.add(data.id);return;
          }
          existing.from=candidate.from;existing.to=candidate.to;existing.items=[{label:candidate.label,mode:candidate.mode,category:candidate.category}];existing.types=[candidate.label];existing.chapter=chapter;existing.discoveryPoint=`Capítulo ${chapter}`;existing.sessionId=existing.sessionId||s.id;
          newRelationshipIds.push(existing.id);currentIds.add(existing.id);return;
        }
      }
      const dup=findRelationshipForSession(b,candidate,originalId);
      if(dup){newRelationshipIds.push(dup.id);currentIds.add(dup.id);return}
      const data={id:api.uid(),from:candidate.from,to:candidate.to,items:[{label:candidate.label,mode:candidate.mode,category:candidate.category}],types:[candidate.label],chapter,discoveryPoint:`Capítulo ${chapter}`,sessionId:s.id};
      b.relationships.push(data);newRelationshipIds.push(data.id);currentIds.add(data.id);
    });
    if(errors.length){api.toast('Hay relaciones incompletas. Revisa Personaje A, Personaje B y Relación.');return}
    s.chapter=chapter;s.page=page;s.summary=f.get('summary');s.note=f.get('note');s.plot=f.get('summary');s.impression=f.get('note');s.characterIds=charIds;s.relationshipIds=[...new Set(newRelationshipIds)];s.pointStart=`Capítulo ${chapter}`;s.pointEnd=`Capítulo ${chapter}${page?` · pág. ${page}`:''}`;
    api.save();closeSessionEditor();api.renderSessions();api.toast('Sesión actualizada correctamente');
  }

  function renderSessions(){
    if(!requireBook())return;const b=book();
    document.getElementById('app').innerHTML=`<div class="section-title"><div><h2>📖 Sesiones de lectura</h2><div class="muted">Registra capítulos, personajes y relaciones descubiertas.</div></div><button class="primary" onclick="newSession()">+ Nueva sesión</button></div>${b.sessions.length?`<div class="list">${b.sessions.slice().reverse().map(s=>{const chars=(s.characterIds||[]).map(id=>b.characters.find(c=>c.id===id)).filter(Boolean),rels=(s.relationshipIds||[]).map(id=>b.relationships.find(r=>r.id===id)).filter(Boolean);return `<div class="card"><div class="section-title"><div><h3>Capítulo ${api.esc(s.chapter||'?')} ${s.page?`· pág. ${api.esc(s.page)}`:''}</h3><div class="muted">${api.esc(s.date||'')}</div></div><button class="secondary" onclick="editSession('${s.id}')">Editar</button></div>${s.summary||s.plot?`<p><strong>📖 Trama:</strong><br>${api.esc(s.summary||s.plot)}</p>`:''}${chars.length?`<p><strong>👥 Personajes</strong><br>${chars.map(c=>api.esc(c.name)).join(' · ')}</p>`:''}${rels.length?`<div><strong>🔗 Relaciones descubiertas</strong>${rels.map(r=>{const a=b.characters.find(c=>c.id===r.from),z=b.characters.find(c=>c.id===r.to);return `<div class="relationship"><span class="node">${api.esc(a?.name||'?')}</span><span class="arrow">— ${api.esc(relationLabel(r))} ${relationArrow(r)}</span><span class="node">${api.esc(z?.name||'?')}</span></div>`}).join('')}</div>`:''}${s.note||s.impression?`<p><strong>💭 Mi impresión:</strong><br>${api.esc(s.note||s.impression)}</p>`:''}</div>`}).join('')}`:`<div class="empty">Aún no has registrado una sesión.</div>`}`;
  }

  Object.assign(window,{newSession,editSession,updateSession,createSession,renderSessions,sessionAddCharacter,sessionRemoveCharacter,sessionAddRelation,sessionRemoveRelation,sessionUpdateCharacter,sessionUpdateRelation,sessionSetRelationMode,closeSessionEditor});
})();
