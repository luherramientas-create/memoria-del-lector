(function(){
  function escD(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))}
  function getBook(){return typeof active==='function'?active():null}
  function refsForCharacter(b,id){
    const relationships=(b.relationships||[]).filter(r=>r.from===id||r.to===id);
    const sessions=(b.sessions||[]).filter(s=>Array.isArray(s.characterIds)&&s.characterIds.includes(id));
    const fragments=(b.quotes||[]).filter(q=>q.characterId===id||(Array.isArray(q.characterIds)&&q.characterIds.includes(id)));
    return {relationships,sessions,fragments};
  }
  function deleteCharacter(id){
    const b=getBook(); if(!b)return;
    const c=(b.characters||[]).find(x=>x.id===id); if(!c)return;
    const refs=refsForCharacter(b,id);
    modal(`<h2>⚠️ Eliminar personaje</h2><p>Estás a punto de eliminar:</p><h3>${escD(c.name)}</h3><div class="hint"><strong>Relaciones afectadas:</strong> ${refs.relationships.length}<br><strong>Sesiones afectadas:</strong> ${refs.sessions.length}<br><strong>Fragmentos afectados:</strong> ${refs.fragments.length}</div><p class="muted">Las sesiones y fragmentos se conservarán; se eliminarán las referencias a este personaje y las relaciones que dependan de él.</p><div class="actions"><button class="secondary" onclick="close()">Cancelar</button><button class="primary" onclick="confirmDeleteCharacter('${id}')">Continuar</button></div>`);
  }
  function confirmDeleteCharacter(id){
    const b=getBook(); if(!b)return;
    const c=(b.characters||[]).find(x=>x.id===id); if(!c)return;
    const refs=refsForCharacter(b,id);
    modal(`<h2>⚠️ Confirmar eliminación</h2><p>Vas a eliminar definitivamente:</p><h3>${escD(c.name)}</h3><div class="hint"><strong>${refs.relationships.length}</strong> relación(es) serán eliminadas.<br><strong>${refs.sessions.length}</strong> sesión(es) conservarán sus demás datos.<br><strong>${refs.fragments.length}</strong> fragmento(s) conservarán su texto.</div><p>Esta operación quedará respaldada antes de ejecutarse.</p><div class="actions"><button class="secondary" onclick="close()">Cancelar</button><button class="primary" onclick="performDeleteCharacter('${id}')">🗑️ Eliminar definitivamente</button></div>`);
  }
  function performDeleteCharacter(id){
    const b=getBook(); if(!b)return;
    const c=(b.characters||[]).find(x=>x.id===id); if(!c)return;
    try{
      localStorage.setItem('memoriaLector.preDeleteBackup',localStorage.getItem('memoriaLector.v1')||'');
      const relationshipIds=new Set((b.relationships||[]).filter(r=>r.from===id||r.to===id).map(r=>r.id).filter(Boolean));
      b.relationships=(b.relationships||[]).filter(r=>r.from!==id&&r.to!==id);
      (b.sessions||[]).forEach(s=>{
        if(Array.isArray(s.characterIds))s.characterIds=s.characterIds.filter(cid=>cid!==id);
        if(Array.isArray(s.participantIds))s.participantIds=s.participantIds.filter(cid=>cid!==id);
        if(Array.isArray(s.relationshipIds))s.relationshipIds=s.relationshipIds.filter(rid=>!relationshipIds.has(rid));
      });
      (b.quotes||[]).forEach(q=>{
        if(q.characterId===id)delete q.characterId;
        if(Array.isArray(q.characterIds))q.characterIds=q.characterIds.filter(cid=>cid!==id);
      });
      b.characters=b.characters.filter(x=>x.id!==id);
      save(); close(); renderCharacters();
      toast(`✅ ${c.name} fue eliminado`);
    }catch(err){
      try{const raw=localStorage.getItem('memoriaLector.preDeleteBackup');if(raw)localStorage.setItem('memoriaLector.v1',raw);}
      catch(e){}
      try{location.reload()}catch(e){}
    }
  }
  function restoreLastDeleteBackup(){
    const raw=localStorage.getItem('memoriaLector.preDeleteBackup');
    if(!raw){toast('No hay un backup de eliminación disponible');return;}
    modal(`<h2>↩️ Restaurar biblioteca anterior</h2><p>Esto reemplazará la biblioteca actual por la copia guardada antes de la última eliminación.</p><div class="actions"><button class="secondary" onclick="close()">Cancelar</button><button class="primary" onclick="performRestoreLastDeleteBackup()">Restaurar</button></div>`);
  }
  function performRestoreLastDeleteBackup(){const raw=localStorage.getItem('memoriaLector.preDeleteBackup');if(!raw)return;localStorage.setItem('memoriaLector.v1',raw);location.reload()}
  const originalEdit=window.editCharacter;
  window.editCharacter=function(id){
    const b=getBook(),c=b&&b.characters.find(x=>x.id===id);
    if(!c){if(originalEdit)originalEdit(id);return;}
    modal(`<h2>Editar personaje</h2><form onsubmit="updateCharacter(event,'${id}')"><div class="field"><label>Nombre completo</label><input name="name" value="${escD(c.name)}" required></div><div class="field"><label>Nombre corto para el mapa</label><input name="shortName" value="${escD(c.shortName||'')}" placeholder="Opcional"></div><div class="field"><label>Descripción</label><textarea name="description">${escD(c.description||'')}</textarea></div><div class="field"><label>Primera aparición (capítulo)</label><input name="chapter" type="number" value="${escD(c.firstChapter||'')}"></div><button class="primary">Guardar</button></form><div class="actions" style="margin-top:12px"><button class="secondary" onclick="deleteCharacter('${id}')">🗑️ Eliminar personaje</button></div>`);
  };
  window.deleteCharacter=deleteCharacter;window.confirmDeleteCharacter=confirmDeleteCharacter;window.performDeleteCharacter=performDeleteCharacter;window.restoreLastDeleteBackup=restoreLastDeleteBackup;window.performRestoreLastDeleteBackup=performRestoreLastDeleteBackup;
})();
