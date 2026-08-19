// FASE 7.6-D — Intervención quirúrgica del mapa normal
(function(){
  const mq=window.matchMedia('(max-width:1100px),(pointer:coarse)');
  let fullscreen=false;
  window.__mapFullscreen=false;
  const style=document.createElement('style');
  style.textContent=`
    /* Mapa normal: entrada a fullscreen arriba a la derecha. */
    .mobile-map-fs-controls{display:flex!important;position:absolute!important;top:10px!important;right:10px!important;left:auto!important;bottom:auto!important;z-index:80!important;gap:7px!important;flex-wrap:wrap!important;pointer-events:auto!important}
    .mobile-map-fs-controls button{display:block!important;width:auto!important;height:auto!important;min-width:0!important;max-width:180px!important;position:static!important;border:1px solid var(--line)!important;background:#fffffff2!important;color:var(--accent)!important;border-radius:12px!important;padding:9px 11px!important;font-weight:800!important;box-shadow:0 4px 14px #0002!important;white-space:nowrap!important}
    /* La salida solo existe visualmente dentro de fullscreen. */
    .mobile-map-fs-controls button.mobile-map-fs-exit{display:none!important}
    .mobile-map-fs-controls button.mobile-map-fs-enter{display:block!important}
    body.mobile-map-expanded{overflow:hidden!important}
    body.mobile-map-expanded>.top,body.mobile-map-expanded>.tabs{display:none!important}
    body.mobile-map-expanded>#app{position:fixed!important;inset:0!important;z-index:40!important;max-width:none!important;margin:0!important;padding:0!important;background:var(--bg)!important;overflow:hidden!important}
    body.mobile-map-expanded .map-shell{display:block!important;height:100%!important}
    body.mobile-map-expanded .map-card{height:100%!important;border-radius:0!important;border:0!important;box-shadow:none!important}
    body.mobile-map-expanded .map-wrap{height:100vh!important;height:100dvh!important;min-height:100%!important;border-top:0!important}
    body.mobile-map-expanded .map-toolbar{position:absolute!important;top:0;left:0;right:0;z-index:60;background:#fffffff2;border-bottom:1px solid var(--line);padding:8px;max-height:25vh;overflow:auto}
    body.mobile-map-expanded .map-side{display:none!important}
    body.mobile-map-expanded .mobile-map-fs-controls{top:10px!important;right:10px!important;left:auto!important;bottom:auto!important;z-index:100!important}
    body.mobile-map-expanded .mobile-map-fs-controls button.mobile-map-fs-exit{display:block!important}
    body.mobile-map-expanded .mobile-map-fs-controls button.mobile-map-fs-enter{display:none!important}
    body.mobile-map-expanded .zoom-box{top:58px;right:10px}
    body.mobile-map-expanded .map-wrap svg{height:100%!important}
    .map-wrap.map-touch-ready{touch-action:none}
    @media(max-width:600px){
      .map-toolbar{gap:5px!important;padding:8px!important;overflow-x:auto!important;overflow-y:visible!important;flex-wrap:nowrap!important;white-space:nowrap}
      .map-toolbar .seg{flex:none}
      .map-toolbar select,.map-toolbar button{flex:none}
      /* Deja espacio entre la navegación sticky y el encabezado del mapa. */
      main{padding-top:22px!important}
      .map-wrap:not(.mobile-map-expanded .map-wrap) .zoom-box{top:58px!important;right:10px!important}
    }
  `;
  document.head.appendChild(style);
  function syncZoomIndicator(){
    const svg=document.getElementById('mapSvg');
    const label=document.querySelector('#mapWrap .zoom-box button:nth-child(2)');
    if(!svg||!label)return;
    const m=svg.style.transform.match(/scale\(([-+]?\d*\.?\d+)\)/);
    if(m){const value=Math.round(parseFloat(m[1])*100);if(Number.isFinite(value))label.textContent=value+'%';}
  }
  function apply(){
    const app=document.getElementById('app'),top=document.querySelector('.top'),tabs=document.querySelector('.tabs'),wrap=document.querySelector('.map-wrap');
    document.body.classList.toggle('mobile-map-expanded',fullscreen);
    window.__mapFullscreen=fullscreen;
    if(!app||!wrap)return;
    if(fullscreen){app.style.position='fixed';app.style.inset='0';app.style.zIndex='40';app.style.maxWidth='none';app.style.margin='0';app.style.padding='0';app.style.overflow='hidden';if(top)top.style.display='none';if(tabs)tabs.style.display='none';wrap.style.height='100dvh';wrap.style.minHeight='100%'}
    else{app.style.position='';app.style.inset='';app.style.zIndex='';app.style.maxWidth='';app.style.margin='';app.style.padding='';app.style.overflow='';if(top)top.style.display='';if(tabs)tabs.style.display='';wrap.style.height='';wrap.style.minHeight=''}
    syncZoomIndicator();
  }
  function install(){
    const wrap=document.querySelector('.map-wrap');if(!wrap)return;
    if(wrap.dataset.mobileFsReady!=='1'){
      wrap.dataset.mobileFsReady='1';
      const bar=document.createElement('div');bar.className='mobile-map-fs-controls';bar.innerHTML='<button type="button" class="mobile-map-fs-enter">⛶ Pantalla completa</button><button type="button" class="mobile-map-fs-exit">↙ Volver al mapa</button>';wrap.appendChild(bar);
      bar.querySelector('.mobile-map-fs-enter').addEventListener('click',()=>{fullscreen=true;apply()});
      bar.querySelector('.mobile-map-fs-exit').addEventListener('click',()=>{fullscreen=false;apply()});
    }
    apply();
    syncZoomIndicator();
  }
  const app=document.getElementById('app');
  new MutationObserver(()=>setTimeout(install,0)).observe(app||document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-view="map"]'))setTimeout(install,30);
    if(e.target.closest('#mapWrap .zoom-box button'))setTimeout(syncZoomIndicator,0);
  },{capture:true});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&fullscreen){fullscreen=false;apply()}});
  install();
})();
