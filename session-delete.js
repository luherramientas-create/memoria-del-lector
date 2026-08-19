(function(){
  function escD(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))}
  function getBook(){return typeof active==='function'?active():null}
  function sessionRefs(b,id){
    const s=(b.sessions||[]).find(x=>x.id===id); if(!s)return {session:null,characters:[],relationships:[],quotes:[]};
    const characters=(b.characters||[]).filter(c=>Array.isArray(s.characterIds)&&s.characterIds.includes(c.id));
    const relationships=(b.relationships||[]).filter(r=>Array.isArray(s.relationshipIds)&&s.relationshipIds.includes(r.id));
    const quotes=(b.quotes||[]).filter(q=>q.sessionId===id||(Array.isArray(s.quoteIds)&&s.quoteIds.includes(q.id)));
    return {session:s,characters,relationships,quotes};
  }
  function deleteSession(id){
    const b=getBook(); if(!b)return;
    const refs=sessionRefs(b,id); if(!refs.session){toast('No se encontró la sesión.');return}
    modal(`<h2>⚠️ Eliminar sesión</h2><p>Vas a eliminar la sesión:</p><h3>${escD(refs.session.pointEnd||refs.session.pointStart||('Capítulo '+(refs.session.chapter||'?')))}</h3><div class="hint"><strong>Personajes asociados:</strong> ${refs.characters.length}<br><strong>Relaciones asociadas:</strong> ${refs.relationships.length}<br><strong>Fragmentos asociados:</strong> ${refs.quotes.length}</div><p class="muted">La sesión se eliminará. Los personajes y relaciones se conservarán porque pueden pertenecer también a otras sesiones. Los fragmentos también se conservarán.</p><div class="actions"><button class="secondary" onclick="close()">Cancelar</button><button class="primary" onclick="confirmDeleteSession('${id}')">Continuar</button></div>`);
  }
  function confirmDeleteSession(id){
    const b=getBook(); if(!b)return;
    const refs=sessionRefs(b,id); if(!refs.session)return;
    modal(`<h2>⚠️ Confirmar eliminación</h2><p>Esta acción eliminará definitivamente esta sesión de lectura.</p><div class="hint">${escD(refs.session.pointEnd||refs.session.pointStart||('Capítulo '+(refs.session.chapter||'?')))}<br>${refs.characters.length} personaje(s) asociados · ${refs.relationships.length} relación(es) asociadas.</div><p>Los datos de personajes, relaciones y fragmentos no se eliminarán automáticamente.</p><div class="actions"><button class="secondary" onclick="close()">Cancelar</button><button class="danger" onclick="performDeleteSession('${id}')">🗑️ Eliminar sesión</button></div>`);
  }
  function performDeleteSession(id){
    const b=getBook(); if(!b)return;
    const refs=sessionRefs(b,id); if(!refs.session)return;
    try{
      localStorage.setItem('memoriaLector.preDeleteBackup',localStorage.getItem('memoriaLector.v1')||'');
      b.sessions=(b.sessions||[]).filter(s=>s.id!==id);
      save();close();renderSessions();toast('✅ Sesión eliminada');
    }catch(err){
      const raw=localStorage.getItem('memoriaLector.preDeleteBackup');if(raw)localStorage.setItem('memoriaLector.v1',raw);location.reload();
    }
  }
  const originalEdit=window.editSession;
  window.editSession=function(id){
    if(originalEdit)originalEdit(id);
    setTimeout(()=>{
      const body=document.getElementById('modalBody');
      if(!body||!body.querySelector('#sessionV2Form'))return;
      if(body.querySelector('#deleteSessionAction'))return;
      const actions=body.querySelector('#sessionV2Form .actions');
      if(!actions)return;
      const btn=document.createElement('button');btn.type='button';btn.id='deleteSessionAction';btn.className='danger';btn.textContent='🗑️ Eliminar sesión';btn.onclick=()=>deleteSession(id);actions.insertBefore(btn,actions.firstChild);
    },30);
  };
  window.deleteSession=deleteSession;window.confirmDeleteSession=confirmDeleteSession;window.performDeleteSession=performDeleteSession;
})();
