// FASE 7.5.2 — Pantalla completa persistente del mapa + controles móviles
(function(){
  const mq=window.matchMedia('(max-width:1100px),(pointer:coarse)');
  let fullscreen=!!window.__mapFullscreen;
  window.__mapFullscreen=fullscreen;

  const style=document.createElement('style');
  style.textContent=`
    .mobile-map-fs-controls{display:flex!important;position:absolute;right:10px;top:10px;left:auto;bottom:auto;z-index:80;gap:8px;flex-wrap:wrap}
    .mobile-map-fs-controls button{border:1px solid var(--line);background:#fffffff2;color:var(--accent);border-radius:12px;padding:10px 12px;font-weight:800;box-shadow:0 4px 14px #0002}
    .mobile-map-fs-exit{display:none}
    body.mobile-map-expanded{overflow:hidden!important}
    body.mobile-map-expanded>.top,body.mobile-map-expanded>.tabs{display:none!important}
    body.mobile-map-expanded>#app{position:fixed!important;inset:0!important;z-index:40!important;max-width:none!important;margin:0!important;padding:0!important;background:var(--bg)!important;overflow:hidden!important}
    body.mobile-map-expanded .map-shell{display:block!important;height:100%!important}
    body.mobile-map-expanded .map-card{height:100%!important;border-radius:0!important;border:0!important;box-shadow:none!important}
    body.mobile-map-expanded .map-wrap{height:100vh!important;height:100dvh!important;min-height:100%!important;border-top:0!important}
    body.mobile-map-expanded .map-toolbar{position:absolute!important;top:0;left:0;right:0;z-index:60;background:#fffffff2;border-bottom:1px solid var(--line);padding:8px;max-height:25vh;overflow:auto}
    body.mobile-map-expanded .map-side{display:none!important}
    body.mobile-map-expanded .mobile-map-fs-controls{right:12px;top:12px;z-index:100}
    body.mobile-map-expanded .mobile-map-fs-exit{display:block!important}
    body.mobile-map-expanded .mobile-map-fs-enter{display:none!important}
    body.mobile-map-expanded .zoom-box{top:58px;right:10px}
    body.mobile-map-expanded .map-wrap svg{height:100%!important}
    .map-wrap.map-touch-ready{touch-action:none}
  `;
  document.head.appendChild(style);

  function getMapState(){try{return Function('return mapState')()}catch(e){return null}}
  function syncZoomReadout(){
    const st=getMapState(),box=document.querySelector('.zoom-box');
    if(!box)return;
    const buttons=box.querySelectorAll('button');
    if(buttons.length>=3&&st)buttons[1].textContent=Math.round(st.zoom*100)+'%';
  }
  function applyFullscreen(){
    const app=document.getElementById('app'),top=document.querySelector('.top'),tabs=document.querySelector('.tabs'),wrap=document.querySelector('.map-wrap');
    document.body.classList.toggle('mobile-map-expanded',fullscreen);
    if(!app||!wrap)return;
    if(fullscreen){
      app.style.position='fixed';app.style.inset='0';app.style.zIndex='40';app.style.maxWidth='none';app.style.margin='0';app.style.padding='0';app.style.overflow='hidden';
      if(top)top.style.display='none';
      if(tabs)tabs.style.display='none';
      wrap.style.height='100dvh';wrap.style.minHeight='100%';
    }else{
      app.style.position='';app.style.inset='';app.style.zIndex='';app.style.maxWidth='';app.style.margin='';app.style.padding='';app.style.overflow='';
      if(top)top.style.display='';
      if(tabs)tabs.style.display='';
      wrap.style.height='';wrap.style.minHeight='';
    }
  }
  function installMapTouch(){
    const wrap=document.querySelector('.map-wrap'),svg=document.getElementById('mapSvg');
    if(!wrap||!svg)return;
    if(wrap.dataset.mapTouchReady==='1'){syncZoomReadout();return;}
    wrap.dataset.mapTouchReady='1';wrap.classList.add('map-touch-ready');
    const originalMapZoom=window.mapZoom;
    if(typeof originalMapZoom==='function'&&!window.__mapZoom752){
      window.__mapZoom752=true;
      window.mapZoom=function(delta){originalMapZoom(delta);const st=getMapState();if(st)svg.style.transform=`translate(${st.panX}px,${st.panY}px) scale(${st.zoom})`;syncZoomReadout();};
    }
    const pointers=new Map();let pinch=null;
    const distance=(a,b)=>Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
    const center=(a,b)=>({x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2});
    const begin=()=>{const p=[...pointers.values()];if(p.length<2)return;const st=getMapState();if(!st)return;const c=center(p[0],p[1]);pinch={distance:Math.max(1,distance(p[0],p[1])),zoom:st.zoom,panX:st.panX,panY:st.panY,cx:c.x,cy:c.y};};
    svg.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;pointers.set(e.pointerId,e);if(pointers.size===2){begin();e.preventDefault();}},{passive:false});
    svg.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'||!pointers.has(e.pointerId)||!pinch)return;pointers.set(e.pointerId,e);const p=[...pointers.values()],c=center(p[0],p[1]),st=getMapState();if(!st)return;const next=Math.max(.6,Math.min(1.7,pinch.zoom*(distance(p[0],p[1])/pinch.distance))),r=svg.getBoundingClientRect(),sx=pinch.cx-r.left,sy=pinch.cy-r.top;st.panX=sx-(sx-pinch.panX)*(next/pinch.zoom)+(c.x-pinch.cx);st.panY=sy-(sy-pinch.panY)*(next/pinch.zoom)+(c.y-pinch.cy);st.zoom=next;svg.style.transform=`translate(${st.panX}px,${st.panY}px) scale(${st.zoom})`;syncZoomReadout();e.preventDefault();},{passive:false});
    const up=e=>{if(e.pointerType!=='touch')return;pointers.delete(e.pointerId);if(pointers.size<2)pinch=null;};
    svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);
  }
  function install(){
    const wrap=document.querySelector('.map-wrap');if(!wrap)return;
    if(wrap.dataset.mobileFsReady!=='1'){
      wrap.dataset.mobileFsReady='1';
      const bar=document.createElement('div');bar.className='mobile-map-fs-controls';bar.innerHTML='<button type="button" class="mobile-map-fs-enter">⛶ Pantalla completa</button><button type="button" class="mobile-map-fs-exit">↙ Volver al mapa</button>';wrap.appendChild(bar);
      bar.querySelector('.mobile-map-fs-enter').addEventListener('click',()=>{fullscreen=true;window.__mapFullscreen=true;applyFullscreen();});
      bar.querySelector('.mobile-map-fs-exit').addEventListener('click',()=>{fullscreen=false;window.__mapFullscreen=false;applyFullscreen();});
      wrap.addEventListener('dblclick',e=>{if(mq.matches&&e.target.closest('svg')){fullscreen=!fullscreen;window.__mapFullscreen=fullscreen;applyFullscreen();}});
    }
    installMapTouch();syncZoomReadout();applyFullscreen();
  }
  const obs=new MutationObserver(()=>setTimeout(install,0));
  obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest('[data-view="map"]'))setTimeout(install,30);});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&fullscreen){fullscreen=false;window.__mapFullscreen=false;applyFullscreen();}});
  install();
})();
