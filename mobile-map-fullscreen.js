// FASE 7.1 — Mapa móvil en modo ampliado
(function(){
  const mq = window.matchMedia('(max-width: 820px)');
  function mapWrap(){ return document.querySelector('.map-wrap'); }
  function install(){
    const wrap=mapWrap(); if(!wrap || wrap.dataset.mobileFsReady==='1') return;
    wrap.dataset.mobileFsReady='1';
    const bar=document.createElement('div');
    bar.className='mobile-map-fs-controls';
    bar.innerHTML='<button type="button" class="mobile-map-fs-enter">⛶ Pantalla completa</button><button type="button" class="mobile-map-fs-exit hidden">↙ Volver al mapa</button>';
    wrap.appendChild(bar);
    const enter=bar.querySelector('.mobile-map-fs-enter'), exit=bar.querySelector('.mobile-map-fs-exit');
    const set=(on)=>{ document.body.classList.toggle('mobile-map-expanded',on); enter.classList.toggle('hidden',on); exit.classList.toggle('hidden',!on); wrap.classList.toggle('mobile-map-expanded',on); };
    enter.onclick=()=>set(true); exit.onclick=()=>set(false);
    wrap.addEventListener('dblclick',e=>{ if(mq.matches && e.target.closest('svg')) set(!document.body.classList.contains('mobile-map-expanded')); });
  }
  const obs=new MutationObserver(install); obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{ if(e.target.closest('[data-view="map"]')) setTimeout(install,30); });
  window.addEventListener('resize',()=>{ if(!mq.matches) document.body.classList.remove('mobile-map-expanded'); });
  window.addEventListener('keydown',e=>{ if(e.key==='Escape' && document.body.classList.contains('mobile-map-expanded')) document.body.classList.remove('mobile-map-expanded'); });
  install();
})();
