// FASE 7.1 — Mapa en modo ampliado
(function(){
  // El control es universal: funciona en laptop, monitor, tablet y Android.
  // El modo ampliado no depende de la Fullscreen API del navegador.
  const mq = window.matchMedia('(max-width: 1100px), (pointer: coarse)');
  const style=document.createElement('style');
  style.textContent=`
    /* Control visible en todos los dispositivos */
    .mobile-map-fs-controls{display:flex!important}

    /* Modo mapa ampliado: universal */
    body.mobile-map-expanded{overflow:hidden}
    .mobile-map-expanded .top,
    .mobile-map-expanded .tabs{display:none}
    .mobile-map-expanded main{
      position:fixed;inset:0;z-index:40;max-width:none;margin:0;padding:0;
      background:var(--bg);overflow:hidden
    }
    .mobile-map-expanded .map-shell{display:block;height:100%}
    .mobile-map-expanded .map-card{
      height:100%;border-radius:0;border:0;box-shadow:none
    }
    .mobile-map-expanded .map-wrap{
      height:100vh;height:100dvh;min-height:100%;border-top:0
    }
    .mobile-map-expanded .map-toolbar{
      position:absolute;top:0;left:0;right:0;z-index:6;
      background:#fffffff2;border-bottom:1px solid var(--line);
      padding:8px;max-height:25vh;overflow:auto
    }
    .mobile-map-expanded .map-side{display:none}
    .mobile-map-expanded .mobile-map-fs-controls{bottom:12px;left:12px}
    .mobile-map-expanded .zoom-box{top:58px;right:10px}
    .mobile-map-expanded .map-wrap svg{height:100%}

    /* En pantallas grandes conservamos el mapa completo sin hacerlo incómodo. */
    @media (min-width:1101px) and (pointer:fine){
      .mobile-map-expanded .map-toolbar{max-height:none}
      .mobile-map-expanded .map-wrap{height:100vh;height:100dvh}
    }
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

    const set=(on)=>{
      document.body.classList.toggle('mobile-map-expanded',on);
      enter.classList.toggle('hidden',on);
      exit.classList.toggle('hidden',!on);
      wrap.classList.toggle('mobile-map-expanded',on);
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
  window.addEventListener('resize',()=>{
    // El usuario puede cambiar de orientación o de ventana sin perder el modo.
  });
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape' && document.body.classList.contains('mobile-map-expanded')){
      const exit=document.querySelector('.mobile-map-fs-exit');
      if(exit) exit.click();
    }
  });
  install();
})();
