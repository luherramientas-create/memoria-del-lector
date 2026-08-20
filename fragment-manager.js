// Fragment actions: surgical enhancement for the Fragmentos section only.
(function(){
  const originalRenderQuotes = window.renderQuotes;

  function currentBook(){
    if(typeof window.active === 'function') return window.active();
    return null;
  }
  function escLocal(s){
    return typeof window.esc === 'function' ? window.esc(s) : String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  }

  window.editQuote = function(id){
    const b=currentBook();
    const q=b?.quotes?.find(x=>x.id===id);
    if(!q) return;
    window.modal(`<h2>Editar fragmento</h2><form onsubmit="updateQuote(event,'${escLocal(id)}')">
      <div class="field"><label>Frase o párrafo</label><textarea name="text" required>${escLocal(q.text)}</textarea></div>
      <div class="grid">
        <div class="field"><label>Capítulo</label><input name="chapter" type="number" min="0" value="${escLocal(q.chapter||'')}"></div>
        <div class="field"><label>Página</label><input name="page" type="number" min="0" value="${escLocal(q.page||'')}"></div>
      </div>
      <div class="field"><label>¿Por qué lo guardas?</label><select name="reason">
        ${['Frase bonita','Idea interesante','Reflexión','Importante para la trama','Otro'].map(v=>`<option ${q.reason===v?'selected':''}>${v}</option>`).join('')}
      </select></div>
      <div class="field"><label>Nota personal</label><textarea name="note">${escLocal(q.note||'')}</textarea></div>
      <div class="actions"><button type="button" class="secondary" onclick="close()">Cancelar</button><button class="primary">Guardar cambios</button></div>
    </form>`);
  };

  window.updateQuote = function(e,id){
    e.preventDefault();
    const b=currentBook();
    const q=b?.quotes?.find(x=>x.id===id);
    if(!q) return;
    const f=new FormData(e.target);
    q.text=f.get('text');
    q.chapter=f.get('chapter');
    q.page=f.get('page');
    q.reason=f.get('reason');
    q.note=f.get('note');
    window.save();
    window.close();
    window.renderQuotes();
    if(typeof window.toast==='function') window.toast('Fragmento actualizado');
  };

  // Replace only the Fragmentos renderer with a wrapper around the existing one.
  window.renderQuotes = function(){
    if(typeof originalRenderQuotes === 'function') originalRenderQuotes();
    const app=document.getElementById('app');
    if(!app) return;
    app.querySelectorAll('.card').forEach(card=>{
      const del=card.querySelector('button[onclick^="deleteQuote("]');
      if(!del || card.querySelector('.fragment-edit-action')) return;
      const match=(del.getAttribute('onclick')||'').match(/deleteQuote\('([^']+)'\)/);
      if(!match) return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='secondary fragment-edit-action';
      btn.textContent='Editar';
      btn.onclick=()=>window.editQuote(match[1]);
      del.parentNode.insertBefore(btn,del);
    });
  };

  // Keep deletion scoped to Fragmentos, adding only a confirmation.
  window.deleteQuote = function(id){
    const b=currentBook();
    const q=b?.quotes?.find(x=>x.id===id);
    if(!q) return;
    const preview=String(q.text||'').trim().replace(/\s+/g,' ');
    const shortPreview=preview.length>120?preview.slice(0,120)+'…':preview;
    if(!window.confirm(`¿Eliminar este fragmento?\n\n"${shortPreview}"\n\nEsta acción no se puede deshacer.`)) return;
    b.quotes=b.quotes.filter(x=>x.id!==id);
    window.save();
    window.renderQuotes();
    if(typeof window.toast==='function') window.toast('Fragmento eliminado');
  };
})();
