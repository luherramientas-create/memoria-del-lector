// Relationship integrity guard — single source of truth for duplicate detection.
(function(){
 const KEY='memoriaLector.v1';
 const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('es').replace(/\s+/g,' ');
 const CATALOG={'madre de':'directed','padre de':'directed','hijo/a de':'directed','hermano de':'symmetric','hermana de':'symmetric','primo/a de':'symmetric','tío/a de':'directed','esposo/a de':'symmetric','pareja de':'symmetric','jefe de':'directed','empleado/a de':'directed','profesor/a de':'directed','estudiante de':'directed','amigo/a de':'symmetric','enemigo/a de':'symmetric','mentor de':'directed','socio/a de':'symmetric','conocido/a de':'symmetric','colega de':'symmetric','rival de':'symmetric','otra relación':'directed'};
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
 const active=()=>{const s=read();return s&&s.books&&s.books.find(b=>b.id===s.activeBookId)};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

 // Public, reusable identity check. This is the single source of truth used by
 // normal relationship creation and session relationship creation.
 function relationshipExists(book,candidate,excludeRelationshipId=''){
   if(!book||!candidate||!candidate.from||!candidate.to)return null;
   const from=String(candidate.from),to=String(candidate.to),label=norm(candidate.label||candidate.name||'');
   if(!label)return null;
   const mode=candidate.mode==='symmetric'?'symmetric':'directed';
   return (book.relationships||[]).find(r=>{
     if(excludeRelationshipId && r.id===excludeRelationshipId)return false;
     const samePair=mode==='symmetric'
       ? ((r.from===from&&r.to===to)||(r.from===to&&r.to===from))
       : (r.from===from&&r.to===to);
     if(!samePair)return false;
     return (r.items||[]).some(it=>norm(it.label||it.name)===label && (it.mode||'directed')===mode);
   })||null;
 }
 window.relationshipExists=relationshipExists;
 window.relationshipLabelNormalize=norm;

 function values(form){return [...form.elements].filter(x=>x&&x.value!==undefined).map(x=>({el:x,name:(x.name||'').toLowerCase(),value:String(x.value),label:(x.options&&x.selectedIndex>=0?String(x.options[x.selectedIndex].textContent||''):'').trim()}));}
 function info(form){const b=active();if(!b)return null;const cs=new Set((b.characters||[]).map(c=>c.id));const vals=values(form);const cf=vals.filter(v=>cs.has(v.value));if(cf.length<2)return null;const uniq=[];for(const v of cf)if(!uniq.some(x=>x.el===v.el))uniq.push(v);if(uniq.length<2)return null;const rf=vals.find(v=>/relation|relationship|label|type|rel/.test(v.name)&&!cs.has(v.value))||vals.find(v=>CATALOG[norm(v.label||v.value)]);const label=norm(rf?.label||rf?.value||'');if(!label)return null;let mode=CATALOG[label]||'directed';const mf=vals.find(v=>/mode|direccion|direction/.test(v.name));if(mf){const mv=norm(mf.value);if(/symmetric|simetr|↔/.test(mv))mode='symmetric';if(/directed|dirig|→/.test(mv))mode='directed';}return{b,from:uniq[0].value,to:uniq[1].value,label,mode};}

 document.addEventListener('submit',function(e){
   const form=e.target;
   if(!(form instanceof HTMLFormElement))return;
   if(form.dataset.relGuardAllow==='1'){delete form.dataset.relGuardAllow;return;}
   const x=info(form);if(!x)return;
   const d=relationshipExists(x.b,x);
   if(!d)return;
   e.preventDefault();e.stopImmediatePropagation();
   const getName=id=>x.b.characters.find(c=>c.id===id)?.name||'?';
   const dir=x.mode==='symmetric'?'↔':'→';
   const modalEl=document.getElementById('modal'),bodyEl=document.getElementById('modalBody');
   if(!modalEl||!bodyEl)return;
   bodyEl.innerHTML=`<h2>⚠️ Esta relación ya existe</h2><p>Ya tienes registrada esta misma conexión:</p><div class="hint"><strong>${esc(getName(x.from))}</strong> — ${esc(x.label)} ${dir} <strong>${esc(getName(x.to))}</strong></div><p class="muted">Puedes cancelar o crearla de todas formas si se trata de un registro intencional.</p><div class="actions"><button class="secondary" type="button" id="relGuardCancel">Cancelar</button><button class="primary" type="button" id="relGuardForce">Crear de todas formas</button></div>`;
   modalEl.classList.remove('hidden');
   document.getElementById('relGuardCancel').onclick=()=>modalEl.classList.add('hidden');
   document.getElementById('relGuardForce').onclick=()=>{modalEl.classList.add('hidden');form.dataset.relGuardAllow='1';form.requestSubmit?form.requestSubmit():form.submit();};
 },true);
})();
