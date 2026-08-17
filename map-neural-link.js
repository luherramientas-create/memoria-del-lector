/* FASE 6.5 — Acceso integrado al mapa neuronal desde el módulo Mapa. */
(function(){
  function addNeuralAccess(){
    const toolbar=document.querySelector('#app .map-toolbar');
    if(!toolbar || toolbar.querySelector('.neural-map-access')) return;
    const btn=document.createElement('button');
    btn.className='neural-map-access';
    btn.type='button';
    btn.textContent='🧠 Mapa neuronal';
    btn.title='Abrir la visualización neuronal del libro activo';
    btn.addEventListener('click',()=>{ window.location.href='neural-map-real.html'; });
    toolbar.appendChild(btn);
  }
  const observer=new MutationObserver(()=>setTimeout(addNeuralAccess,0));
  const app=document.getElementById('app');
  if(app) observer.observe(app,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addNeuralAccess);
  else addNeuralAccess();
})();
