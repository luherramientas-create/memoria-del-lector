// FASE 7.1 — Mapa móvil en modo ampliado
(function(){
  // Android puede presentar una ventana CSS >820px en landscape.
  // También detectamos interacción táctil para no depender solo del ancho.
  const mq = window.matchMedia('(max-width: 1100px), (pointer: coarse)');
  const style=document.createElement('style');
  style.textContent=`
    @media (max-width:1100px), (pointer:coarse){
      .mobile-map-fs-controls{display:flex!important}
    }
    @media (max-width:1100px), (pointer:coarse){
      body.mobile-map-expanded{overflow:hidden}
      .mobile-map-expanded .top,.mobile-map-expanded .tabs{display:none}
      .mobile-map-expanded main{position:fixed;inset:0;z-index:40;max-width:none;margin:0;padding:0;background:var(--bg);overflow:hidden}
      .mobile-map-expanded .map-shell{display:block;height:100%}
      .mobile-map-expanded .map-card{height:100%;border-radius:0;border:0;box-shadow:none}
      .mobile-map-expanded .map-wrap{height:100vh;height:100dvh;min-height:100%;border-top:0}
      .mobile-map-expanded .map-toolbar{position:absolute;top:0;left:0;right:0;z-index:6;background:#fffffff2;border-bottom:1px solid var(--line);padding:8px;max-height:25vh;overflow:auto}
      .mobile-map-expanded .map-side{display:none}
      .mobile-map-expanded .mobile-map-fs-controls{bottom:12px;left:12px}
      .mobile-map-expanded .zoom-box{top:58px;right:10px}
      .mobile-map-expanded .map-wrap svg{height:100%}
    }
  `;
  document.head.appendChild(style);
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
