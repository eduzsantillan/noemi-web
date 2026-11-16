async(page)=>{
 const ctx=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const p=await ctx.newPage(), errors=[],results=[];let postFail=false,posting=false,patches=0,posts=[];
 const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
 let notes=[{id:1,author:'Ana',message:'Por muchos más recuerdos juntas. Feliz cumpleaños, Noemi.',x:8,y:8,imageDataUrl:null,createdAt:'2026-11-20T12:00:00Z'}];
 const check=(v,m)=>{if(!v)throw Error(m)};
 const option=(name)=>p.locator('label').filter({has:p.getByRole('radio',{name,exact:true})});
 const appearance=()=>p.locator('.mural-draft-preview').evaluate(e=>({color:e.dataset.color,design:e.dataset.design,bg:getComputedStyle(e).backgroundColor}));
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>localStorage.setItem('noemi-birthday-language','es'));
 await p.route('**/api/**',async r=>{
  const req=r.request(),url=req.url();
  if(url.endsWith('/api/mural-access'))return r.fulfill({json:{authorized:true,configured:true}});
  if(url.includes('/position')){patches++;const id=Number(url.split('/').at(-2));notes=notes.map(n=>n.id===id?{...n,...req.postDataJSON()}:n);return r.fulfill({json:{message:notes.find(n=>n.id===id)}});}
  if(url.endsWith('/api/prepare-image'))return r.fulfill({json:{imageDataUrl:pixel}});
  if(req.method()==='POST'){posting=true;posts.push(req.postDataJSON());await new Promise(resolve=>setTimeout(resolve,180));posting=false;if(postFail)return r.fulfill({status:503,json:{error:'Try again'}});const n={...req.postDataJSON(),id:901,createdAt:'2026-11-20T12:00:00Z'};notes=[n,...notes];return r.fulfill({status:201,json:{message:n}});}
  return r.fulfill({json:{messages:notes}});
 });
 try{
  await p.goto('http://localhost:5174/mural');await p.locator('[data-note-id="1"]').waitFor({state:'visible'});
  check(await p.locator('[data-note-id="1"] article').getAttribute('data-color')==='cream','Legacy color');
  check(await p.locator('[data-note-id="1"] .mural-birthday-detail').count()===0,'Legacy should be plain');
  check(patches===0,'Load wrote a position');
  await p.getByRole('button',{name:'Dejar una nota',exact:true}).tap();
  check(await p.getByRole('radio').count()===10,'Six colors and four designs only');
  check((await appearance()).design==='confetti','Birthday default');
  await p.locator('#mural-author').fill('Ana');await p.locator('#mural-note').fill('Que nunca te falten motivos para sonreír. Feliz cumpleaños.');
  for(const [name,color] of [['Crema','cream'],['Amarillo','butter'],['Rosa','rose'],['Lila','lilac'],['Cielo','sky'],['Menta','mint']]){
   await option(name).tap();check(await p.getByRole('radio',{name,exact:true}).isChecked(),'Color not selected '+name);check((await appearance()).color===color,'Preview color '+color);
   const box=await option(name).boundingBox();check(box.width>=44&&box.height>=44,'Small touch target '+name);
  }
  for(const [name,design] of [['Lisa','plain'],['Confeti','confetti'],['Globos','balloons'],['Pastel','cake']]){
   await option(name).tap();check((await appearance()).design===design,'Preview design '+design);check(await p.locator('.mural-draft-preview svg').count()===(design==='plain'?0:1),'Preview decoration');
   const box=await option(name).boundingBox();check(box.width>=44&&box.height>=44,'Small design target');
  }
  results.push('Seis colores y cuatro diseños cambian la vista previa con un toque; objetivos >=44 px');
  await option('Crema').tap();await p.getByRole('radio',{name:'Crema',exact:true}).focus();await p.keyboard.press('ArrowRight');check(await p.getByRole('radio',{name:'Amarillo',exact:true}).isChecked(),'Color keyboard arrows');
  await p.getByRole('radio',{name:'Pastel',exact:true}).focus();await p.keyboard.press('ArrowLeft');check(await p.getByRole('radio',{name:'Globos',exact:true}).isChecked(),'Design keyboard arrows');
  results.push('Selección accesible con radios nativos y flechas del teclado');
  await option('Rosa').tap();await option('Pastel').tap();
  await p.locator('input[type=file]').setInputFiles({name:'recuerdo.png',mimeType:'image/png',buffer:Buffer.from(pixel.split(',')[1],'base64')});await p.locator('.photo-preview').waitFor();
  postFail=true;const click=p.getByRole('button',{name:'Publicar',exact:true}).tap();
  await p.waitForRequest(r=>r.method()==='POST'&&r.url().endsWith('/api/messages'));
  check(await p.getByRole('radio').evaluateAll(list=>list.every(e=>e.disabled||e.matches(':disabled'))),'Styles editable during save');await click;
  await p.getByText('Intenta de nuevo',{exact:false}).waitFor();
  check((await appearance()).color==='rose'&&(await appearance()).design==='cake','Error lost selections');
  await p.getByRole('button',{name:'Cerrar',exact:true}).tap();await p.getByRole('button',{name:'Dejar una nota',exact:true}).tap();
  check((await appearance()).color==='rose'&&(await appearance()).design==='cake','Closing lost choices');check(await p.locator('#mural-note').inputValue()===posts[0].message,'Lost text');check(await p.locator('.photo-preview').count()===1,'Lost photo');
  results.push('Borrador, foto, color y diseño conservados al cerrar o fallar; controles bloqueados mientras guarda');
  postFail=false;await p.getByRole('button',{name:'Publicar',exact:true}).tap();await p.locator('[data-note-id="901"]').waitFor({state:'visible'});
  check(posts.at(-1).color==='rose'&&posts.at(-1).design==='cake','Appearance missing from payload');
  check(await p.locator('[data-note-id="901"] article').getAttribute('data-color')==='rose','Published color');check(await p.locator('[data-note-id="901"] .mural-note-design').getAttribute('data-design')==='cake','Published design');
  check(await p.locator('[data-note-id="901"] img').count()===1,'Published image');
  await p.screenshot({path:'/Users/eduzuniga/Documents/date-app/outputs/mural-birthday-note-mobile.png'});
  const cdp=await ctx.newCDPSession(p),handle=await p.locator('[data-note-id="901"] .mural-drag-handle').boundingBox(),old=patches;
  const x=handle.x+60,y=handle.y+22;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+22,y:y+17}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(80);
  check(patches===old+1,'Decorated note did not drag');check(notes.find(n=>n.id===901).color==='rose','Drag removed appearance');
  await p.reload();await p.locator('[data-note-id="901"]').waitFor({state:'visible'});check(await p.locator('[data-note-id="901"] article').getAttribute('data-color')==='rose','Reload lost color');check(await p.locator('[data-note-id="901"] article').getAttribute('data-design')==='cake','Reload lost design');
  results.push('Publicar con foto, mover con dedo y recargar conserva la apariencia individual');
  await p.getByRole('button',{name:'Dejar una nota',exact:true}).tap();check((await appearance()).color==='cream'&&(await appearance()).design==='confetti','Defaults not restored after publish');
  for(const [width,height] of [[320,568],[375,667],[390,844],[700,900],[820,900],[1440,960]]){
   await p.setViewportSize({width,height});await p.locator('dialog').evaluate(e=>e.scrollTop=0);
   const dims=await p.evaluate(()=>{const d=document.querySelector('dialog');return {w:document.documentElement.clientWidth,sw:document.documentElement.scrollWidth,dw:d.clientWidth,ds:d.scrollWidth,dh:d.clientHeight,h:innerHeight,min:Math.min(...Array.from(document.querySelectorAll('.mural-appearance-option')).map(e=>e.getBoundingClientRect().width)),font:parseFloat(getComputedStyle(document.querySelector('#mural-author')).fontSize)};});
   if(width===320){await p.screenshot({path:'/Users/eduzuniga/Documents/date-app/outputs/mural-colors-320-debug.png'});dims.overflow=await p.locator('dialog').evaluate(d=>Array.from(d.querySelectorAll('*')).filter(e=>e.getBoundingClientRect().right>d.getBoundingClientRect().right).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right})));}check(dims.sw<=dims.w&&dims.ds<=dims.dw+1,'Overflow '+width+' '+JSON.stringify(dims));check(dims.dh<=height&&dims.min>=44,'Touch geometry '+width);check(dims.font>=16,'Input zoom');
   await p.getByRole('button',{name:'Publicar',exact:true}).scrollIntoViewIfNeeded();check(await p.getByRole('button',{name:'Publicar',exact:true}).isVisible(),'Submit unreachable '+width);
  }
  results.push('Formulario y controles sin desbordamiento de 320 a 1440 px; publicar accesible con scroll');
  await p.getByRole('button',{name:'Cerrar',exact:true}).click();await p.getByRole('button',{name:'EN',exact:true}).click();await p.getByRole('button',{name:'Leave a note',exact:true}).click();
  check(await p.getByRole('radio',{name:'Balloons',exact:true}).count()===1,'English design labels');await option('Sky').click();await option('Balloons').click();
  await p.locator('#mural-author').fill('Ana');await p.locator('#mural-note').fill('So many more adventures to come. Happy birthday!');await p.locator('dialog').evaluate(e=>e.scrollTop=0);await p.screenshot({path:'/Users/eduzuniga/Documents/date-app/outputs/mural-colors-desktop-composer.png'});
  results.push('Etiquetas y selección en español e inglés');check(errors.length===0,'Runtime errors '+errors.join(';'));
  return {results,posts:posts.length,patches,errors,realDatabaseWrites:0};
 }finally{await ctx.close();}
}
