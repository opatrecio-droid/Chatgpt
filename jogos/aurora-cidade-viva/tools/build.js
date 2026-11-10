/* Junta src/ em um único HTML que roda offline. Uso: node tools/build.js */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'aurora-cidade-viva-19.html');
const js = fs.readdirSync(SRC).filter((f) => /^\d\d-.*\.js$/.test(f)).sort().map((f) => '/* ===== ' + f + ' ===== */\n' + fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n;\n');
const css = fs.readFileSync(path.join(SRC, 'style.css'), 'utf8');
const fonts = fs.readFileSync(path.join(SRC, 'fonts.css'), 'utf8');
const icon = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%230d1220'/><circle cx='26' cy='30' r='15' fill='%23e2b659'/><circle cx='33' cy='25' r='13' fill='%230d1220'/><circle cx='45' cy='42' r='6' fill='%23b58cf2'/></svg>";
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#0d1220">
<meta name="color-scheme" content="dark">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="cidade-viva-build" content="Aurora_ciclo_030_reforjada">
<title>Aurora — Crônicas da Fenda</title>
<link rel="icon" href="${icon}">
<style>
${fonts}
${css}
</style>
</head>
<body>
<div id="boot"><div class="boot-logo">AURORA</div><div class="boot-sub">Crônicas da Fenda</div><div class="boot-bar"><i id="boot-fill"></i></div><div class="boot-tip" id="boot-tip">Acendendo as lanternas…</div></div>
<div id="app"></div>
<script>
${js}
</script>
</body>
</html>
`;
fs.writeFileSync(OUT, html);
console.log('ok', OUT, (html.length / 1024).toFixed(0) + ' KB', '(js ' + (js.length / 1024).toFixed(0) + ' KB)');
