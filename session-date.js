// Session date only — isolated UI/data adapter for session creation/editing.
(function(){
  const originalNewSession=window.newSession;
  const originalEditSession=window.editSession;
  const originalCreateSession=window.createSession;
  const originalUpdateSession=window.updateSession;

  function todayLocal(){
    const d=new Date();
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function toInputDate(raw){
    const v=String(raw??'').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;
    const m=v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if(m)return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    return '';
  }

  function displayDate(iso){
    if(!iso)return '';
    const parts=iso.split('-').map(Number);
    if(parts.length!==3||parts.some(Number.isNaN))return iso;
    return new Date(parts[0],parts[1]-1,parts[2]).toLocaleDateString('es-CR');
  }

  function injectDateControl(rawDate){
    const form=document.getElementById('sessionV2Form');
    if(!form||form.querySelector('#sessionDateControl'))return;
    const firstGrid=form.querySelector('.grid');
    if(!firstGrid)return;

    const originalInput=toInputDate(rawDate);
    const wrap=document.createElement('div');
    wrap.id='sessionDateControl';
    wrap.className='field';
    wrap.innerHTML=`<label>📅 Fecha de sesión</label>
      <div class="date-row">
        <input id="sessionDateInput" type="date" value="${originalInput}" aria-label="Fecha de sesión">
        <button type="button" class="secondary" data-date-action="today">Hoy</button>
        <button type="button" class="secondary" data-date-action="change">Cambiar fecha</button>
        <button type="button" class="secondary" data-date-action="none">Sin fecha</button>
      </div>
      <div class="muted">Puedes dejarla sin fecha.</div>`;

    firstGrid.parentNode.insertBefore(wrap,firstGrid);
    form.dataset.sessionDateDirty='0';
    const input=wrap.querySelector('#sessionDateInput');
    const markDirty=()=>{form.dataset.sessionDateDirty='1'};
    input.addEventListener('input',markDirty);
    input.addEventListener('change',markDirty);
    wrap.querySelector('[data-date-action="today"]').onclick=()=>{input.value=todayLocal();markDirty()};
    wrap.querySelector('[data-date-action="change"]').onclick=()=>{input.focus();try{input.showPicker?.()}catch(e){}};
    wrap.querySelector('[data-date-action="none"]').onclick=()=>{input.value='';markDirty()};
  }

  function currentDateValue(){return document.getElementById('sessionDateInput')?.value||''}
  function isDateDirty(){return document.getElementById('sessionV2Form')?.dataset.sessionDateDirty==='1'}

  window.newSession=function(){
    if(originalNewSession)originalNewSession.apply(this,arguments);
    setTimeout(()=>injectDateControl(''),30);
  };

  window.editSession=function(id){
    if(originalEditSession)originalEditSession.apply(this,arguments);
    setTimeout(()=>{
      const b=typeof active==='function'?active():null;
      const s=b?.sessions?.find(x=>x.id===id);
      injectDateControl(s?.date||'');
      const input=document.getElementById('sessionDateInput');
      if(input)input.dataset.initialSessionId=id;
    },40);
  };

  window.createSession=function(e){
    const before=new Set(((typeof active==='function'?active():null)?.sessions||[]).map(s=>s.id));
    const dirty=isDateDirty();
    const selected=currentDateValue();
    if(originalCreateSession)originalCreateSession.apply(this,arguments);
    setTimeout(()=>{
      const b=typeof active==='function'?active():null;
      if(!b)return;
      const created=(b.sessions||[]).find(s=>!before.has(s.id));
      if(!created)return;
      created.date=dirty&&selected?displayDate(selected):'';
      if(typeof save==='function')save();
      if(typeof renderSessions==='function')renderSessions();
    },40);
  };

  window.updateSession=function(e){
    const form=document.getElementById('sessionV2Form');
    const dirty=form?.dataset.sessionDateDirty==='1';
    const selected=currentDateValue();
    const targetId=form?.querySelector('#sessionDateInput')?.dataset.initialSessionId||'';
    if(originalUpdateSession)originalUpdateSession.apply(this,arguments);
    if(!dirty||!targetId)return;
    setTimeout(()=>{
      const book=typeof active==='function'?active():null;
      const target=book?.sessions?.find(s=>s.id===targetId);
      if(!target)return;
      target.date=selected?displayDate(selected):'';
      if(typeof save==='function')save();
      if(typeof renderSessions==='function')renderSessions();
    },40);
  };
})();
