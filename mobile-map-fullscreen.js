// FASE 7.1 — Mapa en modo ampliado
(function(){
  // Control universal: laptop, monitor, tablet y Android.
  // No depende de la Fullscreen API para funcionar.
  const mq = window.matchMedia('(max-width: 1100px), (pointer: coarse)');
  const style=document.createElement('style');
  style.textContent=`
    .mobile-map-fs-controls{display:flex!important;position:absolute;left:10px;bottom:10px;z-index:80;gap:8px}
    .mobile-map-fs-controls button{border:1px solid var(--line);background:#fffffff2;color:var(--accent);border-radius:12px;padding:10px 12px;font-weight:800;box-shadow:0 4px 14px #0002}
    body.mobile-map-expanded{overflow:hidden!important}
    body.mobile-map-expanded>.top,body.mobile-map-expanded>.tabs{display:none!important}
    body.mobile-map-expanded>#app{position:fixed!important;inset:0!important;z-index:40!important;max-width:none!important;margin:0!important;padding:0!important;background:var(--bg)!important;overflow:hidden!important}
    body.mobile-map-expanded .map-shell{display:block!important;height:100%!important}
    body.mobile-map-expanded .map-card{height:100%!important;border-radius:0!important;border:0!important;box-shadow:none!important}
    body.mobile-map-expanded .map-wrap{height:100vh!important;height:100dvh!important;min-height:100%!important;border-top:0!important}
    body.mobile-map-expanded .map-toolbar{position:absolute!important;top:0;left:0;right:0;z-index:60;background:#fffffff2;border-bottom:1px solid var(--line);padding:8px;max-height:25vh;overflow:auto}
    body.mobile-map-expanded .map-side{display:none!important}
    body.mobile-map-expanded .mobile-map-fs-controls{left:12px;bottom:12px}
    body.mobile-map-expanded .zoom-box{top:58px;right:10px}
    body.mobile-map-expanded .map-wrap svg{height:100%!important}
  `;
  document.head.appendChild(style);

  function mapWrap(){ return document.querySelector('.map-wrap'); }

  function install(){
    const wrap=mapWrap();
    if(!wrap || wrap.dataset.mobileFsReady==='1') return;
    wrap.dataset.mobileFsReady='1';

    const bar=document.createElement('div');
    bar.className='mobile-map-fs-controls';
    bar.innerHTML='<button type="button" class="mobile-map-fs-enter">⛶ Pantalla completa</button><button type="button" class="mobile-map-fs-exit hidden">↙ Volver al mapa</button>';
    wrap.appendChild(bar);

    const enter=bar.querySelector('.mobile-map-fs-enter');
    const exit=bar.querySelector('.mobile-map-fs-exit');
    const app=document.getElementById('app');
    const top=document.querySelector('.top');
    const tabs=document.querySelector('.tabs');

    // Guardamos solo los estilos inline que vamos a modificar.
    const original={
      app: app ? app.getAttribute('style') : null,
      wrap: wrap.getAttribute('style')
    };

    const set=(on)=>{
      document.body.classList.toggle('mobile-map-expanded',on);
      enter.classList.toggle('hidden',on);
      exit.classList.toggle('hidden',!on);
      wrap.classList.toggle('mobile-map-expanded',on);

      // Refuerzo inline: evita que estilos previos o cachés impidan el cambio visual.
      if(on){
        if(app){
          app.style.position='fixed';
          app.style.inset='0';
          app.style.zIndex='40';
          app.style.maxWidth='none';
          app.style.margin='0';
          app.style.padding='0';
          app.style.overflow='hidden';
        }
        if(top) top.style.display='none';
        if(tabs) tabs.style.display='none';
        wrap.style.height='100dvh';
        wrap.style.minHeight='100%';
      }else{
        if(app){
          if(original.app===null) app.removeAttribute('style'); else app.setAttribute('style',original.app);
        }
        if(top) top.style.display='';
        if(tabs) tabs.style.display='';
        if(original.wrap===null) wrap.removeAttribute('style'); else wrap.setAttribute('style',original.wrap);
      }
    };

    enter.addEventListener('click',()=>set(true));
    exit.addEventListener('click',()=>set(false));

    // Doble clic/tap opcional sobre el mapa en dispositivos táctiles.
    wrap.addEventListener('dblclick',e=>{
      if(mq.matches && e.target.closest('svg')) set(!document.body.classList.contains('mobile-map-expanded'));
    });
  }

  const obs=new MutationObserver(install);
  obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-view="map"]')) setTimeout(install,30);
  });
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape' && document.body.classList.contains('mobile-map-expanded')){
      const exit=document.querySelector('.mobile-map-fs-exit');
      if(exit) exit.click();
    }
  });
  install();
})();
