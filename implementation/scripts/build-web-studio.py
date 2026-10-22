"""Build the portable studio with verified, author-created GLBs embedded."""
from pathlib import Path
import base64,json,hashlib,re,struct,gzip,argparse,html as html_utils,os
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--catalog',type=Path,help='Verified catalog for a standalone delivery batch')
parser.add_argument('--output',type=Path,default=ROOT/'index.html')
parser.add_argument('--label',default='')
args=parser.parse_args()
html=(ROOT/'legacy/procedural-studio.html').read_text()
manifest=[]
translations={'Wizard':'Mago','Monk':'Monge','King':'Rei','Adventurer':'Aventureiro','Pirate Captain':'Capitão pirata','Horse':'Cavalo','Stag':'Veado com galhadas','Husky':'Husky','Wolf':'Lobo','Alpaca':'Alpaca','Donkey':'Burro','Bull':'Touro','Deer':'Cervo','Fox':'Raposa','Cow':'Vaca','Twisted Tree':'Árvore retorcida','Palm Tree':'Palmeira','Pine':'Pinheiro','Dead Tree':'Árvore seca','Mushroom':'Cogumelo','Rocks':'Rochas','Big Crystal':'Cristal','Flower Group':'Flores','Bush with Flowers':'Arbusto florido','Grass':'Grama','Plant Big':'Planta de folhas largas','Fern':'Samambaia','Canoe':'Canoa','Canoe Paddle':'Remo','Campfire Logs':'Fogueira','Bed':'Cama','Tent Detailed Closed':'Barraca','Pot Large':'Vaso','Sign':'Placa','Statue Obelisk':'Obelisco','Bridge Wood':'Ponte de madeira','Fence Gate':'Portão de cerca'}
# Alternate prop designs and three characters with a different visual style stay out of the visible catalog.
excluded={'kenney_objects_campfire_bricks','kenney_objects_bridge_stone','web_characters_wizard','web_characters_monk','web_characters_king'}
existing_catalog=ROOT/'assets/catalog.json'
catalog_input=args.catalog or (existing_catalog if existing_catalog.exists() else None)
groups=[('custom',json.loads(catalog_input.read_text()))] if catalog_input else [(group,json.loads((ROOT/'assets/catalog-parts'/f'{group}.json').read_text())) for group in ['characters','animals','nature','objects']]
for group,records in groups:
    for original in records:
        asset=dict(original)
        if asset['id'] in excluded:continue
        if group=='animals':asset['category']='pets'
        if asset['id']=='kenney_objects_canoe':asset['category']='vehicles'
        # The equipment slot is for handheld gear, not food or construction parts.
        if asset.get('sourcePage','').endswith('/food-kit'):asset['category']='props'
        if asset.get('sourcePage','').endswith('/space-kit') and asset['category']=='items' and not re.search(r'weapon|gun|blaster|sword|shield',asset.get('originalModelName',''),re.I):asset['category']='props'
        if asset.get('sourcePage','').endswith('/mini-characters') and asset['category']=='items':asset['category']='props'
        asset.setdefault('originalModelName',asset['name']);asset['name']=translations.get(asset['name'],asset['name'])
        path=ROOT/asset['file'];data=path.read_bytes()
        assert data[:4]==b'glTF' and hashlib.sha256(data).hexdigest()==asset['sha256'],path
        doc=json.loads(data[20:20+struct.unpack_from('<I',data,12)[0]])
        assert doc.get('meshes') and doc.get('materials'),path
        assert all(not x.get('uri') or x['uri'].startswith('data:') for key in ['buffers','images'] for x in doc.get(key,[])),path
        asset['animationCount']=len(doc.get('animations',[]))
        manifest.append(asset)
manifest.sort(key=lambda a:(a['id']!='web_characters_adventurer',a['category'],a['name']))
cache_dir=ROOT/'assets/deliveries/.build-cache';cache_dir.mkdir(parents=True,exist_ok=True)
model_data={}
for a in manifest:
    cache=cache_dir/(a['sha256']+'.base64')
    if not cache.exists():
        temporary=cache.with_suffix('.'+str(os.getpid())+'.tmp')
        temporary.write_text(base64.b64encode(gzip.compress((ROOT/a['file']).read_bytes(),compresslevel=9,mtime=0)).decode());temporary.replace(cache)
    model_data[a['id']]=cache.read_text()
vendors={}
# Preserve the exact Three.js and OrbitControls versions already validated in this app.
for name,pattern in [('three',r'<script src="(data:application/javascript;base64,[^"]+)"></script>'),('orbit',None)]:
    if pattern:matches=re.findall(pattern,html)
