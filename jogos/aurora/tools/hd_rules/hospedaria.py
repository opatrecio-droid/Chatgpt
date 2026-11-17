# telhado roxo: luz/sombra por fileira de telhas
_H, _W = res.shape[:2]; _Y, _X = np.mgrid[0:_H, 0:_W]
_c = res[..., :3].astype(np.float32); _r, _g, _b = _c[..., 0], _c[..., 1], _c[..., 2]
_roof = (res[..., 3] > 128) & (_b > _g + 12) & (_r > _g + 6) & (_Y < 2 * 82)
_rr = _Y % 8
_d = np.where(_rr == 0, 18, np.where(_rr == 7, -24, 0)) + (hsh(_X // 5 + (_Y // 8 % 2) * 2, _Y // 8, 22) - 0.5) * 14
_c = _c + np.where(_roof, _d, 0)[..., None] * np.array([1, .9, 1.1], np.float32)
res[..., :3] = np.clip(_c, 0, 255).astype(np.uint8)
