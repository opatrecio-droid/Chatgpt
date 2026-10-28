
window.addEventListener('error', function(e){ var el=document.getElementById('boot-error'); if(el){el.hidden=false;el.textContent='Não foi possível continuar: '+e.message+'\nAbra o arquivo no navegador e tente novamente. Seu save anterior é preservado.';} });
window.addEventListener('unhandledrejection', function(e){ var el=document.getElementById('boot-error'); if(el){el.hidden=false;el.textContent='Falha durante a aventura: '+String(e.reason && e.reason.message || e.reason);} });
