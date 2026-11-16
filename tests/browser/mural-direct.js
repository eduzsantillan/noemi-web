// Run with the Playwright browser_run_code tool. Uses intercepted APIs only.
async(page)=>{
 const ctx=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await ctx.newPage();
 const errors=[];p.on('pageerror',e=>errors.push(e.message));let patches=0,patchFail=false,postFail=false;
 const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
 let notes=[{id:1,author:'Edu',message:'Por muchas más aventuras contigo. Feliz cumpleaños.',x:8,y:8,imageDataUrl:null},{id:2,author:'Amiga',message:'Que nunca te falten motivos para sonreír.',x:45,y:8,imageDataUrl:pixel},{id:3,author:'A'.repeat(80),message:'Cumpleaños 🎂 生日快乐 '.repeat(26).slice(0,500),x:75,y:45,imageDataUrl:null}].map(n=>({...n,createdAt:'2026-11-20T12:00:00Z'}));
 const check=(value,msg)=>{if(!value)throw Error(msg);};const results=[];
 await p.addInitScript(()=>localStorage.setItem('noemi-birthday-language','es'));
 await p.route('**/api/**',async r=>{const req=r.request(),url=req.url();if(url.endsWith('/api/mural-access'))await r.fulfill({json:{authorized:true,configured:true}});
 else if(url.includes('/position')){patches++;const id=Number(url.split('/').at(-2));if(!patchFail)notes=notes.map(n=>n.id===id?{...n,...req.postDataJSON()}:n);await r.fulfill({status:patchFail?503:200,json:{ok:!patchFail}});}
 else if(url.endsWith('/api/prepare-image'))await r.fulfill({json:{imageDataUrl:pixel}});
 else if(req.method()==='POST'){if(postFail)await r.fulfill({status:503,json:{error:'try again'}});else{const n={...req.postDataJSON(),id:901,createdAt:'2026-11-20T12:00:00Z'};notes=[n,...notes];await r.fulfill({status:201,json:{message:n}});}}
 else await r.fulfill({json:{messages:notes}});});
 try{
 await p.goto('http://localhost:5174/mural');await p.locator('.mural-note-shell').first().waitFor({state:'visible'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(100);
 check(await p.locator('.mural-view-switch,.mural-story').count()===0,'Old options/hero remain');
 check(await p.locator('dialog[open]').count()===0,'Composer should start closed');
 check(await p.getByRole('button',{name:'Dejar una nota',exact:true}).count()===1,'Single create action');
 check(patches===0,'Load must not save positions');results.push('Lienzo directo sin modos, sin portada y con una sola acción');
 const cdp=await ctx.newCDPSession(p);const note=p.locator('[data-note-id="1"]');const body=await note.locator('p').boundingBox();
 const before=await note.evaluate(e=>({left:e.offsetLeft,top:e.offsetTop}));const viewBefore=await p.locator('.mural-canvas-viewport').evaluate(e=>({x:e.scrollLeft,y:e.scrollTop}));
 const x=body.x+Math.min(70,body.width/2),y=body.y+20;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+25,y:y+20}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(100);
 check(patches===1,'Touch body drag must persist');
 const after=await note.evaluate(e=>({left:e.offsetLeft,top:e.offsetTop}));check(after.left!==before.left||after.top!==before.top,'Touch did not move note');
 const vb=await p.locator('.mural-canvas-viewport').evaluate(e=>({x:e.scrollLeft,y:e.scrollTop}));check(vb.x===viewBefore.x&&vb.y===viewBefore.y,'Dragging center should not pan');
 const count=patches,b=await note.locator('p').boundingBox();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+40,y:b.y+20}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+55,y:b.y+35}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await p.waitForTimeout(50);check(patches===count,'Cancelled touch saved');
 results.push('Arrastre directo desde el texto con dedo, sin modo previo; cancelación segura');
 const frame=await p.locator('.mural-canvas-viewport').boundingBox();const sx=frame.x+frame.width-25,sy=frame.y+frame.height*.65;
 const scrollBefore=await p.locator('.mural-canvas-viewport').evaluate(e=>({x:e.scrollLeft,y:e.scrollTop}));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy}]});
 for(let i=1;i<=5;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx-i*13,y:sy-i*22}]});await p.waitForTimeout(20);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(180);
 const scrollAfter=await p.locator('.mural-canvas-viewport').evaluate(e=>({x:e.scrollLeft,y:e.scrollTop}));
 check(scrollAfter.x>scrollBefore.x||scrollAfter.y>scrollBefore.y,'Background swipe did not pan');
 check(patches===count,'Panning saved note positions');results.push('Desplazamiento táctil del fondo en dos ejes sin cambiar notas');
 await p.reload();await p.locator('[data-note-id="1"]').waitFor({state:'visible'});
 const restored=await p.locator('[data-note-id="1"]').evaluate(e=>({left:e.offsetLeft,top:e.offsetTop}));
 check(Math.abs(restored.left-after.left)<=1&&Math.abs(restored.top-after.top)<=1,'Saved position not restored on reload');
 await p.locator('[data-note-id="1"] .mural-drag-handle').focus();patchFail=true;const old=await p.locator('[data-note-id="1"]').evaluate(e=>e.style.top);
 await p.keyboard.press('ArrowDown');await p.getByText('No se guardó el movimiento.',{exact:false}).waitFor();
 check(await p.locator('[data-note-id="1"]').evaluate(e=>e.style.top)===old,'Rollback failed');patchFail=false;
 results.push('Posición restaurada al recargar y rollback ante error de guardado');
 await p.getByRole('button',{name:'Dejar una nota',exact:true}).click();await p.locator('dialog[open]').waitFor();
 check(await p.locator('#mural-author').evaluate(e=>e===document.activeElement),'Composer initial focus');
 await p.locator('#mural-author').fill('Mi nombre');await p.locator('#mural-note').fill('Mi nota de prueba.');
 await p.locator('input[type=file]').setInputFiles({name:'recuerdo.png',mimeType:'image/png',buffer:Buffer.from(pixel.split(',')[1],'base64')});await p.locator('.photo-preview').waitFor();
 postFail=true;await p.getByRole('button',{name:'Publicar',exact:true}).click();await p.getByText('Intenta de nuevo',{exact:false}).waitFor();
 await p.getByRole('button',{name:'Cerrar',exact:true}).click();await p.getByRole('button',{name:'Dejar una nota',exact:true}).click();
 check(await p.locator('#mural-author').inputValue()==='Mi nombre','Closing lost author');
 check(await p.locator('.photo-preview').count()===1,'Closing lost image');
 postFail=false;await p.getByRole('button',{name:'Publicar',exact:true}).click();await p.locator('[data-note-id="901"]').waitFor({state:'visible'});
 check(await p.locator('dialog[open]').count()===0,'Successful publish should close composer');
 check(await p.locator('.mural-create-note').evaluate(e=>e===document.activeElement),'Focus did not return');
 results.push('Formulario breve, foto, error/borrador conservado y publicación que vuelve al lienzo');
 for(const width of [320,375,390,700,768,820,1024,1440,1920]){await p.setViewportSize({width,height:900});await p.waitForTimeout(40);
 const dims=await p.evaluate(()=>({width:document.documentElement.clientWidth,overflow:document.documentElement.scrollWidth,world:document.querySelector('.mural-canvas').clientWidth,viewport:document.querySelector('.mural-canvas-viewport').clientWidth}));
 check(dims.overflow<=dims.width&&dims.viewport<=dims.width,'Page overflow at '+width);check(dims.world===1600,'World changes by device');
 }results.push('320–1920 px sin desbordamiento de página; mismo lienzo en móvil y escritorio');
 await p.setViewportSize({width:1440,height:960});await p.locator('.mural-canvas-viewport').evaluate(e=>{e.scrollLeft=0;e.scrollTop=0;});
 const mouseBody=await p.locator('[data-note-id="1"] p').boundingBox();await p.mouse.move(mouseBody.x+50,mouseBody.y+20);await p.mouse.down();await p.mouse.move(mouseBody.x+80,mouseBody.y+45,{steps:5});await p.mouse.up();await p.waitForTimeout(80);
 check(patches>count+1,'Mouse body drag failed');results.push('Arrastre de notas con mouse desde cualquier parte');
 check(errors.length===0,'Runtime errors: '+errors.join(';'));return {results,patches,errors,realDatabaseWrites:0};
 }finally{await ctx.close();}
}