vendors['three']=matches[1] if 'tailwind' not in base64.b64decode(matches[0].split(',')[1])[:200].decode(errors='ignore').lower() else matches[1]
# Identify dependencies by decoded contents instead of position.
for src in re.findall(r'<script src="(data:application/javascript;base64,[^"]+)"></script>',html):
    code=base64.b64decode(src.split(',')[1])
    if b'REVISION' in code and b'WebGLRenderer' in code:vendors['three']=src
    if b'THREE.OrbitControls' in code:vendors['orbit']=src
for name,filename in [('gltf','GLTFLoader.js'),('skeleton','SkeletonUtils.js')]:
    vendors[name]='data:application/javascript;base64,'+base64.b64encode((ROOT/'assets/vendor'/filename).read_bytes()).decode()
thumbs={}
for asset in manifest:
    p=ROOT/'assets/thumbnails'/(asset['id']+'.jpg')
    if p.exists():thumbs[asset['id']]='data:image/jpeg;base64,'+base64.b64encode(p.read_bytes()).decode()
# The original page and functions stay archived; these overrides make the visible catalog GLB-only.
html=html.replace('</head>','<script src="'+vendors['gltf']+'"></script><script src="'+vendors['skeleton']+'"></script></head>',1)
html=html.replace('100 famílias procedurais','Modelos de autores',1).replace('Famílias procedurais (100)','Modelos baixados',1)
html=html.replace('COLEÇÃO E BIOMA','AUTOR',1)
html=re.sub(r'<button type="button" class="library-note text-left hover:text-indigo-300".*?</button>','<p class="library-note">GLBs de autores · materiais originais<br>Fonte e licença em cada modelo.</p>',html,count=1,flags=re.S)
html=html.replace('Modelos de autores</span>','<span id="native-count">Arquivos GLB</span></span>',1)
html=html.replace('<title>PolyForge Studio — coleção original e famílias procedurais</title>','<title>PolyForge Studio — modelos de autores</title>')
if args.label:
    html=re.sub(r'<title>.*?</title>','<title>PolyForge — '+args.label+'</title>',html,count=1)
html=html.replace('Código Three.js</span>','Código / fonte</span>',1)
html=html.replace('onclick="exportToOBJ()"','onclick="downloadNativeGLB()"',1).replace('Exportar .OBJ','Baixar GLB',1).replace('title="Baixar arquivo .OBJ para Blender, Unity ou Godot"','title="Baixar o arquivo GLB original do autor"',1)
html=html.replace('<!-- SECTION 1: COLORS & PALETTE -->','''<section class="native-source-panel"><h3>MODELO ORIGINAL</h3><div id="native-provenance"></div></section>
<section class="native-source-panel"><h3>ANIMAÇÕES DO ARQUIVO</h3><p id="native-animation-status"></p><select class="library-biome" id="native-clip" onchange="if(this.value)setAnimation('clip:'+this.value)"></select><button class="native-pause" onclick="state.webPaused=!state.webPaused;this.textContent=state.webPaused?'Continuar animação':'Pausar animação'">Pausar animação</button></section>
<!-- SECTION 1: COLORS & PALETTE -->''',1)
# Replace the synthetic three-slot palette with the actual named materials from the GLB.
a=html.index('                    <div class="grid grid-cols-3 gap-1.5">',html.index('<!-- SECTION 1: COLORS & PALETTE -->'))
b=html.index('                <!-- SECTION 2:',a) if '                <!-- SECTION 2:' in html[a:] else -1
if b<0:
    # Find next inspector section after the palette block using its heading.
    b=html.index('                <!-- SECTION',a+60)
