// Character name guard: warns about exact and similar names before create/edit.
(function(){
  const norm = v => String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim().replace(/\s+/g,' ');
  const tokens = v => norm(v).split(' ').filter(Boolean);
  const levenshtein = (a,b) => { const m=a.length,n=b.length; if(!m)return n;if(!n)return m; let prev=Array.from({length:n+1},(_,i)=>i); for(let i=1;i<=m;i++){const cur=[i];for(let j=1;j<=n;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=cur;} return prev[n]; };
  function similarity(a,b){
    const A=norm(a),B=norm(b); if(!A||!B)return 0;if(A===B)return 1;
    const ta=tokens(A),tb=tokens(B),setA=new Set(ta),setB=new Set(tb);
    const common=[...setA].filter(x=>setB.has(x));
    const tokenScore=common.length/Math.max(setA.size,setB.size);
    const editScore=1-levenshtein(A,B)/Math.max(A.length,B.length);
    const lastA=ta.at(-1),lastB=tb.at(-1);
    const surname=lastA&&lastB&&lastA===lastB?1:0;
    return Math.max(editScore, tokenScore*0.82 + surname*0.18);
  }
  function candidates(book,name,excludeId){
    const n=norm(name); if(!n)return {exact:[],similar:[]};
    const exact=[],similar=[];
    (book.characters||[]).forEach(c=>{
      if(c.id===excludeId)return;
      const cn=norm(c.name); if(!cn)return;
      if(cn===n) exact.push(c);
      else if(similarity(name,c.name)>=0.68 || (tokens(name).length>=2 && tokens(c.name).length>=2 && tokens(name).at(-1)===tokens(c.name).at(-1) && tokens(name).filter(x=>tokens(c.name).includes(x)).length>=1)) similar.push(c);
    });
    return {exact,similar};
  }
  function stats(book,c){
    const rs=(book.relationships||[]).filter(r=>r.from===c.id||r.to===c.id).length;
    const ss=(book.sessions||[]).filter(s=>(s.characterIds||[]).includes(c.id)).length;
    return `<div class="muted">Primera aparición: ${esc(c.firstChapter||'?')} · ${rs} relación(es) · ${ss} sesión(es)</div><p>${esc(c.description||'Sin descripción')}</p>`;
  }
  function warning(title,intro,items,buttons,options={}){
    const canMerge=options.canMerge!==false;
    const mergeId=options.mergeId||null;
    const itemHtml=items.map(c=>{
      const mergeButton=canMerge&&mergeId
        ? `<button type="button" class="primary" onclick="openCharacterMerge('${mergeId}','${c.id}')">Fusionar con este personaje</button>`
        : '';
      return `<div class="card"><h3>${esc(c.name)}</h3>${stats(active(),c)}<div class="actions"><button type="button" class="secondary" onclick="editCharacter('${c.id}')">Revisar personaje</button>${mergeButton}</div></div>`;
    }).join('');
    modal(`<h2>${title}</h2><p>${intro}</p>${canMerge&&mergeId?'<div class="hint">Si confirmas que se trata del mismo personaje, puedes iniciar la fusión. Elige qué registro conservar y revisa los datos antes de confirmar.</div>':''}<div class="list">${itemHtml}</div><div class="actions">${buttons}</div>`);
  }
  function createDirect(data){
    const b=active(); b.characters.push({id:uid(),name:data.name,shortName:data.shortName,description:data.description,firstChapter:data.chapter}); save();close();renderCharacters();toast('Personaje creado');
  }
  function updateDirect(id,data){
    const c=active().characters.find(x=>x.id===id); if(!c)return;
    c.name=data.name;c.shortName=data.shortName;c.description=data.description;c.firstChapter=data.chapter;save();close();renderCharacters();toast('Personaje actualizado');
  }
  function createCharacter(e){
    e.preventDefault(); const f=new FormData(e.target),data={name:String(f.get('name')||'').trim(),shortName:String(f.get('shortName')||'').trim(),description:String(f.get('description')||'').trim(),chapter:f.get('chapter')||''};
    const b=active(),m=candidates(b,data.name,null);
    if(!m.exact.length&&!m.similar.length){createDirect(data);return;}
    if(m.exact.length){
      warning('⚠️ Ya existe un personaje con este nombre','Ya tienes registrado un personaje con este nombre. Podrían ser la misma persona, pero también pueden ser personajes diferentes.',m.exact,[`<button type="button" class="secondary" onclick="close()">Cancelar</button>`,`<button type="button" class="primary" id="createAnyway">Crear de todas formas</button>`],{canMerge:false});
    }else{
      warning('🔎 Hay un personaje con un nombre similar','Podría tratarse de la misma persona. Revisa el registro antes de continuar.',m.similar,[`<button type="button" class="secondary" onclick="close()">Cancelar</button>`,`<button type="button" class="primary" id="createAnyway">Crear de todas formas</button>`],{canMerge:false});
    }
    setTimeout(()=>{const btn=document.getElementById('createAnyway');if(btn)btn.onclick=()=>createDirect(data)},0);
  }
  function updateCharacter(e,id){
    e.preventDefault(); const f=new FormData(e.target),data={name:String(f.get('name')||'').trim(),shortName:String(f.get('shortName')||'').trim(),description:String(f.get('description')||'').trim(),chapter:f.get('chapter')||''};
    const b=active(),m=candidates(b,data.name,id);
    if(!m.exact.length&&!m.similar.length){updateDirect(id,data);return;}
    if(m.exact.length){
      warning('⚠️ Ya existe un personaje con este nombre','Otro personaje del mismo libro ya utiliza este nombre.',m.exact,[`<button type="button" class="secondary" onclick="close()">Cancelar</button>`,`<button type="button" class="primary" id="updateAnyway">Guardar de todas formas</button>`],{canMerge:true,mergeId:id});
    }else{
      warning('🔎 Hay un personaje con un nombre similar','El nombre editado se parece a otro personaje de este libro. Revisa antes de continuar.',m.similar,[`<button type="button" class="secondary" onclick="close()">Cancelar</button>`,`<button type="button" class="primary" id="updateAnyway">Guardar de todas formas</button>`],{canMerge:true,mergeId:id});
    }
    setTimeout(()=>{const btn=document.getElementById('updateAnyway');if(btn)btn.onclick=()=>updateDirect(id,data)},0);
  }
  window.characterNameSimilarity=similarity;
  window.createCharacter=createCharacter;
  window.updateCharacter=updateCharacter;
})();
