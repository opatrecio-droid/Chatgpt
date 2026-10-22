const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const assert=(v,m)=>{if(!v)throw Error(m)};
(async()=>{
 const filename=process.argv[2],browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[],externals=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:\/\//,r=>{externals.push(r.request().url());return r.abort()});
  await page.setContent(fs.readFileSync(filename,'utf8'),{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>typeof webReady!=='undefined'&&webReady,{timeout:120000});
  const initial=await page.evaluate(()=>({total:ASSET_CATALOG.length,loaded:NATIVE_TEMPLATES.size,lazy:NATIVE_LAZY}));
  assert(initial.total>100&&initial.lazy&&initial.loaded===1,'The large catalog must load only one model initially');
  const check=await page.evaluate(async()=>{
   const packFilter=document.getElementById('native-pack-filter');packFilter.value=ASSET_CATALOG[0].pack;filterAssets();const collectionFilter=getFilteredAssets().every(a=>a.pack===packFilter.value)&&getFilteredAssets().length>0;packFilter.value='all';filterAssets();
   const chars=ASSET_CATALOG.filter(a=>a.category==='characters'),pets=ASSET_CATALOG.filter(a=>a.category==='pets'),vehicles=ASSET_CATALOG.filter(a=>a.category==='vehicles');
   const one=vehicles[0],two=pets[pets.length-1];await Promise.all([selectAsset(one.id),selectAsset(two.id)]);
   const latestSelection=state.selectedAssetId===two.id;
   await selectAsset(chars[0].id);await setEquippedPet(pets[0].id);const companion=!!companionPetGroup;
   await randomizeLoadoutCombo();const combo=ASSET_INDEX.get(state.selectedAssetId).category==='characters'&&!!companionPetGroup;
   clearLoadout();await generateWorldBiome('forest');const generated=customWorldProps.length>0&&customWorldProps.every(p=>p.userData.imported);
   clearCustomSceneProps();await selectAsset('web_characters_adventurer');
   return {collectionFilter,latestSelection,companion,combo,generated,loaded:NATIVE_TEMPLATES.size,selected:state.selectedAssetId,sha256:ASSET_INDEX.get(state.selectedAssetId).sha256};
  });
  assert(check.collectionFilter&&check.latestSelection&&check.companion&&check.combo&&check.generated,'Asynchronous selection, collection filter or scene controls failed');
  const pending=page.waitForEvent('download');await page.evaluate(()=>downloadNativeGLB());const download=await pending;const data=fs.readFileSync(await download.path());assert(crypto.createHash('sha256').update(data).digest('hex')===check.sha256,'Native GLB export differs from original');
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>onWindowResize());assert(await page.evaluate(()=>document.body.scrollWidth)<=390,'Mobile overflow');
  const drawers=await page.evaluate(()=>{const left=document.getElementById('left-sidebar'),right=document.getElementById('right-sidebar');const initiallyClosed=left.classList.contains('hidden')&&right.classList.contains('hidden');toggleSidebar('left');const libraryOpen=!left.classList.contains('hidden')&&right.classList.contains('hidden');toggleSidebar('right');const inspectorOpen=left.classList.contains('hidden')&&!right.classList.contains('hidden');toggleSidebar('right');return {initiallyClosed,libraryOpen,inspectorOpen};});
  assert(drawers.initiallyClosed&&drawers.libraryOpen&&drawers.inspectorOpen,'Mobile drawers overlap');
  assert(!errors.length&&!externals.length,JSON.stringify({errors,externals}));
  const report={initial,check,drawers,originalGLBExport:true,mobileWidth:390,errors,externals};
  fs.writeFileSync(filename.replace(/\.html$/,'.features.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
