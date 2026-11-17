# remove o bloco e a corrente pendurados no guindaste (a animação desenha o balde e a corda); coordenadas 1x ×2
def _clr(x0, y0, x1, y1): res[y0 * 2:y1 * 2, x0 * 2:x1 * 2, 3] = 0
_clr(5, 51, 19, 70)      # corrente
_clr(5, 62, 25, 83)      # pedra pendurada e o triângulo de cordas
