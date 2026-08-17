// FASE 6.6 — Portadas personalizadas de libros
// Módulo desacoplado: no modifica la lógica de personajes, relaciones,
// sesiones, fragmentos ni mapas.
(function(){
  const MAX_BYTES = 250 * 1024;
  const MAX_W = 300, MAX_H = 450;

  function formatBytes(n){ return Math.round(n/1024) + ' KB'; }
  function dataUrlBytes(dataUrl){
    const base64 = String(dataUrl).split(',')[1] || '';
    return Math.floor(base64.length * 0.75);
  }

  function processCover(file){
    return new Promise((resolve,reject)=>{
      if(!file || !/^image\/(jpeg|png|webp)$/i.test(file.type)){
        reject(new Error('Formato no compatible. Usa JPG, PNG o WebP.')); return;
      }
      const reader = new FileReader();
      reader.onerror = ()=>reject(new Error('No se pudo leer la imagen.'));
      reader.onload = ()=>{
        const img = new Image();
        img.onerror = ()=>reject(new Error('No se pudo procesar la imagen.'));
        img.onload = ()=>{
          const ratio = Math.min(MAX_W/img.naturalWidth, MAX_H/img.naturalHeight, 1);
          const w = Math.max(1, Math.round(img.naturalWidth * ratio));
          const h = Math.max(1, Math.round(img.naturalHeight * ratio));
          const canvas = document.createElement('canvas');
          canvas.width=w; canvas.height=h;
          const ctx=canvas.getContext('2d');
          ctx.drawImage(img,0,0,w,h);
          let quality=.84;
          let data=canvas.toDataURL('image/webp',quality);
          if(dataUrlBytes(data)>MAX_BYTES){
            quality=.68; data=canvas.toDataURL('image/webp',quality);
          }
          if(dataUrlBytes(data)>MAX_BYTES){
            quality=.55; data=canvas.toDataURL('image/jpeg',quality);
          }
          if(dataUrlBytes(data)>MAX_BYTES){
            quality=.42; data=canvas.toDataURL('image/jpeg',quality);
          }
          resolve({data,width:w,height:h,bytes:dataUrlBytes(data)});
        };
        img.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function coverMarkup(b, cls='book-cover'){
    if(b && b.cover) return `<div class="${cls} has-cover"><img src="${b.cover}" alt="Portada de ${esc(b.title)}"></div>`;
    return `<div class="${cls}">📖</div>`;
  }

  function coverField(b){
    return `<div class="field"><label>Portada del libro <span class="muted">(opcional)</span></label>
      <input id="bookCoverFile" type="file" accept="image/jpeg,image/png,image/webp">
      <div id="bookCoverPreview" class="cover-editor-preview">${coverMarkup(b,'book-cover-preview')}</div>
      <div class="actions"><button type="button" class="secondary" onclick="previewBookCover()">Previsualizar</button>${b&&b.cover?`<button type="button" class="secondary" onclick="removeBookCover()">Eliminar portada</button>`:''}</div>
      <div id="bookCoverStatus" class="muted">JPG, PNG o WebP. Se optimizará localmente antes de guardarse.</div>
    </div>`;
  }

  window.__pendingBookCover = null;
  window.previewBookCover = async function(){
    const input=document.getElementById('bookCoverFile'), status=document.getElementById('bookCoverStatus'), preview=document.getElementById('bookCoverPreview');
    if(!input || !input.files || !input.files[0]){ if(status) status.textContent='Selecciona una imagen primero.'; return; }
    try{
      if(status) status.textContent='Procesando imagen…';
      const result=await processCover(input.files[0]);
      window.__pendingBookCover=result.data;
      if(preview) preview.innerHTML=`<img src="${result.data}" alt="Previsualización de portada">`;
      if(status) status.textContent=`Portada lista · ${result.width}×${result.height} · ${formatBytes(result.bytes)} · guardado local`;
    }catch(err){ window.__pendingBookCover=null; if(status) status.textContent=err.message; }
  };

  window.removeBookCover = function(){
    window.__pendingBookCover = '__REMOVE__';
    const preview=document.getElementById('bookCoverPreview');
    const status=document.getElementById('bookCoverStatus');
    if(preview) preview.innerHTML='<div class="book-cover-preview">📖</div>';
    if(status) status.textContent='La portada se eliminará al guardar.';
  };

  const originalNewBook=window.newBook;
  const originalEditBook=window.editBook;
  const originalCreateBook=window.createBook;
  const originalUpdateBook=window.updateBook;

  window.newBook=function(){
    modal(`<h2>Nuevo libro</h2><form onsubmit="createBook(event)"><div class="field"><label>Título</label><input name="title" required></div><div class="field"><label>Autor</label><input name="author"></div>${coverField(null)}<div class="field"><label>Notas iniciales</label><textarea name="notes" placeholder="¿Por qué lo estás leyendo?"></textarea></div><button class="primary">Crear libro</button></form>`);
    window.__pendingBookCover=null;
  };

  window.editBook=function(id){
    const b=state.books.find(x=>x.id===id); if(!b)return;
    modal(`<h2>Editar libro</h2><form onsubmit="updateBook(event,'${id}')"><div class="field"><label>Título</label><input name="title" value="${esc(b.title)}" required></div><div class="field"><label>Autor</label><input name="author" value="${esc(b.author||'')}"></div>${coverField(b)}<div class="field"><label>Notas</label><textarea name="notes">${esc(b.notes||'')}</textarea></div><button class="primary">Guardar</button></form>`);
    window.__pendingBookCover=null;
  };

  window.createBook=async function(e){
    e.preventDefault();
    const f=new FormData(e.target);
    const b={id:uid(),title:f.get('title'),author:f.get('author'),notes:f.get('notes'),characters:[],relationships:[],quotes:[],sessions:[]};
    if(window.__pendingBookCover && window.__pendingBookCover!=='__REMOVE__') b.cover=window.__pendingBookCover;
    state.books.push(b);state.activeBookId=b.id;save();close();window.__pendingBookCover=null;view('recap');
  };

  window.updateBook=async function(e,id){
    e.preventDefault();
    const b=state.books.find(x=>x.id===id); if(!b)return;
    const f=new FormData(e.target);
    b.title=f.get('title'); b.author=f.get('author'); b.notes=f.get('notes');
    if(window.__pendingBookCover==='__REMOVE__') delete b.cover;
    else if(window.__pendingBookCover) b.cover=window.__pendingBookCover;
    try{ save(); close(); window.__pendingBookCover=null; renderHome(); }
    catch(err){ toast('No se pudo guardar la portada. Prueba con una imagen más pequeña.'); }
  };

  const originalRenderHome=window.renderHome;
  window.renderHome=function(){
    const app=document.getElementById('app');
    if(!state.books.length){ return originalRenderHome(); }
    app.innerHTML=`<div class="section-title"><div><h2>Mis libros</h2><div class="muted">${state.books.length} libro(s)</div></div><button class="primary" onclick="newBook()">+ Libro</button></div><div class="grid">${state.books.map(b=>{const last=b.sessions?.at(-1);return `<div class="card"><div class="book-row">${coverMarkup(b)}<div><h3>${esc(b.title)}</h3><div class="muted">${esc(b.author||'Autor no registrado')}</div><div class="tag">${b.sessions?.length||0} sesión(es)</div></div></div>${last?`<div class="hint"><strong>Última sesión de lectura</strong><br>${esc(last.date)} · ${esc(sessionPoint(last))}${sessionBrief(last)?`<br>${esc(sessionBrief(last).slice(0,120))}${sessionBrief(last).length>120?'…':''}`:''}</div>`:`<div class="muted">Aún no hay sesiones registradas.</div>`}<div class="actions"><button class="primary" onclick="selectBook('${b.id}')">${last?'Retomar lectura':'Abrir'}</button><button class="secondary" onclick="editBook('${b.id}')">Editar</button></div></div>`}).join('')}</div>`;
  };

  // Evita que un handler de carga parcial deje una portada pendiente entre modales.
  document.addEventListener('change',e=>{ if(e.target && e.target.id==='bookCoverFile'){ window.__pendingBookCover=null; const s=document.getElementById('bookCoverStatus'); if(s)s.textContent='Imagen seleccionada. Pulsa “Previsualizar” para procesarla.'; }});
})();
