/* Gestión segura de biblioteca — Memoria del Lector V5 */
(function(){
  const BACKUP_FORMAT='memoria-del-lector-backup';
  const BACKUP_VERSION=1;
  const BACKUP_KEY='memoriaLector.preImportBackup';
  const LIB_KEY='memoriaLector.v1';
  const escB=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const counts=d=>({books:Array.isArray(d?.books)?d.books.length:0,characters:Array.isArray(d?.books)?d.books.reduce((n,b)=>n+(b.characters?.length||0),0):0,relationships:Array.isArray(d?.books)?d.books.reduce((n,b)=>n+(b.relationships?.length||0),0):0,sessions:Array.isArray(d?.books)?d.books.reduce((n,b)=>n+(b.sessions?.length||0),0):0,quotes:Array.isArray(d?.books)?d.books.reduce((n,b)=>n+(b.quotes?.length||0),0):0});
  const summary=c=>`<div class="map-stats"><span class="map-stat">Libros: ${c.books}</span><span class="map-stat">Personajes: ${c.characters}</span><span class="map-stat">Relaciones: ${c.relationships}</span><span class="map-stat">Sesiones: ${c.sessions}</span><span class="map-stat">Fragmentos: ${c.quotes}</span></div>`;
  function showData(){
    const d=JSON.parse(localStorage.getItem(LIB_KEY)||'null')||{books:[],activeBookId:null};
    const c=counts(d);
    modal(`<h2>⚙️ Datos</h2><p class="muted">Gestiona una copia de seguridad independiente de tu biblioteca.</p><div class="card"><h3>💾 Biblioteca actual</h3>${summary(c)}<p class="muted">La exportación incluye libros, personajes, relaciones, sesiones y fragmentos.</p><div class="actions"><button class="primary" onclick="exportLibrary()">📤 Exportar biblioteca</button><button class="secondary" onclick="pickLibraryFile()">📥 Importar biblioteca</button></div></div><div class="hint">Recomendación: exporta una copia antes de hacer cambios importantes o cambiar de navegador.</div>`);
  }
  function exportLibrary(){
    const raw=localStorage.getItem(LIB_KEY);
    if(!raw){toast('No hay biblioteca para exportar');return;}
    let data;try{data=JSON.parse(raw)}catch(e){toast('No se pudo leer la biblioteca');return}
    const payload={format:BACKUP_FORMAT,version:BACKUP_VERSION,app:'Memoria del Lector',exportedAt:new Date().toISOString(),data};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');
    const date=new Date().toISOString().slice(0,10);a.href=url;a.download=`memoria-del-lector-backup-${date}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('✅ Biblioteca exportada');
  }
  function pickLibraryFile(){
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.style.display='none';
    input.onchange=()=>{const file=input.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>handleImportedText(String(reader.result||''),file.name);reader.onerror=()=>toast('❌ No se pudo leer el archivo');reader.readAsText(file);};
    document.body.appendChild(input);input.click();setTimeout(()=>input.remove(),1000);
  }
  function validatePayload(payload){
    if(!payload||typeof payload!=='object'||payload.format!==BACKUP_FORMAT||payload.version!==BACKUP_VERSION||!payload.data||typeof payload.data!=='object')return {ok:false,error:'El archivo no parece una copia de seguridad válida de Memoria del Lector.'};
    const d=payload.data;
    if(!Array.isArray(d.books)||typeof d.activeBookId==='undefined')return {ok:false,error:'La estructura de la biblioteca no es compatible.'};
    for(const b of d.books){if(!b||typeof b!=='object'||!b.id||!Array.isArray(b.characters)||!Array.isArray(b.relationships)||!Array.isArray(b.sessions)||!Array.isArray(b.quotes))return {ok:false,error:'Uno de los libros tiene una estructura incompatible.'};}
    return {ok:true,data:d};
  }
  function handleImportedText(text,fileName){
    let payload;try{payload=JSON.parse(text)}catch(e){toast('❌ JSON inválido. La biblioteca actual no fue modificada.');return}
    const check=validatePayload(payload);if(!check.ok){toast('❌ '+check.error);return}
    const incoming=check.data, current=JSON.parse(localStorage.getItem(LIB_KEY)||'{"books":[],"activeBookId":null}');
    const ci=counts(current),ni=counts(incoming);
    modal(`<h2>📦 Copia de seguridad encontrada</h2><p class="muted">${escB(fileName)}</p>${summary(ni)}<p><strong>Exportada:</strong> ${escB(payload.exportedAt||'fecha desconocida')}</p><p><strong>Versión:</strong> ${payload.version}</p><div class="hint">La biblioteca actual será reemplazada. Antes de hacerlo se guardará automáticamente una copia temporal para recuperación.</div><h3>⚠️ Biblioteca actual</h3>${summary(ci)}<div class="actions"><button class="secondary" onclick="close()">Cancelar</button><button class="primary" onclick="confirmLibraryImport()">Reemplazar biblioteca</button></div>`);
    window.__pendingLibraryImport=incoming;
  }
  function confirmLibraryImport(){
    const incoming=window.__pendingLibraryImport;if(!incoming)return;
    try{
      const raw=localStorage.getItem(LIB_KEY)||'{"books":[],"activeBookId":null}';
      localStorage.setItem(BACKUP_KEY,raw);
      state=incoming;
      if(typeof migrate==='function')migrate();else localStorage.setItem(LIB_KEY,JSON.stringify(state));
      const check=JSON.parse(localStorage.getItem(LIB_KEY)||'null');if(!check||!Array.isArray(check.books))throw new Error('La restauración no pudo verificarse');
      window.__pendingLibraryImport=null;close();
      toast(`✅ Biblioteca restaurada: ${check.books.length} libro(s)`);
      setTimeout(()=>{try{render('home')}catch(e){location.reload()}},250);
    }catch(e){
      const backup=localStorage.getItem(BACKUP_KEY);if(backup)localStorage.setItem(LIB_KEY,backup);window.__pendingLibraryImport=null;toast('❌ No se pudo importar. Los datos actuales fueron restaurados.');
    }
  }
  window.showData=showData;window.exportLibrary=exportLibrary;window.pickLibraryFile=pickLibraryFile;window.confirmLibraryImport=confirmLibraryImport;
  window.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('dataBtn');if(b)b.onclick=showData;});
})();
