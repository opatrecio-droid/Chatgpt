/* Authored GLB models: preserve original geometry, materials, skins and clips. */
const NATIVE_TEMPLATES=new Map(), NATIVE_GEOMETRIES=new Set(), NATIVE_ACTORS=new WeakMap();
const NATIVE_PENDING=new Map(), NATIVE_LAZY=WEB_CATALOG.length>100;
const CATEGORY_LABELS={characters:'Personagem',pets:'Animal',nature:'Natureza',props:'Objeto',items:'Equipamento',vehicles:'Veículo'};
let selectedNativeMaterial=0, webReady=false;
let nativeNarrowViewport=innerWidth<1024;
const nativeOriginalResize=onWindowResize;
onWindowResize=function(){
    const narrow=innerWidth<1024;
    if(narrow!==nativeNarrowViewport){
        for(const id of ['left-sidebar','right-sidebar'])document.getElementById(id).classList.toggle('hidden',narrow);
        nativeNarrowViewport=narrow;
    }
    nativeOriginalResize();
    if (window.PolyForgeBiomes) window.PolyForgeBiomes.resize();
};
toggleSidebar=function(side){
    const panel=document.getElementById(side==='left'?'left-sidebar':'right-sidebar');
    if(innerWidth<1024&&panel.classList.contains('hidden'))document.getElementById(side==='left'?'right-sidebar':'left-sidebar').classList.add('hidden');
    panel.classList.toggle('hidden');setTimeout(onWindowResize,50);
};
async function decodeModelData(data){const binary=atob(data),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);if(bytes[0]===31&&bytes[1]===139){const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return new Response(stream).arrayBuffer();}return bytes.buffer;}
async function parseNativeGLB(data){const buffer=await decodeModelData(data);return new Promise((resolve,reject)=>new THREE.GLTFLoader().parse(buffer,'',resolve,reject));}
async function ensureNativeAsset(id){
    if(NATIVE_TEMPLATES.has(id))return NATIVE_TEMPLATES.get(id);
    if(NATIVE_PENDING.has(id))return NATIVE_PENDING.get(id);
    const pending=parseNativeGLB(WEB_MODEL_DATA[id]).then(result=>{
        result.scene.traverse(node=>{if(node.isMesh)NATIVE_GEOMETRIES.add(node.geometry)});
        NATIVE_TEMPLATES.set(id,result);NATIVE_PENDING.delete(id);return result;
    }).catch(error=>{NATIVE_PENDING.delete(id);throw error;});
    NATIVE_PENDING.set(id,pending);return pending;
}
function canonicalClipName(name){return name.split('|').pop().replace(/(?:\.\d{3})$/,'').replace(/_/g,' ').trim();}
function distinctNativeClips(clips){const unique=new Map();for(const clip of clips){const key=canonicalClipName(clip.name).toLowerCase();if(!unique.has(key)||!clip.name.includes('|'))unique.set(key,clip);}return [...unique.values()];}
function normalizeNativeScene(visual,asset,config={}){
    const root=new THREE.Group();root.name='Downloaded_'+asset.id;root.userData.imported=true;root.userData.assetId=asset.id;root.add(visual);
    visual.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(visual),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    const target=asset.category==='characters'?2:asset.category==='pets'?1.7:asset.category==='nature'?3:2;
    const denominator=asset.category==='characters'?size.y:Math.max(size.x,size.y,size.z);
    if(!Number.isFinite(denominator)||denominator<=0)throw new Error('Modelo sem geometria válida: '+asset.name);
    const scale=target/denominator;visual.scale.multiplyScalar(scale);visual.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
    if(asset.rotationY)visual.rotation.y=asset.rotationY;
    root.scale.set(config.scaleX||1,config.scaleY||1,config.scaleZ||1);
    return root;
}
function createNativeAnimator(root,clips){
    clips=distinctNativeClips(clips);const mixer=new THREE.AnimationMixer(root);let active=null,lastState=null;
    const find=state=>{
        if(state.startsWith('clip:'))return clips.find(c=>c.name===state.slice(5));
        const names=clips.map(c=>[c,canonicalClipName(c.name).toLowerCase()]);
        const exact=names.find(([c,n])=>state==='idle'&&n==='idle');if(exact)return exact[0];
        const patterns={idle:/idle neutral|idle$|stand|breath/,walk:/^walk$|^run$|gallop$/,jump:/jump/,action:/attack|slash|punch|kick|shoot|cast/};
        return names.find(([c,n])=>patterns[state]?.test(n))?.[0];
    };
    const play=state=>{
        if(lastState===state)return;lastState=state;const clip=find(state==='spin'?'idle':state)||find('idle');
        if(!clip){active?.fadeOut(.15);active=null;return;}
        const next=mixer.clipAction(clip);if(next===active)return;
        next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(.16).play();active?.fadeOut(.16);active=next;
    };
    return {mixer,clips,find,play,update:(dt)=>mixer.update(Math.max(0,Math.min(dt,.1))),dispose:()=>{mixer.stopAllAction();mixer.uncacheRoot(root);}};
}
function buildDownloadedModel(id,config={}){
    const asset=ASSET_INDEX.get(id),template=NATIVE_TEMPLATES.get(id);if(!asset||!template)throw new Error('Arquivo GLB não carregado: '+id);
    const visual=THREE.SkeletonUtils.clone(template.scene),materials=new Map();
    visual.traverse(mesh=>{if(!mesh.isMesh)return;const clone=m=>{if(!materials.has(m))materials.set(m,m.clone());return materials.get(m)};mesh.material=Array.isArray(mesh.material)?mesh.material.map(clone):clone(mesh.material);mesh.castShadow=true;mesh.receiveShadow=true;});
    const root=normalizeNativeScene(visual,asset,config),actor=createNativeAnimator(root,template.animations);NATIVE_ACTORS.set(root,actor);
    const attack=actor.find('action');root.userData.combatType=attack&&/gun|shoot/i.test(attack.name)?'gun':'melee';
    return root;
}
function nativeMaterials(){const unique=new Set();currentModelGroup?.traverse(node=>{if(node.isMesh)(Array.isArray(node.userData.originalMaterial||node.material)?(node.userData.originalMaterial||node.material):[node.userData.originalMaterial||node.material]).forEach(m=>unique.add(m));});return [...unique];}
function inputColor(color){return '#'+color.clone().convertLinearToSRGB().getHexString();}
function syncNativeMaterial(){
    const materials=nativeMaterials(),m=materials[selectedNativeMaterial];if(!m)return;
    document.getElementById('color-primary').value=inputColor(m.color||new THREE.Color());
    for(const [key,value] of [['roughness',m.roughness??.6],['metalness',m.metalness??0],['emissive',m.emissiveIntensity??0]]){
        const el=document.getElementById('mat-'+key);el.value=Math.min(Number(el.max),value);document.getElementById('val-'+key).textContent=value.toFixed(2);
    }
}
function populateNativeMaterialChoices(){
    const select=document.getElementById('native-material');select.replaceChildren();selectedNativeMaterial=0;
    nativeMaterials().forEach((material,i)=>select.add(new Option(material.name||'Material '+(i+1),String(i))));syncNativeMaterial();
}
function syncNativeAnimations(){
    const actor=NATIVE_ACTORS.get(currentModelGroup),select=document.getElementById('native-clip');select.replaceChildren();select.add(new Option('Escolha um clipe original…',''));
    actor?.clips.forEach(clip=>select.add(new Option(canonicalClipName(clip.name),clip.name)));
    document.getElementById('native-animation-status').textContent=actor?.clips.length?actor.clips.length+' clipes originais disponíveis':'Arquivo estático · sem clipes de animação';select.disabled=!actor?.clips.length;
    document.querySelectorAll('.anim-btn').forEach(btn=>{const supported=['idle','spin'].includes(btn.dataset.anim)||!!actor?.find(btn.dataset.anim);btn.disabled=!supported;btn.style.opacity=supported?'1':'.35';btn.title=supported?'':'O arquivo não contém um clipe correspondente';});
    const manual=document.querySelector('button[onclick="triggerManualAttackBurst()"]');if(manual){manual.disabled=!actor?.find('action');manual.style.opacity=manual.disabled?'.35':'1';}
}
function nativeLicenseLabel(asset){const code=String(asset?.license||'').replace(/\s/g,'').toUpperCase();return ({'CC0-1.0':'CC0 1.0','CC-BY-3.0':'CC BY 3.0','CC-BY-4.0':'CC BY 4.0'})[code]||asset?.license||'Licença não informada';}
function nativeStyleLabel(style){return ({lowpoly:'Low-poly estilizado',cartoon:'Cartoon / chibi',voxel:'Voxel',realistic:'Realista',unclassified:'Sem classificação de estilo'})[style]||style||'Sem classificação de estilo';}
function nativeStyleKey(asset){const raw=String(asset?.artStyle||asset?.style||'unclassified').toLowerCase().replace(/[ _]/g,'-');return ['lowpoly','low-poly','stylized-low-poly'].includes(raw)?'lowpoly':['cartoon','chibi','cartoon-chibi'].includes(raw)?'cartoon':(['voxel','realistic','unclassified'].includes(raw)?raw:raw||'unclassified');}
function nativeCredits(asset){return `Título: ${asset.name}\nAutor: ${asset.author}\nFonte: ${asset.sourcePage}\nLicença: ${nativeLicenseLabel(asset)} (${asset.licenseUrl})`;}
function nativeExternalURL(value){return /^https?:\/\//i.test(String(value||''))?String(value):'#';}
function nativeScriptJSON(value){return JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
async function downloadNativeGLB(){const asset=ASSET_INDEX.get(state.selectedAssetId),blob=new Blob([await decodeModelData(WEB_MODEL_DATA[asset.id])],{type:'model/gltf-binary'});downloadNativeBlob(blob,asset.id+'.glb');downloadNativeBlob(new Blob([nativeCredits(asset)+'\n'],{type:'text/plain;charset=utf-8'}),asset.id+'-creditos.txt');}
function downloadNativeBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function nativeCategoryRecipe(key){
    const tags={forest:['tree','pine','fern','bush','grass','mushroom'],desert:['palm','rock','crystal'],tundra:['pine','rock','dead'],ocean:['palm','canoe','rock'],crystal:['crystal','rock','flower'],medieval:['tent','sign','bridge','obelisk','campfire'],swamp:['dead','fern','grass'],jungle:['tree','palm','fern','plant']};
    const words=tags[key]||tags.forest;return ASSET_CATALOG.filter(a=>['nature','props','vehicles'].includes(a.category)&&words.some(word=>(a.id+' '+a.name).toLowerCase().includes(word)));
}

async function bootDownloadedStudio(){
    const overlay=document.getElementById('native-loading'),progress=document.getElementById('native-progress');
    try{
        let completed=0,cursor=0;
        const starterAsset=WEB_CATALOG.find(a=>a.category==='characters'&&/adventur/i.test([a.id,a.name,a.originalModelName].join(' ')))||WEB_CATALOG.find(a=>a.category==='characters')||WEB_CATALOG[0];
        const startup=NATIVE_LAZY?[starterAsset]:WEB_CATALOG;
        await Promise.all(Array.from({length:3},async()=>{while(cursor<startup.length){const asset=startup[cursor++];await ensureNativeAsset(asset.id);
            progress.textContent=++completed+' / '+startup.length+' arquivos iniciais carregados';await new Promise(resolve=>setTimeout(resolve,0));}}));
        ASSET_CATALOG.splice(0,ASSET_CATALOG.length,...WEB_CATALOG.map(asset=>({...asset,defaultColors:{primary:'#b6bdc9',secondary:'#65718b',accent:'#d6b478'},roughness:.6,metalness:0,emissive:0,categoryLabel:CATEGORY_LABELS[asset.category],icon:({characters:'fa-person',pets:'fa-paw',nature:'fa-tree',props:'fa-cube',items:'fa-shield-halved',vehicles:'fa-ship'})[asset.category]})));
        ASSET_INDEX.clear();ASSET_CATALOG.forEach(a=>ASSET_INDEX.set(a.id,a));
        state.selectedAssetId=ASSET_CATALOG.find(a=>a.category==='characters'&&/adventur/i.test([a.id,a.name,a.originalModelName].join(' ')))?.id||ASSET_CATALOG.find(a=>a.category==='characters')?.id||ASSET_CATALOG[0].id;state.equippedItemId='';state.equippedPetId='';
        const initial=state.selectedAssetId;const oldSelect=selectAsset;let selectionVersion=0;
        selectAsset=function(id){
            if(!ASSET_INDEX.has(id))return;
            const version=++selectionVersion;
            const apply=()=>{if(version!==selectionVersion)return;PolyForgeBiomes.clear();PolyForgeBiomes.restoreCamera();oldSelect(id);populateNativeMaterialChoices();syncNativeAnimations();updateNativeProvenance();};
            if(NATIVE_TEMPLATES.has(id))return apply();
            showToast('Abrindo '+ASSET_INDEX.get(id).name+'…');
            return ensureNativeAsset(id).then(apply).catch(error=>{console.error(error);showToast('Falha ao abrir '+ASSET_INDEX.get(id).name);});
        };
        for(const name of ['setEquippedPet','setEquippedItem']){
            const original=window[name];
            if(typeof original==='function')window[name]=function(id){if(!id||NATIVE_TEMPLATES.has(id))return original(id);return ensureNativeAsset(id).then(()=>original(id));};
        }
        initThreeJS();PolyForgeBiomes.attachRenderer(renderer);selectAsset(initial);webReady=true;overlay.remove();
        const authorFilter=document.getElementById('library-biome');authorFilter.replaceChildren(new Option('Todos os autores','all'),... [...new Set(ASSET_CATALOG.map(a=>a.author))].sort((a,b)=>a.localeCompare(b)).map(author=>new Option(author,author)));
        if(ASSET_CATALOG.length>100){
            const collection=document.createElement('select');collection.id='native-pack-filter';collection.className='library-biome';collection.setAttribute('aria-label','Filtrar coleção');
            collection.add(new Option('Todas as coleções','all'));
            [...new Set(ASSET_CATALOG.map(a=>a.pack))].sort((a,b)=>a.localeCompare(b)).forEach(pack=>collection.add(new Option(pack,pack)));
            collection.onchange=()=>filterAssets();document.getElementById('library-biome').after(collection);
        }
        const styleFilter=document.createElement('select');styleFilter.id='native-style-filter';styleFilter.className='library-biome';styleFilter.setAttribute('aria-label','Filtrar por estilo visual');styleFilter.add(new Option('Todos os estilos','all'));
        const styles=[...new Set(ASSET_CATALOG.map(nativeStyleKey))].sort((a,b)=>{
            const order=['lowpoly','cartoon','voxel','realistic','unclassified'];
            const ai=order.indexOf(a),bi=order.indexOf(b);
            return (ai<0?order.length:ai)-(bi<0?order.length:bi)||a.localeCompare(b);
        });
        for(const style of styles)styleFilter.add(new Option(nativeStyleLabel(style),style));
        styleFilter.onchange=()=>{filterAssets();syncBiomeAvailability(styleFilter.value);};const packFilter=document.getElementById('native-pack-filter');(packFilter||authorFilter).after(styleFilter);
        const biomeSelect=document.getElementById('biome-select');
        const componentLabels={canopy:'copas',undergrowth:'sub-bosque',stone:'rochas'};
        const availabilityNote=document.createElement('small');availabilityNote.id='biome-availability';availabilityNote.className='text-[9px] text-slate-400';
        biomeSelect.parentElement.after(availabilityNote);
        function syncBiomeAvailability(style){
            const current=biomeSelect.value,biomeAvailability=PolyForgeBiomes.availability(style);
            biomeSelect.replaceChildren(new Option('Bioma completo: Estúdio','none'));
            for(const biome of biomeAvailability.available)biomeSelect.add(new Option('Bioma completo: '+biome.label,biome.key));
            availabilityNote.textContent='Completos: '+(biomeAvailability.available.map(b=>b.label).join(', ')||'nenhum bioma neste estilo')+' · Indisponíveis por falta de componentes: '+Object.entries(biomeAvailability.unavailable).map(([key,message])=>{const missing=message.match(/para (.+?)\./)?.[1]||'componentes';return PolyForgeBiomes.definitions[key].label+' ('+missing.split(', ').map(role=>componentLabels[role]||role).join(', ')+')';}).join(', ');
            if(current!=='none'&&!biomeAvailability.available.some(b=>b.key===current)){clearCustomSceneProps();biomeSelect.value='none';}
            else biomeSelect.value=current;
        }
        syncBiomeAvailability(styleFilter.value);
        const biomeExport=document.createElement('button');biomeExport.id='biome-export-json';biomeExport.type='button';biomeExport.className='library-biome';biomeExport.textContent='Exportar decomposição do bioma (.json)';biomeExport.onclick=async()=>{try{const result=await PolyForgeBiomes.exportScene();downloadNativeBlob(new Blob([result.json],{type:'application/json;charset=utf-8'}),'bioma-'+(PolyForgeBiomes.info()?.key||'cena')+'.json');if(result.gltf)downloadNativeBlob(new Blob([result.gltf],{type:'model/gltf-binary'}),'bioma-'+(PolyForgeBiomes.info()?.key||'cena')+'.glb');}catch(error){showToast(error.message);}};
        document.getElementById('scene-prop-count').parentElement.after(biomeExport);
        document.getElementById('native-count').textContent=ASSET_CATALOG.length+' modelos de autores';
        document.querySelectorAll('.cat-btn').forEach(button=>{button.hidden=button.dataset.cat!=='all'&&!ASSET_CATALOG.some(a=>a.category===button.dataset.cat);});
        const equipment=document.getElementById('equip-item-select');if(!ASSET_CATALOG.some(a=>a.category==='items')){equipment.parentElement.hidden=true;document.getElementById('hud-item-badge').hidden=true;}
        renderAssetList();
    }catch(error){console.error(error);overlay.innerHTML='<div class="glass-panel native-error"><strong>Não foi possível abrir os arquivos 3D.</strong><p>'+escapeAssetHTML(error.message)+'</p><button onclick="location.reload()">Tentar novamente</button></div>';}
}

buildProceduralModel=buildDownloadedModel;
animateProceduralModel=function(group,animState,time,speed=1){if(!group)return;const actor=NATIVE_ACTORS.get(group);if(!actor)return;
    actor.play(animState);const previous=actor.lastTime;actor.lastTime=time;if(!state.webPaused)actor.update(previous===undefined?0:(time-previous)*speed);
    if(animState==='spin'&&!group.userData.isSandboxControlled)group.rotation.y=time*.65;
};
disposeModel=function(group){if(!group)return;NATIVE_ACTORS.get(group)?.dispose();const mats=new Set(),geometries=new Set();group.traverse(node=>{if(!node.isMesh)return;if(!NATIVE_GEOMETRIES.has(node.geometry))geometries.add(node.geometry);[node.material,node.userData.originalMaterial,node.userData.clayMaterial].flat().filter(Boolean).forEach(m=>mats.add(m));});geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());};
getAssetFamilyKey=asset=>asset?.id||'';getAssetFamilyName=asset=>asset.name;
syncFamilyVariants=()=>document.getElementById('family-variants')?.classList.add('hidden');
getFilteredAssets=function(){const query=normalizeSearch(document.getElementById('search-input').value.trim()),author=document.getElementById('library-biome').value,pack=document.getElementById('native-pack-filter')?.value||'all',style=document.getElementById('native-style-filter')?.value||'all';return ASSET_CATALOG.filter(a=>(state.selectedCategory==='all'||a.category===state.selectedCategory)&&(author==='all'||a.author===author)&&(pack==='all'||a.pack===pack)&&(style==='all'||nativeStyleKey(a)===style)&&(!query||normalizeSearch(a.name+' '+a.originalModelName+' '+a.pack+' '+(a.tags||[]).join(' ')+' '+a.author+' '+a.description+' '+a.categoryLabel+' '+nativeStyleLabel(nativeStyleKey(a))).includes(query)));};
renderAssetList=function(){
    const all=getFilteredAssets(),pages=Math.max(1,Math.ceil(all.length/libraryState.pageSize));libraryState.page=Math.max(1,Math.min(pages,libraryState.page));const start=(libraryState.page-1)*libraryState.pageSize,visible=all.slice(start,start+libraryState.pageSize);
    document.getElementById('catalog-count-label').textContent='Biblioteca · '+all.length;
    document.getElementById('asset-list').innerHTML=visible.map(a=>`<button id="${escapeAssetHTML(a.id)}" type="button" onclick="selectAsset(${escapeAssetHTML(nativeScriptJSON(a.id))})" aria-pressed="${a.id===state.selectedAssetId}" class="asset-card ${a.id===state.selectedAssetId?'active':''} native-asset-card"><span class="native-thumbnail">${WEB_THUMBNAILS[a.id]?'<img src="'+WEB_THUMBNAILS[a.id]+'" alt="" loading="lazy">':'<i class="fa-solid '+a.icon+'"></i>'}</span><span class="native-asset-text"><strong>${escapeAssetHTML(a.name)}</strong><small>${escapeAssetHTML(a.categoryLabel)} · ${escapeAssetHTML(a.author)}</small><span>${escapeAssetHTML(nativeLicenseLabel(a))} · ${escapeAssetHTML(nativeStyleLabel(nativeStyleKey(a)))} ${(a.animationCount||distinctNativeClips(NATIVE_TEMPLATES.get(a.id)?.animations||[]).length)?'· animado':''}</span></span></button>`).join('')||'<p class="library-empty">Nenhum modelo encontrado.</p>';
    document.getElementById('library-pagination').innerHTML=`<button onclick="setAssetPage(${libraryState.page-1})" ${libraryState.page===1?'disabled':''}>←</button><span>${all.length?start+1:0}–${Math.min(start+72,all.length)} · ${libraryState.page}/${pages}</span><button onclick="setAssetPage(${libraryState.page+1})" ${libraryState.page===pages?'disabled':''}>→</button>`;
};
showExpansionAssets=function(){document.getElementById('library-biome').value='all';setCategory('all');};
populateLoadoutSelects=function(){
    for(const [id,cat,label] of [['equip-pet-select','pets','Animal companheiro'],['equip-item-select','items','Equipamento']]){const select=document.getElementById(id);const assets=ASSET_CATALOG.filter(a=>a.category===cat);assets.forEach(asset=>select.add(new Option(asset.name,asset.id)));select.disabled=!assets.length;select.previousElementSibling.textContent=label+' · '+assets.length+' arquivos';if(!assets.length)select.options[0].textContent='Nenhum arquivo compatível nesta coleção';}
};
updateModelAppearance=function(){if(!currentModelGroup)return;const material=nativeMaterials()[selectedNativeMaterial];if(!material)return;
    if(material.color)material.color.set(document.getElementById('color-primary').value).convertSRGBToLinear();
    for(const key of ['roughness','metalness','emissive']){const value=parseFloat(document.getElementById('mat-'+key).value);document.getElementById('val-'+key).textContent=value.toFixed(2);if(key==='emissive')material.emissiveIntensity=value;else if(key in material)material[key]=value;}
    material.flatShading=document.getElementById('mat-flatshading').checked;material.needsUpdate=true;
};
resetCurrentModelSettings=function(){selectAsset(state.selectedAssetId);};
randomizeCurrentModel=function(){const material=nativeMaterials()[selectedNativeMaterial];if(!material)return;document.getElementById('color-primary').value='#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');updateModelAppearance();};
applyColorPreset=function(p,s,a){document.getElementById('color-primary').value=p;updateModelAppearance();};
triggerManualAttackBurst=function(){if(!NATIVE_ACTORS.get(currentModelGroup)?.find('action'))return;setAnimation('action');};
const clearStudioScene=clearCustomSceneProps;
clearCustomSceneProps=function(){PolyForgeBiomes?.clear();clearStudioScene();};
updateScenePropCounter=function(){const info=PolyForgeBiomes?.info(),extra=info?.instances||0,models=customWorldProps.length+extra,files=info?.sourceFiles||0;document.getElementById('scene-prop-count').textContent=`Cena: ${models} · Bioma: ${extra} / ${files} GLBs`;};
generateWorldBiome=async function(key,options={}){clearCustomSceneProps();state.activeBiome=key;const selector=document.getElementById('biome-select');if(selector)selector.value=key;if(key==='none'){updateScenePropCounter();return;}const requestedStyle=options.style||document.getElementById('native-style-filter')?.value||'all';try{const result=await PolyForgeBiomes.generate(key,{...options,style:requestedStyle});if(state.activeBiome!==key)return;updateScenePropCounter();showToast(`${result.label}: ${result.instances} instâncias de ${result.sourceFiles} GLBs · estilo ${nativeStyleLabel(result.style)}`);return result;}catch(error){if(error.name==='AbortError')return null;showToast(error.message);updateScenePropCounter();return null;}};
function updateNativeProvenance(){
    const asset=ASSET_INDEX.get(state.selectedAssetId);if(!asset)return;
    document.getElementById('hud-model-index').textContent='Arquivo GLB';document.getElementById('hud-model-desc').textContent=asset.author+' · materiais originais · '+asset.license;
    document.getElementById('native-provenance').innerHTML='<strong>'+escapeAssetHTML(asset.name)+' · '+escapeAssetHTML(asset.author)+'</strong><span>'+escapeAssetHTML(asset.pack)+' · '+escapeAssetHTML(nativeStyleLabel(nativeStyleKey(asset)))+'</span><a href="'+escapeAssetHTML(nativeExternalURL(asset.sourcePage))+'" target="_blank" rel="noopener noreferrer">Fonte do autor ↗</a><a href="'+escapeAssetHTML(nativeExternalURL(asset.licenseUrl))+'" target="_blank" rel="noopener noreferrer">'+escapeAssetHTML(nativeLicenseLabel(asset))+' ↗</a><small>Origem do estilo: '+escapeAssetHTML(asset.styleSource||'revisão pendente')+' Malha, materiais e animações originais. Autor, fonte e licença acompanham a exportação.</small>';
}
generateThreeJSSnippet=function(){const a=ASSET_INDEX.get(state.selectedAssetId);return `// ${a.name} — ${a.author}\n// Fonte: ${a.sourcePage}\n// Licença: ${a.license} (${a.licenseUrl})\n// Use Three.js r128 + GLTFLoader. O GLB original contém seus próprios materiais.\nconst loader = new THREE.GLTFLoader();\nloader.load('${a.file}', (gltf) => {\n    scene.add(gltf.scene);\n    const mixer = new THREE.AnimationMixer(gltf.scene);\n    if (gltf.animations.length) mixer.clipAction(gltf.animations[0]).play();\n    // No loop: mixer.update(deltaEmSegundos);\n});`;};
window.onload=bootDownloadedStudio;
downloadStarterGameHTML=function(){
    const selected=ASSET_INDEX.get(state.selectedAssetId),pet=ASSET_INDEX.get(state.equippedPetId);
    const records=[selected,...(pet&&selected.category==='characters'?[pet]:[])].map(meta=>({meta,data:WEB_MODEL_DATA[meta.id]}));
    const credits=records.map(r=>`<p><strong>${escapeAssetHTML(r.meta.name)}</strong> · ${escapeAssetHTML(r.meta.author)} · <a href="${escapeAssetHTML(nativeExternalURL(r.meta.sourcePage))}" target="_blank" rel="noopener">Fonte</a> · <a href="${escapeAssetHTML(nativeExternalURL(r.meta.licenseUrl))}" target="_blank" rel="noopener">${escapeAssetHTML(nativeLicenseLabel(r.meta))}</a></p>`).join('');
    const source=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeAssetHTML(selected.name)} · cena GLB</title><style>body{margin:0;background:#101622;color:#e7ecf7;font:14px system-ui;overflow:hidden}aside{position:fixed;left:18px;top:18px;max-width:440px;background:#111b2de8;padding:16px;border:1px solid #354258;border-radius:12px}h1{font-size:16px;margin:0 0 8px}p{font-size:12px;color:#acb9d0;margin:5px 0}aside a{color:#a5b4fc}</style><aside><h1>${escapeAssetHTML(selected.name)}</h1><p>WASD: mover · Espaço: pular · E: ação, quando o arquivo possui um clipe</p><h2>Créditos dos modelos</h2>${credits}<p id="status">Carregando GLB…</p></aside><script src="${WEB_DEPENDENCIES.three}"><\/script><script src="${WEB_DEPENDENCIES.gltf}"><\/script><script>
${decodeModelData.toString()}
${parseNativeGLB.toString()}
${canonicalClipName.toString()}
${distinctNativeClips.toString()}
${normalizeNativeScene.toString()}
${createNativeAnimator.toString()}
const records=${nativeScriptJSON(records)};
const scene=new THREE.Scene();scene.background=new THREE.Color(0x101622);
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.05,300);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;document.body.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xdde9ff,0x2c2838,.9));const key=new THREE.DirectionalLight(0xffefdf,1.2);key.position.set(4,9,6);key.castShadow=true;scene.add(key);const rim=new THREE.DirectionalLight(0x9fc6ff,.8);rim.position.set(-4,5,-6);scene.add(rim);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshStandardMaterial({color:0x242e42,roughness:.95}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);scene.add(new THREE.GridHelper(140,70,0x55658a,0x2b384f));
const keys={};addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Space')e.preventDefault()});addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
let player,pet,actor,petActor,velY=0,onGround=true;const clock=new THREE.Clock();
(async()=>{for(let i=0;i<records.length;i++){const record=records[i],gltf=await parseNativeGLB(record.data),root=normalizeNativeScene(gltf.scene,record.meta);const animation=createNativeAnimator(root,gltf.animations);scene.add(root);if(i===0){player=root;actor=animation;}else{pet=root;pet.scale.setScalar(.72);petActor=animation;}}document.getElementById('status').textContent=actor.clips.length+' clipes originais disponíveis';camera.position.set(0,3.4,6);function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.1);let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),dz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0),animation='idle';if(dx||dz){const length=Math.hypot(dx,dz);dx/=length;dz/=length;player.position.x+=dx*4*dt;player.position.z+=dz*4*dt;player.rotation.y=Math.atan2(dx,dz);animation='walk';}if(keys.Space&&onGround){velY=7;onGround=false;}velY-=20*dt;player.position.y+=velY*dt;if(player.position.y<=0){player.position.y=0;onGround=true;velY=0;}if(!onGround)animation='jump';if(keys.KeyE)animation='action';actor.play(animation);actor.update(dt);if(pet){pet.position.lerp(new THREE.Vector3(player.position.x-1.3,0,player.position.z-.7),Math.min(1,dt*5));pet.rotation.y=player.rotation.y;petActor.play(animation);petActor.update(dt);}camera.position.lerp(new THREE.Vector3(player.position.x+1.8,player.position.y+3.1,player.position.z+6),Math.min(1,dt*5));camera.lookAt(player.position.x,player.position.y+1,player.position.z);renderer.render(scene,camera);}loop();})().catch(e=>document.getElementById('status').textContent='Erro ao carregar: '+e.message);
<\/script></html>`;
    downloadNativeBlob(new Blob([source],{type:'text/html;charset=utf-8'}),'cena-glb-'+selected.id+'.html');
};

randomizeLoadoutCombo=async function(){const chars=ASSET_CATALOG.filter(a=>a.category==='characters'),pets=ASSET_CATALOG.filter(a=>a.category==='pets');if(!chars.length)return;const hero=chars[Math.floor(Math.random()*chars.length)],pet=pets[Math.floor(Math.random()*pets.length)];await Promise.all([hero,pet].filter(Boolean).map(a=>ensureNativeAsset(a.id)));state.equippedPetId=pet?.id||'';state.equippedItemId='';document.getElementById('equip-pet-select').value=state.equippedPetId;document.getElementById('hud-pet-badge').textContent=pet?'Animal: '+pet.name:'Animal: nenhum';selectAsset(hero.id);showToast(hero.name+(pet?' + '+pet.name:''));};
exportToOBJ=function(){if(!currentModelGroup)return;const credited=[ASSET_INDEX.get(state.selectedAssetId),ASSET_INDEX.get(state.equippedPetId)].filter(Boolean);let output='# Geometria estática na pose atual. Materiais, rig e animações estão no GLB original.\n'+credited.map(a=>'# '+nativeCredits(a).replace(/\n/g,'\n# ')).join('\n')+'\n',offset=1;for(const group of [currentModelGroup,companionPetGroup].filter(Boolean)){group.updateMatrixWorld(true);group.traverse(mesh=>{if(!mesh.isMesh||!mesh.geometry.attributes.position)return;if(mesh.isSkinnedMesh)mesh.skeleton.update();const pos=mesh.geometry.attributes.position,index=mesh.geometry.index,v=new THREE.Vector3();output+='o '+(mesh.name||'parte')+'\n';for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);if(mesh.isSkinnedMesh)mesh.boneTransform(i,v);v.applyMatrix4(mesh.matrixWorld);output+='v '+v.x.toFixed(6)+' '+v.y.toFixed(6)+' '+v.z.toFixed(6)+'\n';}const count=index?index.count:pos.count;for(let i=0;i<count;i+=3){const vertex=j=>(index?index.getX(j):j)+offset;output+='f '+vertex(i)+' '+vertex(i+1)+' '+vertex(i+2)+'\n';}offset+=pos.count;});}downloadNativeBlob(new Blob([output],{type:'text/plain'}),'pose-'+state.selectedAssetId+'.obj');};
