#!/usr/bin/env node
/* Gera vendor/three.min.js: só as partes do Three.js que o modo 3D usa (tree-shaking).
   Rode de novo só ao mudar a versão do Three ou a lista de peças abaixo:
     npm i -D three esbuild && node ferramentas/gerar-three.mjs
   O arquivo gerado é versionado, então o build do APK não precisa de rede. */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const PECAS = [
  'WebGLRenderer', 'Scene', 'OrthographicCamera', 'Group', 'Mesh', 'InstancedMesh',
  'PlaneGeometry', 'MeshBasicMaterial', 'CanvasTexture', 'Raycaster', 'Plane',
  'Vector2', 'Vector3', 'Matrix4', 'Quaternion', 'Euler', 'Color', 'Object3D',
  'NearestFilter', 'LinearMipmapLinearFilter', 'DoubleSide', 'FrontSide', 'SRGBColorSpace',
];

const tmp = join(raiz, '.three-entrada.mjs');
const saida = join(raiz, 'vendor/three.min.js');
writeFileSync(tmp, `export { ${PECAS.join(', ')} } from 'three';\n`);
try {
  execFileSync('npx', ['esbuild', tmp, '--bundle', '--format=iife', '--global-name=THREE',
    '--minify', '--target=es2019', '--legal-comments=none', '--outfile=' + saida], { cwd: raiz, stdio: 'inherit' });
} finally { rmSync(tmp, { force: true }); }

const versao = JSON.parse(readFileSync(join(raiz, 'node_modules/three/package.json'), 'utf8')).version;
const corpo = readFileSync(saida, 'utf8');
writeFileSync(saida, `/* Three.js r${versao} — MIT © Three.js authors. Apenas as peças usadas pelo modo 3D.\n   Gerado por ferramentas/gerar-three.mjs; não edite à mão. */\n${corpo}`);
console.log(`vendor/three.min.js — Three r${versao} — ${(corpo.length / 1024).toFixed(0)} KB`);
