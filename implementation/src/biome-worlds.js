/* Complete biome compositions built from original catalog GLBs plus an explicitly
 * procedural terrain stage. Loading this file does not change the model catalog. */
(function (root) {
    'use strict';

    const definitions = {
        forest: { label: 'Floresta temperada', ground: 0x607c48, top: 0x789557, water: null, roles: { canopy: ['tree','oak','birch','maple','beech','willow'], undergrowth: ['bush','fern','mushroom','flower','grass','shrub'], stone: ['rock','stone','boulder','stump','log'], fauna: ['deer','fox','wolf','bear','rabbit','bird','boar','squirrel'] }, forbid: ['palm','cactus','snow','ice','coral','fish','building','human','person','character'] },
        desert: { label: 'Deserto', ground: 0xb99258, top: 0xd1b678, water: null, roles: { canopy: ['cactus','palm','yucca','succulent'], undergrowth: ['dry grass','desert plant','agave','shrub'], stone: ['rock','stone','boulder','dune'], fauna: ['camel','snake','scorpion','lizard','fox','vulture','beetle'] }, forbid: ['pine','snow','ice','fern','mushroom','coral','fish','human','person','character'] },
        snow: { label: 'Floresta boreal nevada', ground: 0xbfcbd0, top: 0xe1e8eb, water: 0x8bbdce, roles: { canopy: ['pine','spruce','fir','conifer'], undergrowth: ['snow','ice','frost','winter bush'], stone: ['rock','stone','boulder','ice'], fauna: ['wolf','fox','bear','rabbit','hare','deer','elk','owl','penguin'] }, forbid: ['palm','cactus','jungle','tropical','coral','fish','human','person','character'] },
        coast: { label: 'Costa tropical', ground: 0xcab47d, top: 0xe0cf9f, water: 0x2c9fb7, roles: { canopy: ['palm','mangrove','coastal tree'], undergrowth: ['beach grass','sea grass','tropical plant','shell','coral'], stone: ['rock','stone','boulder','driftwood'], fauna: ['crab','turtle','seagull','gull','fish','dolphin','whale','seal'] }, forbid: ['pine','snow','ice','cactus','human','person','character'] },
        jungle: { label: 'Selva tropical', ground: 0x3d6a39, top: 0x548546, water: 0x3c9f92, roles: { canopy: ['jungle tree','palm','tropical tree','banana','bamboo'], undergrowth: ['fern','liana','vine','tropical plant','flower','mushroom','grass'], stone: ['rock','stone','boulder','ruin'], fauna: ['monkey','parrot','jaguar','tiger','snake','frog','toucan','crocodile','elephant'] }, forbid: ['pine','snow','ice','cactus','human','person','character'] },
        swamp: { label: 'Pântano', ground: 0x4e6041, top: 0x63764a, water: 0x456b62, roles: { canopy: ['willow','dead tree','swamp tree','mangrove'], undergrowth: ['reed','rush','fern','moss','lily','swamp plant','grass'], stone: ['rock','stone','stump','log','bog'], fauna: ['frog','toad','alligator','crocodile','snake','mosquito','heron','turtle'] }, forbid: ['palm','cactus','snow','ice','human','person','character'] },
        savanna: { label: 'Savana', ground: 0x9d9851, top: 0xc0ad5b, water: 0x6b9b78, roles: { canopy: ['acacia','savanna tree','baobab'], undergrowth: ['dry grass','tall grass','savanna plant','shrub'], stone: ['rock','stone','boulder','termite'], fauna: ['lion','elephant','giraffe','zebra','rhinoceros','rhino','cheetah','hyena','gazelle','antelope','ostrich'] }, forbid: ['pine','snow','ice','cactus','human','person','character'] },
        volcanic: { label: 'Terras vulcânicas', ground: 0x454044, top: 0x67534a, water: 0x9e4828, roles: { canopy: ['dead tree','burnt tree','volcanic tree'], undergrowth: ['lava plant','ash plant','crystal','mushroom'], stone: ['volcanic rock','lava rock','rock','stone','obsidian','boulder'], fauna: ['lizard','salamander','dragon','phoenix','bat','scorpion'] }, forbid: ['palm','snow','ice','coral','fish','human','person','character'] }
    };
    const SKY_COLORS={forest:0x9fc2d0,desert:0xe5cfaa,snow:0xc2d6e4,coast:0x8bc9df,jungle:0x9fc7a5,swamp:0xa9b59a,savanna:0xe0cf8c,volcanic:0x57494e};
    const NON_NATURAL_PROPS=['houseplant','plant pot','pot','bowl','pipe','tile','platform','streetlight','planter','vase','container','furniture','bench','roof','wall','arch','ring','hex','bottom','sloped','dirt','block','ground tile','terrain piece'];

    let active = null, generation = 0, currentInfo = null, hookedRenderer = null, lastRenderTime = 0, savedCamera = null, savedModelVisibility = null;
    const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const sourceText = asset => norm([asset.id, asset.name, asset.originalModelName, ...(asset.tags || [])].join(' '));
    const styleOf = asset => String(asset.artStyle || asset.style || '').trim() || 'unclassified';
    const seeded = seed => { let x = (Number(seed) || 1) >>> 0; return () => { x += 0x6D2B79F5; let t=x; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; };
    const matchAny = (text, words) => words.some(word => {
        const term=norm(word).trim();
        if(term.includes(' '))return (' '+text+' ').includes(' '+term+' ');
        return text.split(/[^a-z0-9]+/).filter(Boolean).some(token=>token===term||(token.endsWith('s')&&token.slice(0,-1)===term));
    });

    function classify(asset, biome) {
        // Environmental roles must be actual nature assets. Prop kits contain pipes,
        // tiles, skate bowls and containers whose names may overlap plant terms.
        if (asset.category !== 'nature' && asset.category !== 'pets') return null;
        const text = sourceText(asset), def = definitions[biome];
        if (matchAny(text, [...def.forbid,...NON_NATURAL_PROPS])) return null;
        for (const role of ['fauna','canopy','undergrowth','stone']) {
            if ((role === 'fauna') !== (asset.category === 'pets')) continue;
            if (role === 'canopy' && matchAny(text,['cut','stump','log'])) continue;
            if (matchAny(text, def.roles[role])) return role;
        }
        return null;
    }
    function makePlan(biome, style) {
        const catalog = typeof ASSET_CATALOG !== 'undefined' && Array.isArray(ASSET_CATALOG) ? ASSET_CATALOG : [];
        const candidates = catalog.map(asset => ({ asset, role: classify(asset, biome), style: styleOf(asset) })).filter(x => x.role);
        let chosen = style && style !== 'all' ? style : null;
        if (!chosen) {
            const scores = new Map();
            for (const c of candidates) scores.set(c.style, (scores.get(c.style) || 0) + (c.role === 'canopy' ? 4 : c.role === 'undergrowth' ? 2 : c.role === 'stone' ? 2 : 1));
            chosen = [...scores].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]))[0]?.[0] || 'unclassified';
        }
        const picked = candidates.filter(c => c.style === chosen);
        const pools = Object.fromEntries(['canopy','undergrowth','stone','fauna'].map(role => [role, picked.filter(c => c.role === role)]));
        const missing = ['canopy','undergrowth','stone'].filter(role => pools[role].length<2);
        if (missing.length) throw new Error(`Bioma ${definitions[biome].label}: faltam pelo menos 2 assets originais distintos no estilo “${chosen}” para ${missing.join(', ')}. Nenhum substituto procedural foi criado.`);
        return { chosen, pools, candidates: picked };
    }
    function noise(seed, x, z) {
        const v = Math.sin((x+seed*0.17)*12.9898 + (z-seed*.11)*78.233) * 43758.5453;
        return (v - Math.floor(v))*2-1;
    }
    function terrainHeight(biome, seed, x, z) {
        const d = Math.hypot(x,z), wave = Math.sin(x*.16+seed)*.32 + Math.cos(z*.13-seed*.7)*.27 + noise(seed,x,z)*.12;
        const riverDist = Math.abs(x - Math.sin(z*.12 + seed)*5.2);
        let h = wave;
        if (biome === 'desert') h += Math.sin(x*.18 + Math.sin(z*.12))*0.6;
        if (biome === 'snow') h += Math.max(0, 1-d/45)*.8;
        if (biome === 'volcanic') h += Math.max(0,1-d/20)*2.7;
        if (biome === 'coast') h -= Math.max(0,Math.min(1,(z-13)/10))*1.35;
        if (['coast','jungle','swamp','savanna'].includes(biome)) h += Math.max(0, 1-riverDist/3.5)*-.58;
        return h;
    }
    function createTerrain(group, biome, seed, rng) {
        const def=definitions[biome], n=80, size=60, geo=new THREE.PlaneGeometry(size,size,n,n);
        geo.rotateX(-Math.PI/2);
        const p=geo.attributes.position;
        for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,terrainHeight(biome,seed,x,z));}
        p.needsUpdate=true;geo.computeVertexNormals();
        const mat=new THREE.MeshStandardMaterial({color:def.ground,roughness:.96,vertexColors:false});
        const mesh=new THREE.Mesh(geo,mat);mesh.name='ProceduralBiomeTerrain';mesh.receiveShadow=true;mesh.userData.proceduralTerrain=true;group.add(mesh);
        const hemi=new THREE.HemisphereLight(0xf4f4e6,def.ground,1.05);hemi.userData.proceduralTerrain=true;group.add(hemi);
        const sun=new THREE.DirectionalLight(0xfff0d9,1.15);sun.position.set(-18,28,14);sun.userData.proceduralTerrain=true;group.add(sun);
        // Broad color patches communicate ecological zones; these are terrain stage details, not catalog models.
        for(let i=0;i<18;i++){
            const x=(rng()-.5)*52,z=(rng()-.5)*52;
            const g=new THREE.CircleGeometry(1.8+rng()*3.8,12),m=new THREE.MeshStandardMaterial({color:i%3?def.top:def.ground,roughness:1,transparent:true,opacity:.22,depthWrite:false});
            const patch=new THREE.Mesh(g,m);patch.rotation.x=-Math.PI/2;patch.position.set(x,terrainHeight(biome,seed,x,z)+.025,z);patch.scale.set(1+rng(),.7+rng(),1);patch.receiveShadow=true;patch.userData.proceduralTerrain=true;group.add(patch);
        }
        if(def.water){
            const water=new THREE.Mesh(new THREE.PlaneGeometry(60,60,1,1),new THREE.MeshStandardMaterial({color:def.water,roughness:.24,metalness:.02,transparent:true,opacity:.82}));
            water.rotation.x=-Math.PI/2;
            const waterY=biome==='volcanic'?terrainHeight(biome,seed,0,0)+.06:-.2;
            water.position.y=waterY;water.name=biome==='volcanic'?'LavaChannel':'RiverChannel';
            // Long, gently winding watercourse. Keep a dry bank by limiting its width.
            water.scale.set(.12,1,1);
            if(biome==='coast') { water.scale.set(1,1,.42); water.position.set(0,waterY,25); }
            if(biome==='volcanic') { water.scale.set(.3,1,.3); water.name='LavaCaldera'; }
            else water.position.x=0;
            if(biome==='swamp') { water.scale.set(.34,1,1); water.material.opacity=.62; }
            water.userData.proceduralTerrain=true;group.add(water);
        }
    }
    function spacingPosition(biome, role, i, total, rng, seed) {
        // Grid jitter keeps large silhouettes separated; an empty inner clearing remains for framing.
        for(let attempt=0;attempt<80;attempt++){
            const angle=rng()*Math.PI*2, radius=role==='canopy'?10+rng()*17:role==='fauna'?8+rng()*19:4+rng()*23;
            const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
            if(Math.hypot(x,z)<5)continue;
            return {x,z,y:terrainHeight(biome,seed,x,z)};
        }
        return {x:(rng()-.5)*42,z:(rng()-.5)*42,y:0};
    }
    function countTargets(pools, mobile) {
        return { canopy: Math.min(mobile?14:22, pools.canopy.length? (mobile?14:22):0), undergrowth:Math.min(mobile?14:22,pools.undergrowth.length?(mobile?14:22):0), stone:Math.min(mobile?8:12,pools.stone.length?(mobile?8:12):0), fauna:Math.min(pools.fauna.length? (mobile?3:6):0, mobile?3:6) };
    }
    function makeSelections(plan,targets,seed) {
        const rng=seeded(seed^0x5f3759df), selections={}, varietyLimit={canopy:6,undergrowth:8,stone:5,fauna:2};
        for(const role of ['canopy','undergrowth','stone','fauna']){
            const pool=plan.pools[role], ordered=pool.slice();
            for(let i=ordered.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[ordered[i],ordered[j]]=[ordered[j],ordered[i]];}
            const variety=ordered.slice(0,Math.min(ordered.length,targets[role],varietyLimit[role])).map(entry=>entry.asset);
            selections[role]=Array.from({length:targets[role]},(_,i)=>variety.length?variety[i%variety.length]:null);
        }
        return selections;
    }
    function placeAssets(group, biome, plan, seed, rng, mobile, token, selections) {
        const targets=countTargets(plan.pools,mobile), placements=[], occupied=[];
        for(const role of ['canopy','undergrowth','stone','fauna']){
            for(let i=0;i<targets[role];i++){
                if(token!==generation)throw new DOMException('Geração de bioma cancelada','AbortError');
                const asset=selections[role][i]; if(!asset)continue;
                let p, radius=role==='canopy'?3.8:role==='fauna'?1.8:role==='stone'?1.6:1.8;
                for(let attempt=0;attempt<100;attempt++){
                    p=spacingPosition(biome,role,i,targets[role],rng,seed);
                    if(occupied.every(q=>Math.hypot(q.x-p.x,q.z-p.z)>=Math.max(radius,q.radius)+.8))break;
                }
                occupied.push({x:p.x,z:p.z,radius});
                p.y=terrainHeight(biome,seed,p.x,p.z);
                const model=buildDownloadedModel(asset.id,{});
                const scale=role==='canopy'?3.2+rng()*4.8:role==='fauna'?0.72+rng()*.75:role==='stone'?1+rng()*2.2:.55+rng()*.8;
                model.scale.multiplyScalar(scale);model.position.set(p.x,p.y,p.z);model.rotation.y=rng()*Math.PI*2;
                model.userData.isSceneProp=true;model.userData.biomeGenerated=true;model.userData.biomeRole=role;
                group.add(model);placements.push({asset,role,position:[p.x,p.y,p.z],rotationY:model.rotation.y,scale});
            }
        }
        return {placements,total:placements.length};
    }
    function disposeGroup(group) {
        if(!group)return;
        group.traverse(node=>{if(node.userData.proceduralTerrain){node.geometry?.dispose();if(Array.isArray(node.material))node.material.forEach(m=>m.dispose());else node.material?.dispose();}});
        group.parent?.remove(group);
        group.traverse(node=>{if(node.userData.biomeGenerated && typeof disposeModel==='function')disposeModel(node);});
    }
    function restoreCamera() {
        if(!savedCamera || typeof camera==='undefined' || !camera || typeof controls==='undefined' || !controls)return;
        camera.position.copy(savedCamera.position);controls.target.copy(savedCamera.target);controls.minDistance=savedCamera.minDistance;controls.maxDistance=savedCamera.maxDistance;camera.far=savedCamera.far;camera.updateProjectionMatrix();
        if(typeof scene!=='undefined'&&scene){scene.background=savedCamera.background;if(scene.fog)scene.fog=savedCamera.fog;}
        controls.update();savedCamera=null;
    }
    function hideStudioModels() {
        if (savedModelVisibility) return;
        savedModelVisibility = [];
        for (const name of ['currentModelGroup','companionPetGroup']) {
            try {
                const model = root[name];
                if (model) { savedModelVisibility.push([model, model.visible]); model.visible = false; }
            } catch (_) { /* top-level lexical bindings may not be exposed as window properties */ }
        }
        // Classic scripts expose top-level `let` bindings to other classic scripts even
        // though they are not properties on window. Resolve them without eval.
        try { if (typeof currentModelGroup !== 'undefined' && currentModelGroup && !savedModelVisibility.some(x=>x[0]===currentModelGroup)) { savedModelVisibility.push([currentModelGroup,currentModelGroup.visible]); currentModelGroup.visible=false; } } catch (_) {}
        try { if (typeof companionPetGroup !== 'undefined' && companionPetGroup && !savedModelVisibility.some(x=>x[0]===companionPetGroup)) { savedModelVisibility.push([companionPetGroup,companionPetGroup.visible]); companionPetGroup.visible=false; } } catch (_) {}
        try { if (typeof studioStage !== 'undefined' && studioStage && !savedModelVisibility.some(x=>x[0]===studioStage)) { savedModelVisibility.push([studioStage,studioStage.visible]); studioStage.visible=false; } } catch (_) {}
    }
    function restoreStudioModels() {
        if (!savedModelVisibility) return;
        for (const [model, visible] of savedModelVisibility) model.visible = visible;
        savedModelVisibility = null;
    }
    function frameWorld() {
        if(typeof camera==='undefined' || !camera || typeof controls==='undefined' || !controls)return;
        if(!savedCamera)savedCamera={position:camera.position.clone(),target:controls.target.clone(),minDistance:controls.minDistance,maxDistance:controls.maxDistance,far:camera.far,background:scene.background?.clone?.()||scene.background,fog:scene.fog?.clone?.()||scene.fog};
        const bounds=new THREE.Box3().setFromObject(active),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
        const aspect=Math.max(.25,camera.aspect||1),vfov=camera.fov*Math.PI/180,hfov=2*Math.atan(Math.tan(vfov/2)*aspect);
        const radius=size.length()*.5;
        const distance=radius/Math.sin(Math.min(vfov,hfov)*.5)*1.12;
        controls.target.copy(center);
        const direction=new THREE.Vector3(58,50,68).normalize();camera.position.copy(center).add(direction.multiplyScalar(distance));controls.maxDistance=Math.max(145,distance*1.2);controls.minDistance=8;camera.far=Math.max(camera.far,distance+160);camera.updateProjectionMatrix();
        if(typeof scene!=='undefined'&&scene){scene.background=new THREE.Color(SKY_COLORS[active?.userData.biome]||0x9fc2d0);if(scene.fog)scene.fog=new THREE.FogExp2(SKY_COLORS[active?.userData.biome]||0x9fc2d0,.003);}
        controls.update();
    }
    function clear() { generation++; if(active){disposeGroup(active);active=null;restoreCamera();} restoreStudioModels(); currentInfo=null; }
    async function generate(key, options={}) {
        if(!definitions[key])throw new Error(`Bioma desconhecido: ${key}`);
        clear();const token=generation,seed=Number.isFinite(Number(options.seed))?Number(options.seed):Math.floor(Math.random()*0xffffffff),rng=seeded(seed),mobile=(root.innerWidth||1024)<1024;
        const plan=makePlan(key,options.style||'all');
        const targets=countTargets(plan.pools,mobile),selections=makeSelections(plan,targets,seed);
        const required=[...new Set(Object.values(selections).flat().filter(Boolean).map(asset=>asset.id))];
        // Prefetch only distinct source GLBs that this composition can instantiate.
        await Promise.all(required.map(id=>ensureNativeAsset(id)));
        if(token!==generation)throw new DOMException('Geração de bioma cancelada','AbortError');
        const group=new THREE.Group();group.name='BiomeWorld_'+key;group.userData.biome=key;group.userData.seed=seed;
        try { createTerrain(group,key,seed,rng);const placed=placeAssets(group,key,plan,seed,rng,mobile,token,selections); if(token!==generation)throw new DOMException('Geração de bioma cancelada','AbortError');
            if(typeof customWorldGroup==='undefined' || !customWorldGroup)throw new Error('O estúdio ainda não inicializou customWorldGroup.');
            customWorldGroup.add(group);active=group;hideStudioModels();frameWorld();
            currentInfo={key,label:definitions[key].label,seed,style:plan.chosen,instances:placed.placements.length,sourceFiles:new Set(placed.placements.map(p=>p.asset.id)).size,sourcePoolSizes:Object.fromEntries(Object.entries(plan.pools).map(([role,pool])=>[role,pool.length])),terrain:'procedural composition stage (not a catalog model)',gaps:{fauna:plan.pools.fauna.length?null:'sem fauna compatível; cena sem animais'},assets:placed.placements.map(p=>({id:p.asset.id,name:p.asset.name,author:p.asset.author,source:p.asset.sourcePage,license:p.asset.license,licenseUrl:p.asset.licenseUrl,style:p.asset.artStyle||p.asset.style||'unclassified',role:p.role,position:p.position,rotationY:p.rotationY,scale:p.scale}))};
            return info();
        } catch(error) { disposeGroup(group); throw error; }
    }
    function info() { return currentInfo?JSON.parse(JSON.stringify(currentInfo)):null; }
    function availability(style='all') {
        const available=[],unavailable={};
        for(const [key,definition] of Object.entries(definitions)){
            try {
                const plan=makePlan(key,style);
                const assets=Object.fromEntries(Object.entries(plan.pools).map(([role,pool])=>[role,pool.length]));
                available.push({key,label:definition.label,style:plan.chosen,assets});
            }
            catch(error){unavailable[key]=error.message;}
        }
        return {available,unavailable};
    }
    function exportScene() {
        const data=info();if(!data)throw new Error('Nenhum bioma ativo para exportar.');
        const json=JSON.stringify({format:'PolyForge biome composition 1',...data},null,2);
        if(typeof root.THREE.GLTFExporter==='undefined')return {json,gltf:null,reason:'THREE.GLTFExporter indisponível; composição JSON fornecida.'};
        return new Promise((resolve,reject)=>new root.THREE.GLTFExporter().parse(active,(gltf)=>resolve({json,gltf}),reject,{binary:true,onlyVisible:true}));
    }
    function tick(dt,time) {
        if(!active)return;
        active.traverse(node=>{if(node.userData.biomeRole!=='fauna')return;const actor=typeof NATIVE_ACTORS!=='undefined'?NATIVE_ACTORS.get(node):null;if(actor){actor.play('idle');actor.update(dt);} if(node.userData.biomeBaseY===undefined)node.userData.biomeBaseY=node.position.y;node.position.y=node.userData.biomeBaseY+Math.sin(time*1.2+node.position.x)*.025;});
    }
    function resize(){if(active)frameWorld();}
    function attachRenderer(renderer) {
        if(!renderer || hookedRenderer===renderer)return;
        hookedRenderer=renderer;const render=renderer.render;
        renderer.render=function(...args){const now=performance.now(),dt=lastRenderTime?Math.min((now-lastRenderTime)/1000,.1):0;lastRenderTime=now;tick(dt,now/1000);return render.apply(this,args);};
    }
    const api={definitions,generate,clear,info,availability,exportScene,tick,attachRenderer,restoreCamera,resize};
    root.PolyForgeBiomes=api;
})(window);
