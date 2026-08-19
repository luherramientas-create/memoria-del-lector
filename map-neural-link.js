// FASE 7.6-C — Un único acceso al mapa neuronal
(function(){
  function addAccess(){
    const toolbar=document.querySelector('#app .map-toolbar');
    if(!toolbar||toolbar.querySelector('.neural-map-access'))return;
    const btn=document.createElement('button');
    btn.type='button';btn.className='neural-map-access';btn.textContent='🧠 Mapa neuronal';
    btn.title='Abrir el mapa neuronal del libro activo';
    btn.addEventListener('click',()=>{sessionStorage.removeItem('memoriaLector.mapFullscreen');location.href='neural-map-real.html?v=7.6.3'});
    toolbar.appendChild(btn);
  }
  const app=document.getElementById('app');
  if(app)new MutationObserver(()=>setTimeout(addAccess,0)).observe(app,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addAccess);else addAccess();
})();
