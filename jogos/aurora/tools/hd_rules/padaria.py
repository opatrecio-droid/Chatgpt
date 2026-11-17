# remove as pás e o capuz pintados do moinho (a animação desenha capuz e pás girando) e refaz a torre de pedra
_H, _W = res.shape[:2]; _Y, _X = np.mgrid[0:_H, 0:_W]
_x1 = _X / 2.0; _y1 = _Y / 2.0
_rad = np.hypot(_x1 - 80, _y1 - 34)
_er = (_rad < 25) & (_y1 < (_x1 - 24)) & (res[..., 3] > 0)
res[_er, 3] = 0
_t = _er & (_x1 >= 70) & (_x1 <= 86.5) & (_y1 >= 37) & (_y1 <= 62)
_blk = hsh(_X // 7 + (_Y // 6 % 2) * 3, _Y // 6, 31)
_base = np.stack([150 + (_blk - .5) * 30, 140 + (_blk - .5) * 28, 128 + (_blk - .5) * 26], -1) + ((hsh(_X, _Y, 32) - .5) * 12)[..., None]
_m = (_Y % 6 == 0) | (((_X + (_Y // 6 % 2) * 3) % 7) == 0)
_base = np.where(_m[..., None], _base * 0.72, _base)
_sh = np.clip((_x1 - 70) / 16.5, 0, 1)[..., None]          # luz da esquerda, sombra à direita
_base = _base * (1.12 - 0.3 * _sh)
_edge = _t & ((_x1 < 70.6) | (_x1 > 85.6))
_base = np.where(_edge[..., None], np.array([42, 34, 44]), _base)
res[_t, :3] = np.clip(_base, 0, 255).astype(np.uint8)[_t]; res[_t, 3] = 255