segment=html[a:b]
first_end=segment.index('                    </div>',segment.index('                        </div>')+30) if False else 0
# Keep the original hidden inputs for the existing scale/inspector synchronizer.
colorgrid_end=html.index('                    <!--',a) if '                    <!--' in html[a:b] else -1
# Target only the fixed three-color grid by its exact ending before Quick Palettes.
marker=html.find('                    <div class="space-y-1.5">',a)
if marker<0 or marker>b:marker=html.find('                    <div',html.find('                    </div>',a)+35)
# Match the known original block through the third color cell.
pattern=r'                    <div class="grid grid-cols-3 gap-1.5">.*?<span class="text-\[10px\] text-slate-400 truncate">Detalhe</span>\s*</div>\s*</div>'
html,count=re.subn(pattern,'''                    <label class="library-field-label" for="native-material">MATERIAL ORIGINAL DO ARQUIVO</label>
<select id="native-material" class="library-biome" onchange="selectedNativeMaterial=Number(this.value);syncNativeMaterial()"></select>
<div class="native-color-row"><input type="color" id="color-primary" oninput="updateModelAppearance()"><span>Cor do material selecionado</span></div>
<input type="hidden" id="color-secondary" value="#334155"><input type="hidden" id="color-accent" value="#cbd5e1">''',html,count=1,flags=re.S)
assert count==1,'Palette block not found'
# Hide presets which assume the removed procedural primary/secondary/accent material roles.
html=html.replace('Paletas Rápidas:','Alterar cor do material:',1)
loading='''<div id="native-loading"><div class="glass-panel"><div class="native-spinner"></div><strong>Abrindo os modelos originais</strong><p id="native-progress">Preparando arquivos GLB…</p><small>Os modelos estão incluídos nesta página. Sem downloads externos em execução.</small></div></div>'''
html=html.replace('<body class=', '<body class=',1)
body_end=html.index('>',html.index('<body'))+1;html=html[:body_end]+loading+html[body_end:]
css='''<style>
#native-loading{position:fixed;inset:0;display:grid;place-items:center;background:#090d16;z-index:200}#native-loading>.glass-panel{width:min(440px,90vw);padding:36px;border-radius:18px;text-align:center}#native-loading strong{display:block;margin:18px 0 8px;font-size:17px}#native-loading p{font-size:13px;color:#a4b3ce}#native-loading small{display:block;margin-top:16px;font-size:11px;color:#71839f;line-height:1.6}.native-spinner{width:28px;height:28px;border-radius:50%;border:2px solid #35405b;border-top-color:#9eaafa;margin:auto;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.native-asset-card{width:100%;display:flex;text-align:left;align-items:center;gap:10px;padding:6px;border:1px solid #2a3447;border-radius:11px;background:#0c111c;transition:background .18s}.native-thumbnail{height:58px;width:65px;flex-shrink:0;display:grid;place-items:center;border-radius:7px;overflow:hidden;background:#141d2c;color:#8a9bc3}.native-thumbnail img{width:100%;height:100%;object-fit:cover}.native-asset-text{min-width:0;display:flex;flex-direction:column;gap:4px}.native-asset-text strong{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.native-asset-text small{font-size:10px;color:#9eacc5}.native-asset-text span{font:9px monospace;color:#87a99e}.native-source-panel{padding:12px;background:#0c121d;border:1px solid #2b364b;border-radius:12px}.native-source-panel h3{font-size:10px;letter-spacing:.08em;color:#a9b8e1;font-weight:700;margin:0 0 9px}.native-source-panel p{font-size:10px;line-height:1.6;color:#99abc5;margin-bottom:7px}#native-provenance{display:flex;flex-direction:column;gap:6px;font-size:11px}#native-provenance span{color:#91a2bd;font-size:10px}#native-provenance a{color:#a5b4fc}#native-provenance small{font-size:9px;line-height:1.6;color:#7c8da8}.native-color-row{display:flex;align-items:center;gap:10px;font-size:11px;color:#b0bfd6}.native-pause{font-size:10px;padding:6px 8px;border:1px solid #35415a;border-radius:6px;margin-top:8px}.native-error p{color:#fda4af!important;overflow-wrap:anywhere}.native-error button{margin-top:15px;padding:8px 14px;background:#474fb4;border-radius:8px}
</style>'''
html=html.replace('</head>',css+'</head>',1)
notices='\n\n'.join(p.name+'\n'+p.read_text() for p in sorted((ROOT/'assets/vendor').glob('LICENSE-*.txt')))
html=html.replace('</head>','<template id="third-party-licenses"><pre>'+html_utils.escape(notices)+'</pre></template></head>',1)
html=html.replace('<button onclick="saveStudioImage()"', '<button onclick="exportToOBJ()" title="Exportar geometria estática na pose atual">OBJ</button><button onclick="saveStudioImage()"',1)
config='const WEB_CATALOG='+json.dumps(manifest,ensure_ascii=False)+';\nconst WEB_MODEL_DATA='+json.dumps(model_data)+';\nconst WEB_DEPENDENCIES='+json.dumps(vendors)+';\nconst WEB_THUMBNAILS='+json.dumps(thumbs)+';\n'
runtime=(ROOT/'src/web-models.js').read_text()
if args.label:
    runtime=runtime.replace("ASSET_CATALOG.length+' modelos de autores'", "ASSET_CATALOG.length+"+json.dumps(' modelos · '+args.label,ensure_ascii=False))
end=html.rfind('</body>')
html=html[:end]+'<script>\n'+config+runtime+'\n</script>'+html[end:]
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(html)
catalog_output=args.output.with_suffix('.catalog.json') if args.catalog else ROOT/'assets/catalog.json'
catalog_output.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('Built web studio:',len(manifest),'models,',sum(a['bytes'] for a in manifest),'GLB bytes, HTML',len(html.encode()),'bytes')
