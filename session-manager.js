// Session manager V2: multiple characters + multiple discovered relationships in one session.
(function(){
  const draft={characters:[],relations:[]};
  const esc2=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const book=()=>typeof active==='function'?active():null;
  const relationLabel=r=>(r.items||[]).map(i=>i.label).join(' · ')||'otra relación';
  const relationArrow=r=>{const sym=(r.items||[]).some(i=>i.mode==='symmetric'),dir=(r.items||[]).some(i=>i.mode==='directed');return sym&&!dir?'↔':'→'};
  function resetDraft(){draft.characters=[];draft.relations=[]}
  function newSession(){
    resetDraft();
    modal(`<h2>📖 Nueva sesión de lectura</h2><form id="sessionV2Form" onsubmit="createSession(event)">
      <div class="grid"><div class="field"><label>Capítulo</label><input name="chapter" type="number" min="0" required></div><div class="field"><label>Página</label><input name="page" type="number" min="0"></div></div>
      <div class="field"><label>📖 Trama</label><textarea name="summary" placeholder="¿Qué ocurre en este capítulo?"></textarea></div>
      <div class="field"><label>💭 Mi impresión</label><textarea name="note"></textarea></div>
      <hr>
      <div class="section-title"><div><h3>👥 Personajes descubiertos</h3><div class="muted">Puedes agregar varios sin guardar la sesión.</div></div><button type="button" class="secondary" onclick="sessionAddCharacter()">+ Personaje</button></div>
      <div id="sessionCharacters" class="list"><div class="muted">Aún no has agregado personajes.</div></div>
      <hr>
      <div class="section-title"><div><h3>🔗 Relaciones descubiertas</h3><div class="muted">Puedes agregar varias relaciones y relacionarlas con personajes nuevos de esta misma sesión.</div></div><button type="button" class="secondary" onclick="sessionAddRelation()">+ Relación</button></div>
      <div id="sessionRelations" class="list"><div class="muted">Aún no has agregado relaciones.</div></div>
      <div class="actions"><button type="button" class="secondary" onclick="close()">Cancelar</button><button class="primary">Guardar sesión</button></div>
    </form>`);
  }
  function sessionAddCharacter(){
    const b=book(); if(!b)return;
    const id='draftc_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    draft.characters.push({id,name:'',shortName:'',description:'',firstChapter:document.querySelector('#sessionV2Form [name=chapter]')?.value||''});
    renderDraft();
    setTimeout(()=>document.querySelector(`#sessionCharacters [data-draft-id="${id}"]`)?.focus(),0);
  }
  function sessionRemoveCharacter(id){
    draft.characters=draft.characters.filter(c=>c.id!==id);
    draft.relations=draft.relations.filter(r=>r.from!==id&&r.to!==id);
    renderDraft();
  }
  function sessionAddRelation(){
    if(draft.characters.length<1 && !(book()?.characters?.length)){
      toast('Primero agrega al menos un personaje.'); return;
    }
    draft.relations.push({id:'draftr_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),from:'',to:'',label:'',mode:'directed'});
    renderDraft();
  }
  function sessionRemoveRelation(id){draft.relations=draft.relations.filter(r=>r.id!==id);renderDraft()}
  function characterOptions(selected){
    const b=book();
    const all=[...(b?.characters||[]),...draft.characters.filter(c=>c.name.trim())];
    return `<option value="">Seleccionar…</option>`+all.map(c=>`<option value="${esc2(c.id)}" ${c.id===selected?'selected':''}>${esc2(c.name)}</option>`).join('');
  }
  function relationTypes(){
    const types=typeof relTypes!=='undefined'?relTypes:['otra relación'];
    return types.map(x=>`<option value="${esc2(x)}">${esc2(x)}</option>`).join('');
  }
  function renderDraft(){
    const cc=document.getElementById('sessionCharacters'),rr=document.getElementById('sessionRelations');
    if(!cc||!rr)return;
    cc.innerHTML=draft.characters.length?draft.characters.map((c,i)=>`<div class="card session-draft-character"><div class="grid"><div class="field"><label>Nombre completo</label><input data-draft-id="${esc2(c.id)}" value="${esc2(c.name)}" oninput="sessionUpdateCharacter('${c.id}','name',this.value)" required></div><div class="field"><label>Nombre corto <span class="muted">(opcional)</span></label><input value="${esc2(c.shortName)}" oninput="sessionUpdateCharacter('${c.id}','shortName',this.value)"></div></div><div class="field"><label>Descripción</label><textarea oninput="sessionUpdateCharacter('${c.id}','description',this.value)">${esc2(c.description)}</textarea></div><button type="button" class="danger" onclick="sessionRemoveCharacter('${c.id}')">Eliminar de esta sesión</button></div>`).join(''):'<div class="muted">Aún no has agregado personajes.</div>';
    rr.innerHTML=draft.relations.length?draft.relations.map((r,i)=>`<div class="card"><div class="grid"><div class="field"><label>Personaje A</label><select onchange="sessionUpdateRelation('${r.id}','from',this.value)">${characterOptions(r.from)}</select></div><div class="field"><label>Personaje B</label><select onchange="sessionUpdateRelation('${r.id}','to',this.value)">${characterOptions(r.to)}</select></div></div><div class="grid"><div class="field"><label>Relación</label><select onchange="sessionUpdateRelation('${r.id}','label',this.value);sessionUpdateRelation('${r.id}','mode',inferRel(this.value).mode)">${relationTypes()}</select></div><div class="field"><label>Capítulo descubierto</label><input type="number" min="0" value="${esc2(document.querySelector('#sessionV2Form [name=chapter]')?.value||'')}" disabled></div></div><button type="button" class="danger" onclick="sessionRemoveRelation('${r.id}')">Eliminar relación</button></div>`).join(''):'<div class="muted">Aún no has agregado relaciones.</div>';
    draft.relations.forEach(r=>{const row=rr.querySelectorAll('.card')[draft.relations.indexOf(r)];const sel=row?.querySelectorAll('select')[2];if(sel)sel.value=r.label||''});
  }
  function sessionUpdateCharacter(id,key,value){const c=draft.characters.find(x=>x.id===id);if(c)c[key]=value; if(key==='name')renderDraft()}
  function sessionUpdateRelation(id,key,value){const r=draft.relations.find(x=>x.id===id);if(r)r[key]=value}
  function resolveDraftCharacter(c,b,chapter){
    const existing=(b.characters||[]).find(x=>normalizeCharacterText(x.name)===normalizeCharacterText(c.name));
    if(existing)return existing.id;
    const obj={id:uid(),name:c.name.trim(),shortName:c.shortName.trim(),description:c.description.trim(),firstChapter:chapter||c.firstChapter||''};
    b.characters.push(obj);return obj.id;
  }
  function createSession(e){
    e.preventDefault();
    const f=new FormData(e.target),b=book(); if(!b)return;
    const chapter=f.get('chapter')||'', page=f.get('page')||'';
    const charIds=[];
    draft.characters.forEach(c=>{if(c.name.trim())charIds.push(resolveDraftCharacter(c,b,chapter))});
    const allChars=[...(b.characters||[])];
    const findId=id=>draft.characters.find(c=>c.id===id)?.name?resolveDraftCharacter(draft.characters.find(c=>c.id===id),b,chapter):id;
    const relationshipIds=[];
    draft.relations.forEach(r=>{
      const from=findId(r.from),to=findId(r.to),label=r.label||'otra relación';
      if(!from||!to||from===to)return;
      const info=inferRel(label), data={id:uid(),from,to,items:[{label,mode:r.mode||info.mode,category:info.category}],types:[label],chapter,discoveryPoint:`Capítulo ${chapter}`};
      const dup=b.relationships.find(x=>x.from===data.from&&x.to===data.to&&(x.items||[]).some(i=>i.label===label&&i.mode===data.items[0].mode));
      if(dup){relationshipIds.push(dup.id)}else{b.relationships.push(data);relationshipIds.push(data.id)}
    });
    const session={id:uid(),date:new Date().toLocaleString('es-CR'),chapter,page,summary:f.get('summary'),note:f.get('note'),plot:f.get('summary'),impression:f.get('note'),sessionType:'chapter',characterIds:[...new Set(charIds.concat(draft.relations.flatMap(r=>[findId(r.from),findId(r.to)]).filter(Boolean)))],relationshipIds:[...new Set(relationshipIds)],quoteIds:[],context:'',pointStart:`Capítulo ${chapter}`,pointEnd:`Capítulo ${chapter}${page?` · pág. ${page}`:''}`};
    b.sessions.push(session);save();close();resetDraft();renderSessions();toast('Sesión guardada con personajes y relaciones');
  }
  function renderSessions(){
    if(!requireBook())return;const b=book();
    document.getElementById('app').innerHTML=`<div class="section-title"><div><h2>📖 Sesiones de lectura</h2><div class="muted">Registra capítulos, personajes y relaciones descubiertas.</div></div><button class="primary" onclick="newSession()">+ Nueva sesión</button></div>${b.sessions.length?`<div class="list">${b.sessions.slice().reverse().map(s=>{const chars=(s.characterIds||[]).map(id=>b.characters.find(c=>c.id===id)).filter(Boolean),rels=(s.relationshipIds||[]).map(id=>b.relationships.find(r=>r.id===id)).filter(Boolean);return `<div class="card"><h3>Capítulo ${esc2(s.chapter||'?')} ${s.page?`· pág. ${esc2(s.page)}`:''}</h3><div class="muted">${esc2(s.date||'')}</div>${s.summary||s.plot?`<p><strong>📖 Trama:</strong><br>${esc2(s.summary||s.plot)}</p>`:''}${chars.length?`<p><strong>👥 Personajes</strong><br>${chars.map(c=>esc2(c.name)).join(' · ')}</p>`:''}${rels.length?`<div><strong>🔗 Relaciones descubiertas</strong>${rels.map(r=>{const a=b.characters.find(c=>c.id===r.from),z=b.characters.find(c=>c.id===r.to);return `<div class="relationship"><span class="node">${esc2(a?.name||'?')}</span><span class="arrow">— ${esc2(relationLabel(r))} ${relationArrow(r)}</span><span class="node">${esc2(z?.name||'?')}</span></div>`}).join('')}</div>`:''}${s.note||s.impression?`<p><strong>💭 Mi impresión:</strong><br>${esc2(s.note||s.impression)}</p>`:''}</div>`}).join('')}`:`<div class="empty">Aún no has registrado una sesión.</div>`}`;
  }
  Object.assign(window,{newSession,createSession,renderSessions,sessionAddCharacter,sessionRemoveCharacter,sessionAddRelation,sessionRemoveRelation,sessionUpdateCharacter,sessionUpdateRelation});
})();
