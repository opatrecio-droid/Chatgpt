#!/usr/bin/env python3
"""Gera src/ferraria-hd.js: a arte da Ferraria em 2x (208x228), mesmo layout, com detalhe procedural.
Fonte: bloco aurora-building-image-sprites de aurora-045-original.html. Reproduzivel (ruido por hash)."""
import re, base64, io, os, sys
ID = sys.argv[1] if len(sys.argv) > 1 else 'ferraria'   # ferraria | fazenda
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'aurora-045-original.html'), encoding='utf8').read()
b64 = re.search(r'"' + ID + r'":"data:image/png;base64,([^"]+)"', src).group(1)
im = Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGBA')
a = np.asarray(im).astype(np.float32); H, W = a.shape[:2]

def eq(p, q): return np.all(np.abs(p - q) < 14, axis=-1)
# --- Scale2x/EPX com alfa ---
P = np.pad(a, ((1, 1), (1, 1), (0, 0)), mode='edge')
C = P[1:-1, 1:-1]; U = P[:-2, 1:-1]; D = P[2:, 1:-1]; L = P[1:-1, :-2]; R = P[1:-1, 2:]
o = np.zeros((H * 2, W * 2, 4), np.float32)
def put(dy, dx, cond, first):
    o[dy::2, dx::2] = np.where(cond[..., None], first, C)
nUD, nLR = ~eq(U, D), ~eq(L, R)
put(0, 0, eq(L, U) & nUD & nLR, U); put(0, 1, eq(U, R) & nUD & nLR, R)
put(1, 0, eq(D, L) & nUD & nLR, L); put(1, 1, eq(R, D) & nUD & nLR, D)

def hsh(x, y, s=0):
    n = (x.astype(np.int64) * 374761393 + y.astype(np.int64) * 668265263 + s * 362437) & 0xffffffff
    n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff; n ^= n >> 16
    return (n & 0xffff) / 65535.0
Y, X = np.mgrid[0:H * 2, 0:W * 2]
rgb = o[..., :3]; al = o[..., 3] > 128
mx = rgb.max(-1); mn = rgb.min(-1); lum = rgb @ np.array([.299, .587, .114], np.float32); sat = (mx - mn) / (mx + 1)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
wood = al & (r > b + 18) & (r >= g) & (sat > 0.22) & (lum < 170)
slate = al & (b >= r - 4) & (sat > 0.06) & (lum < 120)
stone = al & ~wood & ~slate & (sat < 0.3) & (lum > 60) & (lum < 200)
metal = al & (sat < 0.22) & (lum >= 120)
roof = np.zeros_like(al); plaster = roof
if ID == 'fazenda':
    roof = al & (Y < 2 * 84) & (r > g + 22) & (r > b + 30) & (lum < 175)
    plaster = al & (lum > 150) & (sat < 0.4) & (Y > 2 * 56)
    wood = wood & ~roof; metal = metal & ~plaster; stone = stone & ~plaster
add = np.zeros_like(lum)
# bevel direcional (luz de cima-esquerda) a partir da luminancia suavizada
def sh(arr, dy, dx): return np.roll(np.roll(arr, dy, 0), dx, 1)
bev = (lum - sh(lum, 1, 1)) * 0.55 + (lum - sh(lum, 1, 0)) * 0.25
add += np.clip(bev, -26, 26)
# pedras: variacao de tom por "bloco" + argamassa escura nas bordas de bloco irregulares
blk = hsh(X // 6 + (Y // 5 % 2) * 3, Y // 5, 1)
add += np.where(stone, (blk - 0.5) * 22 + (hsh(X, Y, 2) - 0.5) * 10, 0)
mort = ((Y % 5 == 0) | (((X + (Y // 5 % 2) * 3) % 6) == 0)) & stone & (hsh(X // 6, Y // 5, 3) > 0.35)
add += np.where(mort, -16, 0)
# madeira: veios longitudinais
vein = np.sin(X * 0.9 + hsh(X // 3, Y // 9, 4) * 6) * 0.5 + 0.5
add += np.where(wood, (vein - 0.5) * 16 + (hsh(X, Y // 3, 5) - 0.5) * 8, 0)
# telhado: linha de luz/sombra por fileira de telhas
row = (Y % 8)
add += np.where(slate, np.where(row == 0, 14, np.where(row == 7, -18, 0)) + (hsh(X // 5 + (Y // 8 % 2) * 2, Y // 8, 6) - 0.5) * 14, 0)
# celeiro: telhas vermelhas (luz/sombra por fileira, escalonadas) e reboco granulado
rr = Y % 7
add += np.where(roof, np.where(rr == 0, 16, np.where(rr == 6, -22, 0)) + (hsh(X // 5 + (Y // 7 % 2) * 2, Y // 7, 11) - 0.5) * 16, 0)
add += np.where(plaster, (hsh(X, Y, 12) - 0.5) * 9, 0)
# metal: reflexo
add += np.where(metal, np.where(hsh(X // 2, Y // 2, 7) > 0.8, 18, 0), 0)
# musgo/terra na base (y > 200 => y1x > 100)
base = (Y > 198) & al & (stone | wood)
moss = base & (hsh(X // 2, Y // 2, 8) > 0.84)
out = rgb + add[..., None] * np.array([1, 1, 1.05], np.float32)
out = np.where(moss[..., None], out * 0.6 + np.array([34, 56, 24], np.float32) * 0.6, out)
dirt = (Y > 218) & al & (hsh(X, Y, 9) > 0.7)
out = np.where(dirt[..., None], out * 0.8 + np.array([40, 28, 18], np.float32) * 0.2, out)
# contorno escuro fino (1 px em 2x) na silhueta
A = al.astype(np.uint8)
edge = al & ((sh(A, 1, 0) == 0) | (sh(A, -1, 0) == 0) | (sh(A, 0, 1) == 0) | (sh(A, 0, -1) == 0))
ol = np.array([26, 20, 34], np.float32)
out = np.where(edge[..., None], out * 0.4 + ol * 0.6, out)
res = np.concatenate([np.clip(out, 0, 255), o[..., 3:4]], -1).astype(np.uint8)
img = Image.fromarray(res, 'RGBA'); assert img.size == (W * 2, H * 2)
buf = io.BytesIO(); img.save(buf, 'PNG', optimize=True)
open(os.path.join(ROOT, 'src', ID + '-hd.js'), 'w').write("(function(){'use strict';if(typeof G==='undefined'||G.HEADLESS||!G.A)return;const i=new Image();i.src='data:image/png;base64," + base64.b64encode(buf.getvalue()).decode() + "';(G.A.BuildingHD=G.A.BuildingHD||{})." + ID + "=i;})();")
img.save(os.environ.get('HD_PREVIEW', '/dev/null') if os.environ.get('HD_PREVIEW') else os.devnull if False else io.BytesIO(), 'PNG')
if os.environ.get('HD_PREVIEW'):
    img.save(os.environ['HD_PREVIEW'])
print('ok', img.size)
