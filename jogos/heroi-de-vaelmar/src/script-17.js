/* Android-only adapter. The browser edition is not changed. */
(function(){
 if(typeof VaelmarNative==='undefined')return;
 ACT.exportsave=()=>{if(!S)return;save();VaelmarNative.exportSave(JSON.stringify({format:'Aethric Offline',exportedAt:new Date().toISOString(),save:S},null,2),'Vaelmar-'+S.name.replace(/[^a-z0-9]/gi,'_')+'-save.json');};
 ACT.importsave=()=>VaelmarNative.importSave();
 document.getElementById('btn-import-title').onclick=ACT.importsave;
 window.VaelmarAndroid={receiveSave(raw){
  try{
   const parsed=JSON.parse(raw),state=migrate(parsed.save||parsed);if(!state)throw Error('Save incompatível');
   if(S)try{localStorage.setItem('aethric-backup-before-import',JSON.stringify(S));}catch{}
   try{saveBaseline=localStorage.getItem(SAVE4_KEY)||localStorage.getItem(SAVE_KEY);}catch{}
   saveConflict=false;delete document.body.dataset.saveConflict;document.getElementById('save-conflict')?.remove();for(const node of document.body.children)node.inert=false;
   S=state;learnSkills();closePanel();enterWorld(false);save();toast('Progresso importado.');
  }catch(error){toast('Não foi possível importar: '+error.message);}
 }};
 const original=vSettings;vSettings=()=>original()+'<p class="fine">Android 4.4.0 · conteúdo incluído no aplicativo</p>';VIEWS.settings.r=vSettings;
})();
