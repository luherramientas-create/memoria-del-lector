// FASE 7.6-B — Pantalla completa persistente del mapa
(function(){
  const mq=window.matchMedia('(max-width:1100px),(pointer:coarse)');
  function readFullscreen(){return window.__mapFullscreen===true||sessionStorage.getItem('memoriaLector.mapFullscreen')==='1'}
  let fullscreen=readFullscreen();
  window.__mapFullscreen=fullscreen;
  const style=document.createElement('style');
  style.textContent=`
    .mobile-map-fs-controls{display:flex!important;position:absolute;right:10px;top:10px;left:auto;bottom:auto;z-index:80;gap:8px;flex-wrap:wrap}
    .mobile-map-fs-controls button{border:1px solid var(--line);background:#fffffff2;color:var(--accent);border-radius:12px;padding:10px 12px;font-weight:800;box-shadow:0 4px 14px #0002}
    .mobile-map-fs-exit{display:none}.mobile-map-fs-enter{display:block}
    body.mobile-map-expanded{overflow:hidden!important}
    body.mobile-map-expanded>.top,body.mobile-map-expanded>.tabs{display:none!important}
    body.mobile-map-expanded>#app{position:fixed!important;inset:0!important;z-index:40!important;max-width:none!important;margin:0!important;padding:0!important;background:var(--bg)!important;overflow:hidden!important}
    body.mobile-map-expanded .map-shell{display:block!important;height:100%!important}
    body.mobile-map-expanded .map-card{height:100%!important;border-radius:0!important;border:0!important;box-shadow:none!important}
    body.mobile-map-expanded .map-wrap{height:100vh!important;height:100dvh!important;min-height:100%!important;border-top:0!important}
    body.mobile-map-expanded .map-toolbar{position:absolute!important;top:0;left:0;right:0;z-index:60;background:#fffffff2;border-bottom:1px solid var(--line);padding:8px;max-height:25vh;overflow:auto}
    body.mobile-map-expanded .map-side{display:none!important}
    body.mobile-map-expanded .mobile-map-fs-controls{right:12px;top:12px;z-index:100}
    body.mobile-map-expanded .mobile-map-fs-exit{display:block!important}.mobile-map-expanded .mobile-map-fs-enter{display:none!important}
    body.mobile-map-expanded .zoom-box{top:58px;right:10px}
    body.mobile-map-expanded .map-wrap svg{height:100%!important}
    .map-wrap.map-touch-ready{touch-action:none}
    @media(max-width:600px){
      .map-toolbar{gap:5px!important;padding:8px!important;overflow-x:auto!important;overflow-y:visible!important;flex-wrap:nowrap!important;white-space:nowrap}
      .map-toolbar .seg{flex:none}.map-toolbar select,.map-toolbar button{flex:none}
      .map-wrap{min-height:460px}
    }
  `;
  document.head.appendChild(style);
  function saveState(){window.__mapFullscreen=fullscreen;if(fullscreen)sessionStorage.setItem('memoriaLector.mapFullscreen','1');else sessionStorage.removeItem('memoriaLector.mapFullscreen')}
  function getMapState(){try{return Function('return mapState')()}catch(e){return null}}
  function syncZoomReadout(){const st=getMapState(),box=document.querySelector('.zoom-box');if(!box)return;const buttons=box.querySelectorAll('button');if(buttons.length>=3&&st)buttons[1].textContent=Math.round(st.zoom*100)+'%'}
  function applyFullscreen(){
    fullscreen=readFullscreen();
    const app=document.getElementById('app'),top=document.querySelector('.top'),tabs=document.querySelector('.tabs'),wrap=document.querySelector('.map-wrap');
    document.body.classList.toggle('mobile-map-expanded',fullscreen);
    if(!app||!wrap)return;
    if(fullscreen){app.style.position='fixed';app.style.inset='0';app.style.zIndex='40';app.style.maxWidth='none';app.style.margin='0';app.style.padding='0';app.style.overflow='hidden';if(top)top.style.display='none';if(tabs)tabs.style.display='none';wrap.style.height='100dvh';wrap.style.minHeight='100%'}
    else{app.style.position='';app.style.inset='';app.style.zIndex='';app.style.maxWidth='';app.style.margin='';app.style.padding='';app.style.overflow='';if(top)top.style.display='';if(tabs)tabs.style.display='';wrap.style.height='';wrap.style.minHeight=''}
  }
  function installMapTouch(){
    const wrap=document.querySelector('.map-wrap'),svg=document.getElementById('mapSvg');if(!wrap||!svg)return;
    if(wrap.dataset.mapTouchReady==='1'){syncZoomReadout();return}
    wrap.dataset.mapTouchReady='1';wrap.classList.add('map-touch-ready');syncZoomReadout();
  }
  function install(){
    const wrap=document.querySelector('.map-wrap');if(!wrap)return;
    if(wrap.dataset.mobileFsReady!=='1'){
      wrap.dataset.mobileFsReady='1';
      const bar=document.createElement('div');bar.className='mobile-map-fs-controls';bar.innerHTML='<button type="button" class="mobile-map-fs-enter">⛶ Pantalla completa</button><button type="button" class="mobile-map-fs-exit">↙ Volver al mapa</button>';wrap.appendChild(bar);
      bar.querySelector('.mobile-map-fs-enter').addEventListener('click',()=>{fullscreen=true;saveState();applyFullscreen();});
      bar.querySelector('.mobile-map-fs-exit').addEventListener('click',()=>{fullscreen=false;saveState();applyFullscreen();});
    }
    installMapTouch();applyFullscreen();syncZoomReadout();
    requestAnimationFrame(()=>{if(readFullscreen())applyFullscreen()});
  }
  const app=document.getElementById('app');
  const obs=new MutationObserver(()=>{if(readFullscreen())requestAnimationFrame(install);else setTimeout(install,0)});
  obs.observe(app||document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest('[data-view="map"]'))setTimeout(install,30);},{capture:true});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&readFullscreen()){fullscreen=false;saveState();applyFullscreen();}});
  install();
})();
