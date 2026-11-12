/* 57-ui-icons: v27 (fase C) — os ícones da interface, desenhados em grades de texto (o contorno escuro de 1 px é automático).
   Letras: ver PX.IPAL em 56-ui-pixel.js (Y y a A Z = ouro, W S s t T = aço, e E d D c = madeira, R r q Q = vermelho, G g h H = verde,
   B b n N = azul, P p o O = roxo, K j J = rosa, M m l L = pergaminho, F f u = laranja, C i I = ciano). Luz de cima, à esquerda. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const PX = G.PX;
  PX.addIcons({
    coin: `
....aaaa....
..aaYYYyaa..
.aYYyyyyyyA.
aYyyyyyyyyyA
aYyyyaayyyyA
aYyyyaayyyyA
aYyyyaayyyyA
aYyyyaayyyyA
aYyyyyyyyyyA
.aAyyyyyyAA.
..aAAAAAAA..
....AAAA....`,
    seal: `
....jjjj....
..jjKKKjjj..
.jKKjjjjjjJ.
jKjjjJJJjjjJ
jKjjJjjjJjjJ
jjjjJjKjJjjJ
jjjjJjjjJjjJ
jjjjjJJJjjJJ
.jjjjjjjjJJ.
..jJJJJJJJ..
...jJ..Jq...
...jq..qq...`,
    core: `
...PPPPPP...
..PPpppppo..
.PPpPPpppoo.
PPpPPppppooO
PpppppppooOO
Ppppppooooo.
.PppppoooOO.
..poooooOO..
...pooooO...
....OOOO....`,
    heart: `
.rrr....rrr.
rRRrr..rrrqq
rRrrrrrrrrrq
rRrrrrrrrrrq
rrrrrrrrrrqq
.rrrrrrrrrq.
..qrrrrrqq..
...qrrrqq...
....qrqq....
.....qq.....`,
    sword: `
..........sW
.........sSW
........sSsT
.......sSsT.
......sSsT..
.....sSsT...
.Y..sSsT....
.aYsSsT.....
..aaST......
..aAa.......
.dEa........
dEd.........
.d..........`,
    shield: `
.AaaaaaaaaA.
.aYyyyyyyyA.
.aysssssssA.
.aysSSSssyA.
.aysSnnnsyA.
.aysSnnnsyA.
.aysssssyyA.
..aysssyyA..
...aysyyA...
....aAyA....
.....AA.....`,
    spark: `
.....Y......
.....Y......
....YyY.....
....YyY.....
YYYYyyyYYYy.
.yyyyyyyyya.
....yyA.....
....yyA.....
.....A......
.....A......`,
    star: `
.....YY.....
.....yy.....
....yyya....
YYyyyyyyyyaa
.yyyYyyyyaa.
..yyyyyyaa..
...yyyyya...
..yyyaayya..
..yyaAAaya..
..yaA..Aaa..
..aA....Aa..`,
    bag: `
....dEEd....
....EddE....
...cEEEEc...
..eEEEEEEE..
.eEEEEEEEEd.
.eEEaYaEEEd.
.eEEEaEEEEd.
.eEEEEEEEEd.
.eEEEEEEEdd.
..dddddddD..`,
    hammer: `
.....sSSSSt.
....sSssssT.
...sSsssstT.
..sSssssstTT
...sTTTTTTT.
....dEd.....
...dEd......
..dEd.......
.dEd........
.dd.........`,
    crown: `
.Y...Y...Y..
.yY.yyY.yy..
.yyYyyyYyya.
.yyyyyyyyya.
.ayyYyyYyyA.
.ayyyyyyyyA.
.aAAAAAAAAA.
.aRaAaBaAaA.
..AAAAAAAA..`,
    skull: `
..WWWWWWW...
.WSSSSSSSs..
WSSSSSSSSss.
WSkkSSSkkSs.
WSkkSSSkkSs.
WSSSSSSSSss.
.WSSSkSSsss.
..sSSSSSss..
...SkSkSs...
...sSsSss...
....tttt....`,
    scroll: `
..mMMMMMMm..
.mMmmmmmmlL.
.lMmlLLmmlL.
..LMmmmmmL..
..LMmLLmmL..
..LMmmmmmL..
..LMmLLmmL..
.lMmmmmmmlL.
.mMmmmmmmlL.
..lLLLLLLL..`,
    eye: `
.....WWW....
..WWSSSSSWW.
.WSSSbbbSSSW
WSSSbBnnbSSS
.sSSbnkknbSs
..ssSSnnSss.
....ssss....`,
    horn: `
.........SS.
........SSs.
.......SSss.
......SSsst.
..aaaSSsst..
.aYyySsstt..
.aYyySstt...
..aaaStt....
....StT.....
...SsT......
..st........`,
    sun: `
.....Y......
.Y...y...Y..
..Y.YYY.Y...
...YYyyaY...
YyyYyyyyaYyy
.YaYyyyyaYa.
...aYyyaaA..
..Y.aaaA.Y..
.Y...a...Y..
.....Y......`,
    moon: `
...bbbbb....
.bBBBnn.....
bBBnn.......
BBn.........
Bnn.........
Bnn.........
BBnn........
.BBnn.....nn
..bBnnnnnnN.
....nnnnnN..`,
    flag: `
.dD.........
.dDrrrrrr...
.dDrRRrrrrq.
.dDrRrrrrqq.
.dDrrrrrqq..
.dDrrrqqq...
.dDrqqq.....
.dDq........
.dD.........
.dD.........
.dD.........
ddDD........`,
    meal: `
....W..W....
...S.SS.S...
....S..S....
.aaaaaaaaaa.
aYyyyyyyyyyA
aAyyaaaayyAA
.aAAyyyyAAA.
..AAAAAAAA..
...AA..AA...`,
    bed: `
.dD.........
.dDbbbbbbb..
.dDBBBBBBBn.
.dDMMMMMMMn.
ddDMMMMmmmmn
dEDlllllllln
.dD........n
.dD.......dD
.dD.......dD`,
    bolt: `
.......YY...
......YyY...
.....YyyA...
....YyyA....
...YyyyyyA..
..YyyyyyA...
....yyyA....
....yyA.....
...yAA......
...AA.......`,
    smile: `
...yyyyyy...
.yyYYyyyyya.
.yYyyyyyyyya
yYyykyyykyyy
yYyykyyykyya
yYyyyyyyyyya
yYykyyyykyya
.yyykkkkyya.
.ayyyyyyyaa.
...aaaaaa...`,
    map: `
.mmmmMMmmmm..
mMMmmMmMMmmm.
mMlmmMmmLmmm.
mMlllMmmlLLm.
mMmmmMlmmmLm.
mMmrmMlmmmLm.
mMmmmMmmmmLm.
.mLLLMLLLLL..`,
    chest: `
..EEEEEEEEE.
.eEEEEEEEEEd
.eEdddddddEd
.eaaaaYaaaAd
.eEEEaAEEEEd
.eEEEEEEEEEd
.eEdddddddEd
.eEEEEEEEEEd
.dDDDDDDDDDc`,
    potion: `
....sSs.....
....tTt.....
....sSs.....
...sSSSs....
..sRRRRRs...
.sRRrrrrrqs.
.sRrrRrrrqs.
.sRrrrrrrqs.
.sRrrrrrqqs.
..sqqqqqqs..
...ssssss...`,
    gear: `
.....ss.....
..s..sS..s..
.sSsssSsssS.
..sSSttSSs..
.ssStTTtSss.
.ssStTTtSss.
..sSSttSSs..
.sSsssSsssS.
..s..sS..s..
.....ss.....`,
    gift: `
..rrr..rrr..
.rRRrrrRRrr.
..rrrrrrrr..
yyyyyayyyyyy
yYYYYaYYYYYa
yYyyyayyyyya
ayyyyayyyyaa
ayyyyayyyyaa
aAAAAaAAAAAA`,
    info: `
....bbbb....
..bBBBBbbb..
.bBBBnnBBbb.
.bBBBnnBBbn.
bBBBBBBBBbbn
bBBBnnnBBbbn
bBBBBnnBBbbn
.bBBBnnBBbn.
.nbBnnnnbnn.
..nnnnnnnn..`,
    trophy: `
.aaYYYYYYaa.
aAYyyyyyyaAa
a.Yyyyyyya.a
a.Yyyyyyya.a
.aAyyyyyyAa.
..aAyyyyAa..
....AyyA....
....aaaa....
...aYyyya...
..aAAAAAAa..`,
    portal: `
...ppppppp..
..pPOOOOOpp.
.pPOoooooOpp
.pOoPPPPooOp
pPOoPbbPPoOp
pPOoPbBbPoOp
pPOoPPPPPoOp
pPOooPPPooOp
pPOOoooooOOp
pdEEEEEEEEdp`,
    castle: `
.dd.dd.dd.dd.
.dDdDdDdDdDd.
.ssssssssssD.
.sSSsSSsSSsT.
.sSSsSSsSSsT.
.sssssssssss.
.sSSsEEEsSsT.
.sSSEEEEESsT.
.sSSEEEEESsT.
.TTTTEEEETTT.`,
    anvil: `
.sSSSSSSSSsss
sSSssssssssTt
.TsSssssssTT.
...tSSssTt...
....tSSTt....
...sSSSSst...
..sSSsssssT..
.TTTTTTTTTTT.`,
    people: `
...EEE..sss..
..EeeeE.SsSS.
..eFFFe.sFFs.
..eFFFe.sFFs.
...ooo...nn..
.PPpooPP.nnnn
PPpppoppnnBBn
PpppppppnnBBn
.pppppp..nnn.
.oooooo..nnn.`,
    paw: `
.dD..dD..dD.
dEEd.EEd.dEE
dEEd.EEd.dEE
.dd..dd..dd.
...ddEEdd...
..dEEEEEEd..
..EEEEEEEEd.
..EEEddEEEd.
...dEEEEEd..
....dddddd..`,
    shoe: `
..dEEEd.....
..EeEEd.....
..EEEEd.....
..EEEEd.....
..EEEEEd....
.dEEEEEEEd..
dEEEEEEEEEEd
dEEEEEEEEEEd
dDDDDDDDDDDD`,
    wing: `
...........SS
.........SSSs
.......SSSSss
.....SSSSSsss
..SSSSSSSsstt
.SSSSSSsssTT.
SSSSSssstTT..
.SSsssttTT...
..sttTTT.....
...TT........`,
    shirt: `
.bBBb...bBBb.
bBBBBbbbBBBBb
bBBBnBBBnBBBb
.bBBnBBBnBBb.
..bBBBBBBBb..
..bBBBBBBBn..
..bBBBBBBBn..
..bBBBBBBBn..
..nnnnnnnnn..`,
    flower: `
...jj.jj....
..jKKjKKj...
..jKyyyKj...
...jyYyj....
..jKjyjKj...
.jKKjjjKKj..
..jj.h.jj...
.....h......
...Gh.hG....
....hhh.....`,
    unlock: `
...sSSSs....
..sS...Ts...
..sS...Ts...
..sS........
.aaaaaaaaaa.
.aYyyyyyyyA.
.aYyyAAyyyA.
.aYyyAAyyyA.
.aYyyyyyyyA.
.aAAAAAAAAA.`,
    lock: `
...sSSSs....
..sS...Ts...
..sS...Ts...
..sS...Ts...
.aaaaaaaaaa.
.aYyyyyyyyA.
.aYyyAAyyyA.
.aYyyAAyyyA.
.aYyyyAyyyA.
.aAAAAAAAAA.`,
    trash: `
...sSSSSs...
.TTTTTTTTTT.
.sSSSSSSSSs.
..sSsSsSsSt.
..sSsSsSsSt.
..sSsSsSsSt.
..sSsSsSsSt.
..sSsSsSsSt.
..tttttttTT.`,
    save: `
.sSSSSSSSSs.
.StSSSSSSTS.
.StwwwwwwTS.
.StwwwwwwTS.
.SSSSSSSSSs.
.SSTTTTTTSs.
.SSTbbbbTSs.
.SSTbbbbTSs.
.tttttttttt.`,
    vol: `
....sS......
...sSS..s...
..sSSS...s..
YYsSSS.s.s..
YYsSSS.s.s..
..sSSS...s..
...sSS..s...
....sS......`,
    zzz: `
.PPPPPP.....
.....Pp.....
....Pp...PPP
...Pp.....Pp
..Pp.....Pp.
.PPPPPP.PPPP
.......oo...`,
    run: `
......YYY...
.....YyyyY..
......YyY...
..yyyyyyy...
.yyyyyyyy...
...yyyy.yy..
..yyyyy..yy.
.yy..yyy..y.
yy....yyy...
y.....yyyy..`,
    wheat: `
..a..a..a...
.aYa.aYa.aYa
.aYa.aYa.aYa
..aY..aY.aY.
..aA..aA.aA.
...AaaAaaA..
....hhhhh...
.....hhh....
.....hh.....`,
    wave: `
....BB......
..BBBbBB....
.BBbbbbBB...
bBbbnnnbbB.b
BBbnnNNnnbbB
bbnnNNNNnnbb
..nNNNNNNnN.`,
    speed: `
.bbb.....bbb
.bBBb...bBBb
.bBBBb.bBBBb
.bBBBBbbBBBb
.bBBBb.bBBBb
.bBBb...bBBb
.bbb.....bbb`,
    target: `
.....rr.....
...rrRRrr...
..rRrrrrRr..
.rRrWWWWrRr.
rrRrWrrWrRrr
rrRrWrrWrRrr
.rRrWWWWrRr.
..rRrrrrRr..
...rrRRrr...
.....rr.....`,
    road: `
.....dD.....
....dDDd....
....dEEd....
...dEEEEd...
...dEyyEd...
..dEEEEEEd..
..dEEyyEEd..
.dEEEEEEEEd.
.dEEEyyEEEd.
dEEEEEEEEEEd`,
    grid: `
sSSSs.sSSSs.
sSSTs.sSSTs.
sSSTs.sSSTs.
.TTTT.tTTTT.
sSSSs.sSSSs.
sSSTs.sSSTs.
sSSTs.sSSTs.
.TTTT.tTTTT.`,
    sort: `
sSSSSSSSSSs.
.TTTTTTTTT..
sSSSSSSSs...
.TTTTTTT....
sSSSSs......
.TTTT.......`,
    book: `
.nbbbbbbbbN.
nbBBBBBBBBnN
nbBnnnnnnBnN
nbBBBBBBBBnN
nbBnnnnBBBnN
nbBBBBBBBBnN
nbBnnnnnnBnN
nbBBBBBBBBnN
.NNNNNNNNNN.`,
  });
  /* segunda passada: ícones refeitos depois da primeira revisão visual */
  PX.addIcons({
    seal: `
....jjjj....
..jjKKjjjj..
.jKKjjjjjjJ.
jKjjjjjjjjjJ
jKjjJJJJjjjJ
jjjJjjjjJjjJ
jjjJjjKjJjjJ
jjjJjjjjJjjJ
jjjjJJJJjjJJ
.jjjjjjjjJJ.
..jJJJJJJJ..
....JJJJ....`,
    horn: `
..........aa
........aaYy
......aaYyyy
....aaYyyyyA
..aaYyyyyyAA
.aYyyyyyAAA.
aYyyyAAAA...
aYyAAA......
.aAA........`,
    map: `
.mMMMlMMMMlMMm
mMMMMlMMMMlMMl
mMrMrlMMLMlMMl
mMMrMlMLMMlMMl
mMrMrlMMMMlMMl
mMMMMlMMMMlMMl
.lllllllllllll`,
    info: `
...bbbbbb...
..bBBBBBBb..
.bBBBwwBBBn.
bBBBBwwBBBBn
bBBBBBBBBBBn
bBBBBwwBBBBn
bBBBBwwBBBBn
bBBBBwwBBBBn
.bBBBwwBBBn.
..nBBBBBBnn.
...nnnnnn...`,
    speed: `
b.....b.....
bBb...bBb...
bBBb..bBBb..
bBBBb.bBBBb.
bBBBBnbBBBBn
bBBBb.bBBBb.
bBBb..bBBb..
bBb...bBb...
b.....b.....`,
    target: `
.....rr.....
...rrrrrr...
..rRRRRRrq..
.rRRWWWWrrq.
.rRWqqqqWrq.
rrRWqWWqWrqq
rrRWqWWqWrqq
.rRWqqqqWrq.
.rrrWWWWrrq.
..qrrrrrrq..
...qqqqqq...
.....qq.....`,
    road: `
.....TT.....
....tsst....
....tsst....
...tsSSst...
...tsyyst...
..tsSSSSst..
..tssyyssT..
.tsSSSSSSsT.
.tsssyysssT.
tsSSSSSSSSsT`,
    sort: `
SSSSSSSSSSSS
tttttttttttt
............
SSSSSSSS....
tttttttt....
............
SSSS........
tttt........`,
  });
  /* glifos de uma cor só (tingidos pela cor do texto) */
  PX.addMono({
    close: `
WW......WW
WWW....WWW
.WWW..WWW.
..WWWWWW..
...WWWW...
...WWWW...
..WWWWWW..
.WWW..WWW.
WWW....WWW
WW......WW`,
    back: `
...WW...
..WWW...
.WWW....
WWW.....
WWW.....
.WWW....
..WWW...
...WW...`,
    next: `
..WW....
..WWW...
...WWW..
....WWW.
....WWW.
...WWW..
..WWW...
..WW....`,
    plus: `
....WW....
....WW....
....WW....
WWWWWWWWWW
WWWWWWWWWW
....WW....
....WW....
....WW....`,
    minus: `
..........
WWWWWWWWWW
WWWWWWWWWW
..........`,
    check: `
........WW
.......WWW
......WWW.
WW...WWW..
WWW.WWW...
.WWWWW....
..WWW.....
...W......`,
    up: `
....WW....
...WWWW...
..WWWWWW..
.WWWWWWWW.
WWWWWWWWWW
...WWWW...
...WWWW...
...WWWW...`,
    pause: `
WWWW..WWWW
WWWW..WWWW
WWWW..WWWW
WWWW..WWWW
WWWW..WWWW
WWWW..WWWW
WWWW..WWWW`,
    play: `
WW........
WWWW......
WWWWWW....
WWWWWWWW..
WWWWWWWW..
WWWWWW....
WWWW......
WW........`,
    chevd: `
WW......WW
.WW....WW.
..WW..WW..
...WWWW...
....WW....`,
    chevu: `
....WW....
...WWWW...
..WW..WW..
.WW....WW.
WW......WW`,
  });
})();

;
