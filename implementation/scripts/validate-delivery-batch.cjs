const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const filename=path.resolve(process.argv[2]),root=path.resolve(__dirname,'..');
 const expected=JSON.parse(fs.readFileSync(filename.replace(/\.html$/,'.catalog.json'),'utf8'));
 const requested=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):expected;
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],externals=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:\/\//,r=>{externals.push(r.request().url());return r.abort()});
  await page.setContent(fs.readFileSync(filename,'utf8'),{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>typeof webReady!=='undefined'&&webReady,{timeout:120000});
  const ids=await page.evaluate(()=>ASSET_CATALOG.map(a=>a.id));
  if(ids.length!==expected.length||expected.some(a=>!ids.includes(a.id)))throw Error('The cumulative catalog lost or duplicated a model');
  if(!requested.length||requested.length%10)throw Error('Additions must form complete groups of models');
  const results=[];
  for(const {id} of requested){
   const result=await page.evaluate(async id=>{
    await selectAsset(id);const source=new Set();NATIVE_TEMPLATES.get(id).scene.traverse(n=>{if(n.isMesh)source.add(n.geometry)});
    let meshes=0,preserved=true,triangles=0,textures=0;currentModelGroup.traverse(n=>{if(!n.isMesh)return;meshes++;preserved=preserved&&source.has(n.geometry);triangles+=(n.geometry.index?.count||n.geometry.attributes.position.count)/3;for(const m of [n.material].flat())if(m.map)textures++;});
    const bounds=new THREE.Box3().setFromObject(currentModelGroup).getSize(new THREE.Vector3()).toArray();
    renderer.setSize(360,360,false);camera.aspect=1;camera.updateProjectionMatrix();setCameraView('perspective');renderer.render(scene,camera);
    return {id,meshes,triangles,textures,preserved,bounds,gl:renderer.getContext().getError(),thumbnail:renderer.domElement.toDataURL('image/jpeg',.84).split(',')[1]};
   },id);
   if(!result.meshes||!result.preserved||result.gl||!result.bounds.every(Number.isFinite)||Math.max(...result.bounds)<=0)throw Error('Invalid model '+id);
   fs.writeFileSync(path.join(root,'assets/thumbnails',id+'.jpg'),Buffer.from(result.thumbnail,'base64'));delete result.thumbnail;results.push(result);
  }
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>onWindowResize());
  if(await page.evaluate(()=>document.body.scrollWidth)>390)throw Error('Mobile layout overflow');
  if(errors.length||externals.length)throw Error(JSON.stringify({errors,externals}));
  const report={catalogueCount:ids.length,models:results,errors,externalRequests:externals,mobileWidth:390};
  fs.writeFileSync(filename.replace(/\.html$/,'.validation.json'),JSON.stringify(report,null,2));
  console.log('Validated catalog:',ids.length,'models;',requested.length,'additions render correctly; no external requests; desktop/mobile OK');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
