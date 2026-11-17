# telhado alaranjado: luz/sombra por fileira de telhas
_H, _W = res.shape[:2]; _Y, _X = np.mgrid[0:_H, 0:_W]
_c = res[..., :3].astype(np.float32); _r, _g, _b = _c[..., 0], _c[..., 1], _c[..., 2]
_mx = _c.max(-1); _mn = _c.min(-1); _sat = (_mx - _mn) / (_mx + 1); _lum = _c @ np.array([.299, .587, .114], np.float32)
_roof = (res[..., 3] > 128) & (_r > _g + 25) & (_g > _b + 30) & (_sat > 0.45) & (_lum > 95) & (_Y < 2 * 90)
_rr = _Y % 8
_d = np.where(_rr == 0, 20, np.where(_rr == 7, -26, 0)) + (hsh(_X // 5 + (_Y // 8 % 2) * 2, _Y // 8, 21) - 0.5) * 16
_c = _c + np.where(_roof, _d, 0)[..., None] * np.array([1, .9, .8], np.float32)
res[..., :3] = np.clip(_c, 0, 255).astype(np.uint8)
