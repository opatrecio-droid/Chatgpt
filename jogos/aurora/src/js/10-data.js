/* 10-data: conteúdo declarativo — classes, traços, monstros, zonas, itens, construções. */
'use strict';

/* ---------- curvas ---------- */
G.PW = (l) => Math.pow(1.075, l - 1);      // poder do mundo (monstros, equipamento)
G.HW = (l) => Math.pow(1.052, l - 1);      // crescimento natural do herói
G.PM = (l) => Math.pow(1.062, l - 1);      // preços dos serviços
G.xpNeed = (l) => Math.round(45 * Math.pow(l, 0.8) * Math.pow(1.062, l - 1));
G.realmNeed = (l) => Math.round(250 * Math.pow(l, 1.45));

/* ---------- ranks ---------- */
G.RANKS = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
G.RANK_CAP = [10, 20, 30, 40, 50, 60, 70, 80];
G.RANK_MULT = [1, 1.12, 1.26, 1.42, 1.6, 1.8, 2.05, 2.35];
G.RANK_COLOR = ['#9aa3ad', '#6fbf73', '#4aa3df', '#a47be0', '#e9a23b', '#e85d5d', '#f06fb0', '#ffe07a'];

G.RAR = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário', 'Mítico'];
G.RAR_COLOR = ['#b9c0c9', '#74d08a', '#5bb3f0', '#b58cf2', '#f5b041', '#ff6b81'];
G.RAR_MULT = [1, 1.18, 1.4, 1.7, 2.1, 2.7];
G.RAR_PRICE = [1, 1.6, 2.8, 5, 9, 16];
G.HERO_RAR_MULT = [1, 1.07, 1.16, 1.27, 1.4, 1.55];

/* ---------- classes ---------- */
G.CLASSES = {
  esp: { name: 'Espadachim', evo: ['Espadachim', 'Mestre de Lâminas', 'Santo da Espada'], w: 'espada', a: 'media',
    hp: 125, atk: 14, def: 6, int: 1.05, rng: 1.25, crit: 0.08, eva: 0.05, spd: 2.5,
    skill: { name: 'Golpe Giratório', cd: 9, desc: 'Atinge todos os inimigos ao redor com 150% do ataque.' },
    desc: 'Equilibrado e confiável. Corta tudo o que cerca.', color: '#c8473d' },
  cav: { name: 'Cavaleiro', evo: ['Cavaleiro', 'Guardião de Aço', 'Baluarte Real'], w: 'lanca', a: 'pesada',
    hp: 175, atk: 11, def: 11, int: 1.3, rng: 1.45, crit: 0.05, eva: 0.02, spd: 2.25,
    skill: { name: 'Muralha', cd: 14, desc: 'Provoca os inimigos próximos e reduz o dano recebido em 55% por 5 s.' },
    desc: 'Aguenta o que os outros não aguentam.', color: '#5b7fb5' },
  arq: { name: 'Arqueiro', evo: ['Arqueiro', 'Atirador de Elite', 'Olho de Falcão'], w: 'arco', a: 'media',
    hp: 95, atk: 15, def: 4, int: 1.0, rng: 5.4, crit: 0.13, eva: 0.08, spd: 2.6,
    skill: { name: 'Chuva de Flechas', cd: 10, desc: 'Dispara três flechas seguidas, 90% do ataque cada.' },
    desc: 'Dano constante de longe. Frágil de perto.', color: '#4f9d5d' },
  mag: { name: 'Mago', evo: ['Mago', 'Arquimago', 'Sábio da Fenda'], w: 'cajado', a: 'leve',
    hp: 82, atk: 19, def: 3, int: 1.5, rng: 5.0, crit: 0.07, eva: 0.04, spd: 2.3,
    skill: { name: 'Bola de Fogo', cd: 11, desc: 'Explode no alvo e ao redor com 210% do ataque.' },
    desc: 'O maior dano em área. Cai rápido se for cercado.', color: '#8a62c9' },
  pal: { name: 'Paladino', evo: ['Paladino', 'Cruzado da Aurora', 'Avatar das Duas Luas'], w: 'martelo', a: 'pesada',
    hp: 145, atk: 11, def: 9, int: 1.2, rng: 1.3, crit: 0.05, eva: 0.03, spd: 2.3,
    skill: { name: 'Luz Restauradora', cd: 13, desc: 'Cura a si e aos aliados próximos em 24% da vida.' },
    desc: 'Mantém o grupo de pé.', color: '#d9b24a' },
  lad: { name: 'Ladino', evo: ['Ladino', 'Sombra Veloz', 'Fantasma da Meia-Noite'], w: 'adaga', a: 'media',
    hp: 100, atk: 13, def: 4, int: 0.8, rng: 1.15, crit: 0.18, eva: 0.14, spd: 2.85,
    skill: { name: 'Golpe Sombrio', cd: 8, desc: 'Crítico garantido de 260% e rouba moedas do alvo.' },
    desc: 'Crítico, esquiva e bolsos cheios.', color: '#4b5563' },
};
G.CLASS_IDS = Object.keys(G.CLASSES);

/* ---------- traços ---------- */
G.TRAITS = {
  corajoso:   { name: 'Corajoso',   desc: 'Recua mais tarde e encara zonas mais fortes. +6% ataque.', atk: 0.06, retreat: -0.1, brave: 2 },
  medroso:    { name: 'Medroso',    desc: 'Recua cedo e escolhe zonas seguras. +10% esquiva.', eva: 0.1, retreat: 0.15, brave: -3 },
  guloso:     { name: 'Guloso',     desc: 'Fome cresce 35% mais rápido. +12% vida.', hp: 0.12, hunger: 0.35 },
  generoso:   { name: 'Generoso',   desc: 'Paga 25% a mais pelos serviços da cidade.', tip: 0.25 },
  ambicioso:  { name: 'Ambicioso',  desc: '+15% de experiência.', xp: 0.15 },
  preguicoso: { name: 'Preguiçoso', desc: 'Cansa 30% mais rápido. Recupera mais ânimo descansando.', tire: 0.3 },
  notivago:   { name: 'Notívago',   desc: 'Caça à noite. +12% ataque sob as luas.', night: 1 },
  sortudo:    { name: 'Sortudo',    desc: '+25% de chance de espólio.', drop: 0.25 },
  teimoso:    { name: 'Teimoso',    desc: 'Nunca recua de um chefe. +8% defesa.', def: 0.08, stubborn: 1 },
  focado:     { name: 'Focado',     desc: '+8% de chance de crítico.', crit: 0.08 },
  impulsivo:  { name: 'Impulsivo',  desc: 'Ataca 10% mais rápido, 6% menos defesa.', aspd: 0.1, def: -0.06, brave: 1 },
  robusto:    { name: 'Robusto',    desc: '+12% de defesa.', def: 0.12 },
  sociavel:   { name: 'Sociável',   desc: 'Levanta o ânimo dos aliados por perto.', social: 1 },
  cacador:    { name: 'Caça-elites', desc: '+20% de dano contra elites e chefes.', elite: 0.2 },
  invocado:   { name: 'Invocado',   desc: 'Veio de outro mundo pelo Portal. +10% em tudo e +20% de experiência.', atk: 0.1, hp: 0.1, def: 0.1, xp: 0.2 },
};
G.TRAIT_POOL = ['corajoso', 'medroso', 'guloso', 'generoso', 'ambicioso', 'preguicoso', 'notivago', 'sortudo', 'teimoso', 'focado', 'impulsivo', 'robusto', 'sociavel', 'cacador'];

G.HERO_NAMES = ['Aiden', 'Lyra', 'Ren', 'Sora', 'Yuki', 'Haru', 'Darius', 'Elara', 'Finn', 'Gwen', 'Ivo', 'Jade', 'Lior', 'Maia', 'Nilo', 'Orin', 'Petra', 'Rurik', 'Selene', 'Tariq', 'Ulla', 'Vance', 'Wren', 'Xande', 'Zuri', 'Akira', 'Bran', 'Cora', 'Dante', 'Enzo', 'Freya', 'Gael', 'Hana', 'Isolde', 'Joren', 'Kira', 'Luan', 'Mei', 'Nora', 'Otto', 'Raiden', 'Saya', 'Theo', 'Uriel', 'Vera', 'Zeca', 'Aska', 'Baltazar', 'Ciro', 'Dália', 'Erin', 'Fausto', 'Greta', 'Hugo', 'Ícaro', 'Juno', 'Kenji', 'Lúcia', 'Magnus', 'Naomi', 'Oriana', 'Pietro', 'Quésia', 'Rômulo', 'Shin', 'Talia'];
G.CAUTION = [{ name: 'Ousado', thr: 0.2 }, { name: 'Equilibrado', thr: 0.35 }, { name: 'Cauteloso', thr: 0.5 }];

/* ---------- recursos e materiais ---------- */
/* shape = desenho do ícone; c = cores [base, sombra, luz] */
G.RES = {
  madeira:  { name: 'Madeira', shape: 'log', c: ['#9a6a3c', '#6b4424', '#c8975c'], base: 2 },
  pedra:    { name: 'Pedra', shape: 'rock', c: ['#9aa0a8', '#6a707a', '#c9ced4'], base: 3 },
  minerio:  { name: 'Minério', shape: 'ore', c: ['#7b8794', '#4a5560', '#e0a35a'], base: 5 },
  trigo:    { name: 'Trigo', shape: 'wheat', c: ['#e2b84a', '#a87f24', '#f7de8a'], base: 1 },
  ervas:    { name: 'Ervas', shape: 'leaf', c: ['#5cab5a', '#35763a', '#9be08a'], base: 2 },
  refeicao: { name: 'Refeição', shape: 'meal', c: ['#c98a4b', '#8a5526', '#f2d39a'], base: 4 },
  pocao:    { name: 'Poção', shape: 'potion', c: ['#e0506a', '#9c2c44', '#ff9db0'], base: 8 },
  gosma:    { name: 'Gosma', shape: 'blob', c: ['#7ccf6a', '#4a9544', '#c5f5a8'], z: 1, base: 3 },
  couro:    { name: 'Couro', shape: 'pelt', c: ['#a8744a', '#74492a', '#d2a070'], z: 1, base: 4 },
  presa:    { name: 'Presa Selvagem', shape: 'fang', c: ['#efe6d2', '#b9a988', '#ffffff'], z: 1, rare: 1, base: 30 },
  osso:     { name: 'Osso Antigo', shape: 'bone', c: ['#e6dcc4', '#a89c80', '#fffaf0'], z: 2, base: 7 },
  po_ocre:  { name: 'Pó de Ocre', shape: 'pile', c: ['#d49a3a', '#99651c', '#f5c870'], z: 2, base: 8 },
  runa:     { name: 'Fragmento Rúnico', shape: 'rune', c: ['#59b8d9', '#2c7896', '#b8f0ff'], z: 2, rare: 1, base: 60 },
  quitina:  { name: 'Quitina', shape: 'scale', c: ['#6e5a8a', '#42345a', '#a892c8'], z: 3, base: 14 },
  tendao:   { name: 'Tendão de Orc', shape: 'pelt', c: ['#b8584a', '#7a2e26', '#e89080'], z: 3, base: 16 },
  cristal:  { name: 'Cristal da Fenda', shape: 'crystal', c: ['#b06ae8', '#6e34a8', '#e6c0ff'], z: 3, rare: 1, base: 120 },
  escama:   { name: 'Escama do Charco', shape: 'scale', c: ['#4a9a8a', '#266a5c', '#8ad8c8'], z: 4, base: 28 },
  musgo:    { name: 'Musgo Brumoso', shape: 'leaf', c: ['#6a9a7a', '#3c6a4e', '#a8d8b8'], z: 4, base: 30 },
  perola:   { name: 'Pérola Negra', shape: 'orb', c: ['#3a3f5a', '#1c2036', '#9aa8e8'], z: 4, rare: 1, base: 240 },
  pelagem:  { name: 'Pelagem Gélida', shape: 'pelt', c: ['#cfe4f2', '#8ab0c8', '#ffffff'], z: 5, base: 55 },
  gelo:     { name: 'Gelo Eterno', shape: 'crystal', c: ['#8ad0f0', '#4a94c0', '#e0f8ff'], z: 5, base: 60 },
  coracao:  { name: 'Coração de Gelo', shape: 'orb', c: ['#6ac8f8', '#2a80c0', '#e8fbff'], z: 5, rare: 1, base: 480 },
  escoria:  { name: 'Escória Ardente', shape: 'rock', c: ['#6a4a48', '#3a2422', '#f08040'], z: 6, base: 110 },
  escdrac:  { name: 'Escama Dracônica', shape: 'scale', c: ['#c84a3a', '#84241c', '#ff9a70'], z: 6, base: 120 },
  brasa:    { name: 'Brasa Viva', shape: 'flame', c: ['#ff8a3a', '#c8401c', '#ffe08a'], z: 6, rare: 1, base: 950 },
  emb1:     { name: 'Emblema do Bosque', shape: 'emblem', c: ['#5cab5a', '#35763a', '#e2b659'], z: 1, emb: 1, base: 80 },
  emb2:     { name: 'Emblema de Ocre', shape: 'emblem', c: ['#d49a3a', '#99651c', '#e2b659'], z: 2, emb: 1, base: 160 },
  emb3:     { name: 'Emblema dos Ermos', shape: 'emblem', c: ['#b06ae8', '#6e34a8', '#e2b659'], z: 3, emb: 1, base: 320 },
  emb4:     { name: 'Emblema das Brumas', shape: 'emblem', c: ['#4a9a8a', '#266a5c', '#e2b659'], z: 4, emb: 1, base: 640 },
  emb5:     { name: 'Emblema do Pico', shape: 'emblem', c: ['#8ad0f0', '#4a94c0', '#e2b659'], z: 5, emb: 1, base: 1280 },
  emb6:     { name: 'Emblema Dracônico', shape: 'emblem', c: ['#c84a3a', '#84241c', '#e2b659'], z: 6, emb: 1, base: 2560 },
  essencia: { name: 'Essência da Fenda', shape: 'flame', c: ['#9a6af8', '#5a2ac8', '#e0c8ff'], rare: 1, base: 400 },
  tomo:     { name: 'Tomo de Técnica', shape: 'tome', c: ['#3b6fb5', '#24477a', '#f2e6c0'], rare: 1, sp: 1, base: 90 },
  alma:     { name: 'Cristal de Alma', shape: 'soul', c: ['#7ae0d0', '#2f9a8e', '#eafffb'], rare: 1, sp: 1, base: 600 },
  po_estelar: { name: 'Pó Estelar', shape: 'dust', c: ['#f0d070', '#b08c30', '#fff8d0'], rare: 1, sp: 1, base: 25 },
  racao:    { name: 'Ração', shape: 'feed', c: ['#b08a4a', '#7a5a2a', '#e0c080'], sp: 1, base: 3 },
};
G.BASE_RES = ['madeira', 'pedra', 'minerio', 'trigo', 'ervas', 'refeicao', 'pocao'];
G.ZMATS = [null,
  { a: 'gosma', b: 'couro', r: 'presa', e: 'emb1' },
  { a: 'osso', b: 'po_ocre', r: 'runa', e: 'emb2' },
  { a: 'quitina', b: 'tendao', r: 'cristal', e: 'emb3' },
  { a: 'escama', b: 'musgo', r: 'perola', e: 'emb4' },
  { a: 'pelagem', b: 'gelo', r: 'coracao', e: 'emb5' },
  { a: 'escoria', b: 'escdrac', r: 'brasa', e: 'emb6' },
];

/* ---------- monstros ---------- */
/* fam = família de desenho; pal = paleta; lo = desvio de nível; beh = comportamento */
G.MON = {
  slime:   { name: 'Slime de Musgo', fam: 'slime', pal: ['#7ccf6a', '#4a9544', '#c5f5a8'], hp: 0.85, atk: 0.75, spd: 1.1, int: 1.7, rng: 1.0, lo: -1, mat: 'a', size: 1 },
  lobo:    { name: 'Lobo Cinzento', fam: 'wolf', pal: ['#8a8f9a', '#565b66', '#c8ccd4'], hp: 0.9, atk: 1.0, spd: 2.5, int: 1.2, rng: 1.1, lo: 0, mat: 'b', pack: 1, size: 1 },
  javali:  { name: 'Javali Bravo', fam: 'boar', pal: ['#8a5a3c', '#5a3622', '#c89a70'], hp: 1.35, atk: 1.1, spd: 2.0, int: 1.6, rng: 1.1, lo: 1, mat: 'b', size: 1.1 },
  goblin:  { name: 'Goblin Batedor', fam: 'goblin', pal: ['#6aa84f', '#3f6f2e', '#a8d88a'], hp: 1.0, atk: 1.15, spd: 2.2, int: 1.3, rng: 1.1, lo: 2, mat: 'a', gold: 1.6, size: 1 },
  esqueleto: { name: 'Esqueleto de Ocre', fam: 'skeleton', pal: ['#e6dcc4', '#a89c80', '#fffaf0'], hp: 1.0, atk: 1.05, spd: 1.8, int: 1.4, rng: 1.2, lo: 0, mat: 'a', size: 1 },
  morcego: { name: 'Morcego das Criptas', fam: 'bat', pal: ['#5a4a6a', '#34283f', '#9a84b0'], hp: 0.6, atk: 0.9, spd: 3.0, int: 1.0, rng: 1.0, lo: -1, mat: 'b', eva: 0.2, fly: 1, size: 0.9 },
  xama:    { name: 'Goblin Xamã', fam: 'goblin', pal: ['#4f9a8a', '#2c6a5c', '#8ad8c8'], robe: '#7a3a9a', hp: 0.8, atk: 1.25, spd: 1.8, int: 1.9, rng: 4.6, lo: 1, mat: 'b', ranged: '#b06ae8', gold: 1.4, size: 1 },
  golem:   { name: 'Golem de Ocre', fam: 'golem', pal: ['#c8964a', '#8a6228', '#f0c880'], hp: 2.2, atk: 1.3, spd: 1.2, int: 2.2, rng: 1.3, lo: 2, mat: 'b', def: 2.2, size: 1.35 },
  orc:     { name: 'Orc da Fenda', fam: 'orc', pal: ['#7a9a5a', '#4a6a34', '#aac88a'], hp: 1.5, atk: 1.2, spd: 2.0, int: 1.5, rng: 1.3, lo: 0, mat: 'b', size: 1.2 },
  aranha:  { name: 'Aranha Fendida', fam: 'spider', pal: ['#5a4a7a', '#34284a', '#b06ae8'], hp: 0.9, atk: 0.95, spd: 2.7, int: 1.1, rng: 1.1, lo: -1, mat: 'a', poison: 1, pack: 1, size: 1 },
  espectro: { name: 'Espectro Errante', fam: 'specter', pal: ['#a8c8f0', '#6a8ac8', '#ffffff'], hp: 0.8, atk: 1.3, spd: 1.9, int: 1.8, rng: 4.4, lo: 1, mat: 'a', ranged: '#a8c8f0', pierce: 0.5, fly: 1, size: 1.05 },
  quimera: { name: 'Quimera Menor', fam: 'boar', pal: ['#a8483a', '#6a2620', '#f0a070'], hp: 1.9, atk: 1.4, spd: 2.3, int: 1.5, rng: 1.3, lo: 2, mat: 'b', size: 1.35 },
  lodo:    { name: 'Lodo Brumoso', fam: 'slime', pal: ['#5a8a7a', '#2f5a4e', '#a0d8c8'], hp: 1.3, atk: 0.9, spd: 1.2, int: 1.6, rng: 1.0, lo: -1, mat: 'b', poison: 1, size: 1.15 },
  vespa:   { name: 'Vespa Gigante', fam: 'bat', pal: ['#e0b83a', '#8a6a1c', '#3a2a1a'], hp: 0.7, atk: 1.2, spd: 3.2, int: 0.9, rng: 1.0, lo: 0, mat: 'b', eva: 0.22, fly: 1, pack: 1, size: 0.95 },
  lagarto: { name: 'Homem-Lagarto', fam: 'goblin', pal: ['#4a9a8a', '#266a5c', '#8ad8c8'], hp: 1.3, atk: 1.25, spd: 2.3, int: 1.3, rng: 1.3, lo: 1, mat: 'a', big: 1, size: 1.15 },
  treant:  { name: 'Treant Podre', fam: 'golem', pal: ['#6a5a3a', '#3f3420', '#7ab85a'], hp: 2.4, atk: 1.35, spd: 1.1, int: 2.1, rng: 1.4, lo: 2, mat: 'b', def: 1.8, size: 1.4 },
  lobogelo: { name: 'Lobo da Nevasca', fam: 'wolf', pal: ['#dfeaf2', '#9ab4c8', '#ffffff'], hp: 1.0, atk: 1.15, spd: 2.7, int: 1.1, rng: 1.1, lo: 0, mat: 'a', pack: 1, size: 1.1 },
  yeti:    { name: 'Yeti', fam: 'orc', pal: ['#e8f0f5', '#a8bccc', '#ffffff'], hp: 2.0, atk: 1.35, spd: 1.9, int: 1.7, rng: 1.4, lo: 2, mat: 'a', size: 1.4 },
  elemental: { name: 'Elemental de Gelo', fam: 'specter', pal: ['#8ad0f0', '#4a94c0', '#e8fbff'], hp: 1.0, atk: 1.4, spd: 1.8, int: 1.7, rng: 4.8, lo: 1, mat: 'b', ranged: '#8ad0f0', pierce: 0.4, fly: 1, size: 1.1 },
  harpia:  { name: 'Harpia', fam: 'bat', pal: ['#c8a880', '#8a6a48', '#f0e0c0'], hp: 0.9, atk: 1.3, spd: 3.1, int: 1.0, rng: 1.1, lo: 0, mat: 'a', eva: 0.2, fly: 1, size: 1.2 },
  salamandra: { name: 'Salamandra', fam: 'goblin', pal: ['#d8583a', '#8a2a1c', '#ffb070'], hp: 1.3, atk: 1.35, spd: 2.4, int: 1.2, rng: 1.3, lo: 0, mat: 'b', big: 1, burn: 1, size: 1.15 },
  cao:     { name: 'Cão Infernal', fam: 'wolf', pal: ['#5a3a3a', '#2f1c1c', '#ff7a3a'], hp: 1.1, atk: 1.3, spd: 2.9, int: 1.0, rng: 1.1, lo: 0, mat: 'a', pack: 1, burn: 1, size: 1.15 },
  magma:   { name: 'Golem de Magma', fam: 'golem', pal: ['#5a3a34', '#2f1c18', '#ff8a3a'], hp: 2.6, atk: 1.5, spd: 1.2, int: 2.0, rng: 1.4, lo: 2, mat: 'a', def: 2.2, burn: 1, size: 1.45 },
  cultista: { name: 'Cultista da Brasa', fam: 'goblin', pal: ['#d8a888', '#9a6a4c', '#f8d8c0'], robe: '#8a1c1c', hp: 0.95, atk: 1.5, spd: 1.9, int: 1.8, rng: 4.8, lo: 1, mat: 'b', ranged: '#ff8a3a', gold: 1.8, size: 1.05 },
  /* chefes */
  anciao:  { name: 'Ancião da Matilha', fam: 'wolf', pal: ['#4a4f5a', '#262a33', '#e85d5d'], boss: 1, hp: 34, atk: 1.5, spd: 2.4, int: 1.5, rng: 1.7, size: 2.3 },
  lich:    { name: 'Lich de Ocre', fam: 'lich', pal: ['#e6dcc4', '#a89c80', '#59b8d9'], boss: 1, hp: 30, atk: 1.7, spd: 1.6, int: 1.9, rng: 5.2, ranged: '#59b8d9', size: 2.0 },
  hidra:   { name: 'Hidra da Fenda', fam: 'hydra', pal: ['#7a5aa8', '#4a3470', '#e6c0ff'], boss: 1, hp: 38, atk: 1.6, spd: 1.3, int: 1.3, rng: 2.2, size: 2.5 },
  brumas:  { name: 'Mãe das Brumas', fam: 'hydra', pal: ['#4a9a8a', '#266a5c', '#d8fff0'], boss: 1, hp: 40, atk: 1.7, spd: 1.4, int: 1.3, rng: 2.2, poison: 1, size: 2.6 },
  wyrm:    { name: 'Wyrm Glacial', fam: 'dragon', pal: ['#8ad0f0', '#4a94c0', '#ffffff'], boss: 1, hp: 42, atk: 1.8, spd: 1.7, int: 1.6, rng: 2.4, size: 2.8 },
  dragao:  { name: 'Dragão das Cinzas', fam: 'dragon', pal: ['#c84a3a', '#84241c', '#ffd070'], boss: 1, hp: 46, atk: 1.9, spd: 1.7, int: 1.5, rng: 2.6, burn: 1, size: 3.0 },
  arauto:  { name: 'Arauto da Fenda', fam: 'lich', pal: ['#3a2a5a', '#1c1234', '#d070ff'], boss: 1, hp: 34, atk: 1.7, spd: 1.8, int: 1.6, rng: 5.0, ranged: '#d070ff', size: 2.2 },
};
G.MON_IDS = Object.keys(G.MON);
G.FAM_NAME = { slime: 'Gosmas', wolf: 'Feras', boar: 'Bestas', goblin: 'Goblinoides', skeleton: 'Mortos-vivos', bat: 'Alados', golem: 'Colossos', orc: 'Brutos', spider: 'Aracnídeos', specter: 'Espíritos', lich: 'Arcanos', hydra: 'Serpes', dragon: 'Dragões' };

/* ---------- zonas ---------- */
/* rect = [x0,y0,x1,y1] em tiles; lvl base; unlock = Nível do Reino */
G.ZONES = [
  { id: 'bosque', n: 1, name: 'Bosque Sussurrante', lvl: 1, unlock: 1, rect: [24, 8, 63, 33], gate: 'n', tile: 'forest', lair: [43.5, 12],
    mons: [['slime', 4], ['lobo', 3], ['javali', 2], ['goblin', 2]], boss: 'anciao', cap: 13, color: '#5cab5a',
    lore: 'Árvores velhas que cochicham à noite. Onde todo caçador de Aurora começa.' },
  { id: 'ruinas', n: 2, name: 'Ruínas de Ocre', lvl: 9, unlock: 3, rect: [3, 38, 21, 70], gate: 'w', tile: 'ruin', lair: [8, 54],
    mons: [['esqueleto', 4], ['morcego', 3], ['xama', 2], ['golem', 1.5]], boss: 'lich', cap: 12, color: '#d49a3a',
    lore: 'Uma cidade mais antiga que Aurora, engolida pela areia e pelos mortos.' },
  { id: 'ermos', n: 3, name: 'Ermos da Fenda', lvl: 18, unlock: 7, rect: [24, 75, 63, 101], gate: 's', tile: 'waste', lair: [43.5, 97],
    mons: [['orc', 3], ['aranha', 4], ['espectro', 2], ['quimera', 1.5]], boss: 'hidra', cap: 13, color: '#b06ae8',
    lore: 'A terra rachou aqui primeiro. O ar vibra em roxo.' },
  { id: 'pantano', n: 4, name: 'Pântano das Brumas', lvl: 28, unlock: 12, rect: [73, 39, 85, 72], gate: 'e', tile: 'swamp', lair: [80, 66],
    mons: [['lodo', 4], ['vespa', 3], ['lagarto', 3], ['treant', 1.5]], boss: 'brumas', cap: 12, color: '#4a9a8a',
    lore: 'Névoa densa, água parada e coisas que respiram debaixo dela.' },
  { id: 'pico', n: 5, name: 'Pico Gélido', lvl: 39, unlock: 18, rect: [3, 6, 21, 34], gate: 'n', tile: 'snow', lair: [9, 11],
    mons: [['lobogelo', 4], ['harpia', 3], ['elemental', 2], ['yeti', 2]], boss: 'wyrm', cap: 12, color: '#8ad0f0',
    lore: 'Neve que nunca derrete e um rugido que desce a montanha.' },
  { id: 'cinzas', n: 6, name: 'Cinzas do Dragão', lvl: 51, unlock: 25, rect: [67, 77, 85, 102], gate: 's', tile: 'ash', lair: [78, 96],
    mons: [['salamandra', 3], ['cao', 4], ['cultista', 2], ['magma', 2]], boss: 'dragao', cap: 12, color: '#c84a3a',
    lore: 'O chão ainda está quente. O dono deste lugar não dorme.' },
];
G.ZONE = {}; for (const z of G.ZONES) G.ZONE[z.id] = z;
G.TIER_STEP = 3;
G.zoneLvl = (z, tier) => z.lvl + tier * G.TIER_STEP;
G.CRATER = { rect: [3, 77, 21, 102], center: [12, 90] };

G.THREAT = [[1, 'Calmaria'], [4, 'Inquietação'], [8, 'Vigília'], [12, 'Perigo'], [16, 'Calamidade'], [20, 'Tormento'], [28, 'Abismo'], [38, 'Cataclismo'], [50, 'Fim das Eras']];
G.threatName = (l) => {
  let idx = 0;
  for (let i = 0; i < G.THREAT.length; i++) if (l >= G.THREAT[i][0]) idx = i;
  const start = G.THREAT[idx][0], next = G.THREAT[idx + 1] ? G.THREAT[idx + 1][0] : start + 12;
  const step = Math.max(1, Math.floor((next - start) / 3));
  const g = idx === 0 ? '' : ' ' + ['I', 'II', 'III', 'IV', 'V', 'VI'][G.clamp(Math.floor((l - start) / step), 0, 5)];
  return G.THREAT[idx][1] + g;
};
G.threatIdx = (l) => { let idx = 0; for (let i = 0; i < G.THREAT.length; i++) if (l >= G.THREAT[i][0]) idx = i; return idx; };

/* ---------- equipamento ---------- */
G.TIER_LVL = (t) => (t <= 6 ? [1, 9, 18, 28, 39, 51][t - 1] : 51 + 11 * (t - 6));
G.TIER_NAME = ['', 'de Ferro', 'de Ocre', 'da Fenda', 'das Brumas', 'Glacial', 'Dracônico'];
G.tierName = (t) => (t <= 6 ? G.TIER_NAME[t] : 'Ascendente ' + G.roman(t - 6));
G.TIER_COLOR = ['', '#aeb6c0', '#d9a441', '#b06ae8', '#4fb3a0', '#8ad0f0', '#e0553f'];
G.tierColor = (t) => (t <= 6 ? G.TIER_COLOR[t] : ['#f0d070', '#ff9ad0', '#9af0e0', '#c0a0ff'][(t - 7) % 4]);
G.GEAR = {
  espada:  { name: 'Espada', kind: 'arma', base: 'minerio' },
  lanca:   { name: 'Lança', kind: 'arma', base: 'minerio' },
  arco:    { name: 'Arco', kind: 'arma', base: 'madeira' },
  cajado:  { name: 'Cajado', kind: 'arma', base: 'madeira' },
  martelo: { name: 'Martelo', kind: 'arma', base: 'minerio' },
  adaga:   { name: 'Adagas', kind: 'arma', base: 'minerio' },
  pesada:  { name: 'Armadura Pesada', kind: 'armadura', base: 'minerio' },
  media:   { name: 'Couraça', kind: 'armadura', base: 'madeira' },
  leve:    { name: 'Manto', kind: 'armadura', base: 'ervas' },
  anel:    { name: 'Amuleto', kind: 'acessorio', base: 'pedra', k: 0.7, pk: 0.8 },
  /* v20: peças menores — k = fator de custo da receita, pk = fator de preço, req = nível da Ferraria */
  elmo:    { name: 'Elmo', kind: 'elmo', base: 'minerio', k: 0.75, pk: 0.6, req: 2 },
  botas:   { name: 'Botas', kind: 'botas', base: 'madeira', k: 0.7, pk: 0.6, req: 2 },
  luvas:   { name: 'Manoplas', kind: 'luvas', base: 'minerio', k: 0.7, pk: 0.6, req: 3 },
  cinto:   { name: 'Cinturão', kind: 'cinto', base: 'ervas', k: 0.65, pk: 0.55, req: 4 },
  sinete:  { name: 'Anel', kind: 'anel', base: 'pedra', k: 0.7, pk: 0.7, req: 5 },
};
G.GEAR_IDS = Object.keys(G.GEAR);
G.SLOT = { arma: 'Arma', armadura: 'Armadura', elmo: 'Elmo', luvas: 'Manoplas', botas: 'Botas', cinto: 'Cinturão', acessorio: 'Amuleto', anel: 'Anel' };
G.SLOT_IDS = ['arma', 'armadura', 'elmo', 'luvas', 'botas', 'cinto', 'acessorio', 'anel'];
G.SLOT_TYPE = { elmo: 'elmo', luvas: 'luvas', botas: 'botas', cinto: 'cinto', acessorio: 'anel', anel: 'sinete' };
G.slotType = (h, slot) => (slot === 'arma' ? G.CLASSES[h.cls].w : slot === 'armadura' ? G.CLASSES[h.cls].a : G.SLOT_TYPE[slot]);
G.heroSlots = (h) => G.SLOT_IDS.map((s) => [s, G.slotType(h, s)]);
G.gearUnlocked = (type) => G.bLvl('ferraria') >= (G.GEAR[type].req || 1);
G.itemStats = (it) => {
  const m = G.PW(G.TIER_LVL(it.tier)) * G.RAR_MULT[it.rar] * (1 + 0.07 * it.plus);
  const k = G.GEAR[it.type].kind;
  if (k === 'arma') return { atk: Math.round(10 * m) };
  if (k === 'armadura') {
    const f = it.type === 'pesada' ? [8, 34] : it.type === 'media' ? [5.5, 26] : [3.5, 20];
    return { def: Math.round(f[0] * m), hp: Math.round(f[1] * m) };
  }
  if (k === 'elmo') return { def: Math.round(3 * m), hp: Math.round(16 * m) };
  if (k === 'luvas') return { atk: Math.round(3 * m), aspd: 0.03 + 0.006 * it.rar };
  if (k === 'botas') return { def: Math.round(2 * m), hp: Math.round(8 * m), eva: 0.015 + 0.005 * it.rar, mspd: 0.04 };
  if (k === 'cinto') return { hp: Math.round(22 * m), def: Math.round(1.5 * m) };
  if (k === 'anel') return { atk: Math.round(3.5 * m), critDmg: 0.06 + 0.03 * it.rar };
  return { atk: Math.round(2.5 * m), hp: Math.round(14 * m), crit: 0.02 + 0.012 * it.rar };
};
G.itemScore = (it) => { const s = G.itemStats(it); return (s.atk || 0) * 4 + (s.def || 0) * 4 + (s.hp || 0) + (s.crit || 0) * 200 + (s.aspd || 0) * 300 + (s.eva || 0) * 300 + (s.critDmg || 0) * 100; };
G.itemPrice = (it) => Math.round(42 * G.PM(G.TIER_LVL(it.tier)) * Math.pow(1.1, it.tier - 1) * G.RAR_PRICE[it.rar] * (1 + 0.22 * it.plus) * (G.GEAR[it.type].pk || 1));
G.itemName = (it) => G.GEAR[it.type].name + ' ' + G.tierName(it.tier) + (it.plus ? ' +' + it.plus : '');
G.recipe = (type, tier) => {
  const zt = Math.min(tier, 6), zm = G.ZMATS[zt], g = G.GEAR[type];
  const over = Math.max(0, tier - 6);
  const k = g.k || 1;
  const cost = {};
  cost[zm.a] = Math.round((4 + over * 3) * k);
  cost[zm.b] = Math.round((3 + over * 2) * k);
  cost[g.base] = Math.round((3 + tier * 2) * k);
  if (over) cost.essencia = over * 2;
  return { gold: Math.round(30 * G.PM(G.TIER_LVL(tier)) * Math.pow(1.12, tier - 1) * k), cost };
};
G.upgradeCost = (it) => {
  const zm = G.ZMATS[Math.min(it.tier, 6)];
  const c = {}; c[zm.a] = 2 + it.plus; c[zm.b] = 1 + Math.floor(it.plus / 2);
  if (it.plus >= 5) c[zm.r] = 1 + Math.floor((it.plus - 5) / 3);
  return { gold: Math.round(G.itemPrice({ type: it.type, tier: it.tier, rar: 0, plus: 0 }) * 0.5 * (1 + it.plus * 0.5)), cost: c, chance: [1, 1, 1, 0.85, 0.75, 0.65, 0.55, 0.45, 0.38, 0.32, 0.27, 0.23, 0.2, 0.18, 0.16][Math.min(it.plus, 14)] };
};

/* ---------- construções ---------- */
/* plot = canto superior esquerdo da base (6×4 tiles). site = fora das muralhas. */
G.BLD = {
  cidadela:   { name: 'Cidadela de Aurora', short: 'Cidadela', plot: [45, 42], cost: 400, mat: 1.4, sign: 'crown', roof: '#3b5fa8', wall: 'stone', built: 1, staff: ['Rosa', 'Soraia'],
    desc: 'O coração do reino. Seu nível limita todas as outras construções e abre novos terrenos.' },
  guilda:     { name: 'Guilda dos Caçadores', short: 'Guilda', plot: [37, 42], cost: 180, mat: 1, sign: 'sword', roof: '#8a4a2e', wall: 'timber', built: 1, staff: ['Bento'],
    desc: 'Recebe o espólio, emite contratos e autoriza promoções de rank.' },
  hospedaria: { name: 'Hospedaria do Viajante', short: 'Hospedaria', plot: [30, 42], cost: 160, mat: 1, sign: 'bed', roof: '#6b448a', wall: 'timber', built: 1, staff: ['Nina', 'Rui'],
    desc: 'Camas para os heróis. Cada nível abriga mais um caçador e recupera energia mais rápido.' },
  taverna:    { name: 'Taverna do Cervo', short: 'Taverna', plot: [30, 48], cost: 150, mat: 1, sign: 'mug', roof: '#a8562b', wall: 'timber', built: 1, staff: ['Heitor', 'Iara'],
    desc: 'Comida e conversa. Mata a fome e levanta o ânimo. Precisa de refeições no estoque.' },
  enfermaria: { name: 'Enfermaria', short: 'Enfermaria', plot: [37, 62], cost: 140, mat: 1, sign: 'cross', roof: '#3c8a78', wall: 'plaster', cid: 1, staff: ['Olívia'],
    desc: 'Cura feridos e traz de volta os heróis caídos. Sem ela, a recuperação é lenta e perigosa.' },
  ferraria:   { name: 'Ferraria', short: 'Ferraria', plot: [30, 56], cost: 220, mat: 1.2, sign: 'anvil', roof: '#4a4e58', wall: 'stone', cid: 1, staff: ['Fábio', 'Gilda'],
    desc: 'Transforma espólio em armas e armaduras. Os heróis compram o que você forja.' },
  alquimista: { name: 'Casa do Alquimista', short: 'Alquimista', plot: [52, 56], cost: 240, mat: 1.1, sign: 'potion', roof: '#684282', wall: 'plaster', cid: 1, staff: ['Quim'],
    desc: 'Produz poções com ervas. Poção no bolso é a diferença entre recuar e cair.' },
  mercado:    { name: 'Mercado', short: 'Mercado', plot: [52, 48], cost: 380, mat: 1.3, sign: 'coin', roof: '#c97b32', wall: 'timber', cid: 2, staff: ['Célia', 'Dário', 'Elga'],
    desc: 'Vende o excedente, atrai caravanas e aumenta o dízimo do comércio.' },
  padaria:    { name: 'Padaria e Moinho', short: 'Padaria', plot: [45, 62], cost: 300, mat: 1.1, sign: 'bread', roof: '#c48c3c', wall: 'plaster', cid: 2, staff: ['Alda', 'Breno'],
    desc: 'Transforma trigo em refeições muito mais rápido que a cozinha da taverna.' },
  treino:     { name: 'Campo de Treino', short: 'Treino', plot: [30, 62], cost: 520, mat: 1.3, sign: 'target', roof: '#7a5236', wall: 'yard', cid: 3, staff: ['Vasco'],
    desc: 'Heróis pagam para treinar e ganham experiência sem risco. Um ótimo destino para o ouro deles.' },
  santuario:  { name: 'Santuário das Duas Luas', short: 'Santuário', plot: [52, 42], cost: 900, mat: 1.6, sign: 'moon', roof: '#d8dce8', wall: 'marble', cid: 4, staff: [],
    desc: 'Fortalece as Bênçãos e, uma vez por dia, pode salvar um herói do golpe fatal.' },
  torre:      { name: 'Torre de Vigia', short: 'Torre', plot: [52, 62], cost: 700, mat: 1.5, sign: 'eye', roof: '#6e6254', wall: 'tower', cid: 3, staff: ['Úrsula'],
    desc: 'Flecha os invasores durante a Maré da Fenda e avisa da ameaça com antecedência.' },
  fazenda:    { name: 'Fazenda de Joca', short: 'Fazenda', plot: [63, 45], cost: 120, mat: 0.9, sign: 'wheat', roof: '#9e422b', wall: 'barn', built: 1, site: 1, staff: ['Joca', 'Lina'],
    desc: 'Trigo para as refeições e ervas para as poções.' },
  lenharia:   { name: 'Lenharia', short: 'Lenharia', plot: [68, 24], cost: 130, mat: 0.8, sign: 'axe', roof: '#7a5236', wall: 'timber', cid: 1, site: 1, staff: ['Nuno'],
    desc: 'Madeira para construir e para arcos, cajados e couraças.' },
  pedreira:   { name: 'Pedreira de Ocre', short: 'Pedreira', plot: [20, 72], cost: 200, mat: 0.9, sign: 'pick', roof: '#5c5852', wall: 'stone', cid: 1, site: 1, staff: ['Pedro'],
    desc: 'Pedra para as obras e minério para a forja.' },
  /* v20: erguido ao norte das muralhas; late = terreno aberto depois da vegetação (não altera o resto do mapa) */
  estabulo:   { name: 'Estábulo do Vale', short: 'Estábulo', plot: [55, 35], cost: 450, mat: 1.1, sign: 'shoe', roof: '#8a5a34', wall: 'barn', cid: 3, site: 1, late: 1, staff: ['Tomé'],
    desc: 'Doma e abriga montarias para os heróis e transforma trigo em ração.' },
};
G.BLD_IDS = Object.keys(G.BLD);
G.bLvl = (id) => { const b = G.S.b[id]; return b ? b.lvl : 0; };
G.bOk = (id) => { const b = G.S.b[id]; return !!b && b.lvl > 0 && !b.dmg; };
G.bMax = (id) => (id === 'cidadela' ? 99 : G.bLvl('cidadela') + 2);
G.bCost = (id, l) => { // custo para chegar ao nível l
  const d = G.BLD[id];
  const gold = Math.round(d.cost * Math.pow(1.62, l - 1));
  const cost = {};
  const m = d.mat;
  cost.madeira = Math.round(12 * m * Math.pow(1.42, l - 1));
  if (l >= 2 || d.wall === 'marble' || d.wall === 'tower') cost.pedra = Math.round(8 * m * Math.pow(1.42, l - 1));
  if (l >= 4) cost.minerio = Math.round(5 * m * Math.pow(1.4, l - 3));
  if (l >= 5 && (l - 5) % 3 === 0) { const z = Math.min(6, 1 + (l - 5) / 3); cost[G.ZMATS[z].e] = l >= 23 ? 1 + Math.floor((l - 20) / 3) : 1; }
  if (l >= 3) { const z = Math.min(6, Math.ceil((l - 2) / 2)); cost[G.ZMATS[z].a] = Math.round(4 * m * (l - 1)); }
  return { gold, cost };
};
G.cidReq = (l) => 2 * l - 1; // Nível do Reino exigido para a Cidadela chegar ao nível l

/* ---------- moradores (elenco original da cidade) ---------- */
G.CAST = [
  { name: 'Rosa', job: 'Escrivã', at: 'cidadela', look: 3 }, { name: 'Soraia', job: 'Cobradora', at: 'cidadela', look: 7 },
  { name: 'Bento', job: 'Mestre da Guilda', at: 'guilda', look: 1 }, { name: 'Nina', job: 'Atendente', at: 'hospedaria', look: 4 },
  { name: 'Rui', job: 'Atendente', at: 'hospedaria', look: 2 }, { name: 'Heitor', job: 'Taverneiro', at: 'taverna', look: 5 },
  { name: 'Iara', job: 'Ajudante', at: 'taverna', look: 6 }, { name: 'Olívia', job: 'Curandeira', at: 'enfermaria', look: 8 },
  { name: 'Fábio', job: 'Ferreiro', at: 'ferraria', look: 9 }, { name: 'Gilda', job: 'Aprendiz de forja', at: 'ferraria', look: 10 },
  { name: 'Quim', job: 'Alquimista', at: 'alquimista', look: 11 }, { name: 'Célia', job: 'Mercadora', at: 'mercado', look: 12 },
  { name: 'Dário', job: 'Feirante', at: 'mercado', look: 13 }, { name: 'Elga', job: 'Caixa', at: 'mercado', look: 14 },
  { name: 'Alda', job: 'Padeira', at: 'padaria', look: 15 }, { name: 'Breno', job: 'Moleiro', at: 'padaria', look: 16 },
  { name: 'Vasco', job: 'Instrutor', at: 'treino', look: 17 }, { name: 'Úrsula', job: 'Guarda', at: 'torre', look: 18 },
  { name: 'Joca', job: 'Fazendeiro', at: 'fazenda', look: 19 }, { name: 'Lina', job: 'Lavradora', at: 'fazenda', look: 20 },
  { name: 'Nuno', job: 'Lenhador', at: 'lenharia', look: 21 }, { name: 'Pedro', job: 'Minerador', at: 'pedreira', look: 22 },
  { name: 'Yara', job: 'Aprendiz', at: 'mercado', look: 23 }, { name: 'Zeno', job: 'Caçador de animais', at: 'fazenda', look: 24 },
  { name: 'Tomé', job: 'Tratador', at: 'estabulo', look: 25 },
];
G.EXTRA_NAMES = ['Abel', 'Bia', 'Caio', 'Dora', 'Elói', 'Flora', 'Gil', 'Helga', 'Ian', 'Jana', 'Kito', 'Leda', 'Marco', 'Nádia', 'Oto', 'Pilar', 'Raul', 'Sara', 'Tito', 'Una', 'Vito', 'Zélia'];
G.BARKS = {
  npc: ['Pão quentinho hoje!', 'Viu as duas luas ontem?', 'Os caçadores andam ocupados.', 'O Portal brilhou de novo…', 'Ouvi uivos no Bosque.', 'Bom dia!', 'Que os deuses guardem Aurora.', 'Preciso de mais farinha.', 'A taverna está cheia.', 'Dizem que a Fenda cresceu.', 'Trabalho, trabalho…', 'Vai chover?', 'Meu filho quer ser herói.', 'As ruas estão mais seguras.'],
  hunt: ['Pela Aurora!', 'Mais um!', 'Fácil demais.', 'Atrás de você!', 'Esse é meu!', 'Hora da caçada.', 'Sinto cheiro de espólio.'],
  hurt: ['Preciso recuar!', 'Isso doeu…', 'Poção, rápido!', 'São muitos!'],
  flee: ['Recuar! Recuar!', 'Hoje não…', 'Volto mais forte!', 'Abram o portão!'],
  town: ['Um prato cheio, por favor.', 'Minha bolsa está pesada.', 'Preciso de uma arma melhor.', 'Que dia.', 'Uma cama, enfim.', 'Vou passar na Ferraria.', 'Quem vem caçar comigo?'],
  lvl: ['Estou mais forte!', 'Nível novo!', 'Sinto o poder!'],
  boss: ['É enorme…', 'Todos juntos!', 'Pelo reino!'],
  nopotion: ['Acabaram as poções…', 'O Alquimista está sem estoque!'],
  hungry: ['Estou faminto…', 'A taverna está sem comida?'],
  mare: ['Defendam os portões!', 'Não passarão!', 'Pela cidade!'],
};

/* ---------- bênçãos ---------- */
G.BLESS = [
  { id: 'lamina', name: 'Bênção da Lâmina', per: 3, unit: '% de ataque', icon: 'sword', desc: 'Ataque de todos os heróis.' },
  { id: 'vigor', name: 'Bênção do Vigor', per: 4, unit: '% de vida', icon: 'heart', desc: 'Vida máxima de todos os heróis.' },
  { id: 'egide', name: 'Bênção da Égide', per: 3, unit: '% de defesa', icon: 'shield', desc: 'Defesa de todos os heróis.' },
  { id: 'sabedoria', name: 'Bênção da Sabedoria', per: 5, unit: '% de experiência', icon: 'star', desc: 'Experiência ganha em cada abate.' },
  { id: 'fortuna', name: 'Bênção da Fortuna', per: 5, unit: '% de moedas', icon: 'coin', desc: 'Moedas que os monstros deixam.' },
  { id: 'colheita', name: 'Bênção da Colheita', per: 4, unit: '% de espólio', icon: 'bag', desc: 'Chance e quantidade de materiais.' },
  { id: 'oficio', name: 'Bênção do Ofício', per: 5, unit: '% de produção', icon: 'hammer', desc: 'Produção de fazenda, lenharia, pedreira, padaria e alquimista.' },
];
G.blessCost = (lvl) => 1 + Math.floor(lvl * 0.75);
G.bless = (id) => { const d = G.BLESS.find((b) => b.id === id); return 1 + ((G.S.bless[id] || 0) * d.per * (1 + 0.1 * G.bLvl('santuario'))) / 100; };

/* ---------- obras públicas (sumidouro infinito de moedas) ---------- */
G.WORKS = [
  { id: 'estradas', name: 'Estradas Pavimentadas', per: 2, unit: '% de velocidade dos heróis', icon: 'road', desc: 'Menos tempo na estrada, mais tempo caçando.' },
  { id: 'muralhas', name: 'Muralhas Reforçadas', per: 3, unit: '% de dano das torres e guardas', icon: 'shield', desc: 'Durante a Maré, a cidade revida com mais força.' },
  { id: 'celeiros', name: 'Celeiros Reais', per: 6, unit: '% de armazém e +2% de produção', icon: 'bag', desc: 'Guarda mais e desperdiça menos.' },
  { id: 'academia', name: 'Academia de Guerra', per: 2, unit: '% de experiência', icon: 'star', desc: 'Veteranos ensinam os novatos.' },
  { id: 'feira', name: 'Feira Permanente', per: 5, unit: '% de dízimo e preço de venda', icon: 'coin', desc: 'Comércio o ano inteiro.' },
];
G.workCost = (lvl) => Math.round(350 * Math.pow(1.4, lvl));
G.work = (id) => { const d = G.WORKS.find((w) => w.id === id); return 1 + ((G.S.works && G.S.works[id]) || 0) * d.per / 100; };
G.workLvl = (id) => (G.S.works && G.S.works[id]) || 0;

/* ---------- decretos (poderes do jogador) ---------- */
G.DECREES = [
  { id: 'reunir', name: 'Toque de Reunir', icon: 'horn', cd: 240, cost: 0, desc: 'Todos os heróis largam a caçada e voltam para a cidade.' },
  { id: 'aurora', name: 'Luz da Aurora', icon: 'sun', cd: 360, cost: 0, desc: 'Cura 40% da vida de todos os heróis em campo.' },
  { id: 'furia', name: 'Chamado às Armas', icon: 'flag', cd: 420, cost: 1, desc: 'Por 60 s, todos atacam 30% mais forte e mais rápido. Custa moedas.' },
  { id: 'banquete', name: 'Banquete Real', icon: 'meal', cd: 600, cost: 2, desc: 'Fome saciada e ânimo cheio para todos os heróis. Custa moedas.' },
];
G.decreeCost = (d) => (d.cost ? Math.round(d.cost * 40 * G.PM(G.avgHeroLvl ? G.avgHeroLvl() : 1) * Math.max(1, G.S.heroes.length / 3)) : 0);

/* ---------- conquistas ---------- */
G.ACH = [
  { id: 'kills', name: 'Caçada sem fim', stat: 'kills', tiers: [50, 250, 1000, 5000, 20000, 100000, 500000], what: 'monstros abatidos' },
  { id: 'elites', name: 'Caça-elites', stat: 'elites', tiers: [5, 25, 100, 500, 2500, 10000], what: 'elites abatidos' },
  { id: 'bosses', name: 'Mata-chefes', stat: 'bosses', tiers: [1, 5, 20, 60, 200, 600], what: 'chefes derrotados' },
  { id: 'crafted', name: 'Mestre ferreiro', stat: 'crafted', tiers: [5, 25, 100, 400, 1500, 5000], what: 'itens forjados' },
  { id: 'sold', name: 'Vitrine cheia', stat: 'sold', tiers: [5, 25, 100, 400, 1500, 5000], what: 'itens vendidos aos heróis' },
  { id: 'goldIn', name: 'Cofre do reino', stat: 'goldIn', tiers: [2000, 20000, 200000, 2e6, 2e7, 2e8, 2e9], what: 'moedas arrecadadas' },
  { id: 'promos', name: 'Ascensão', stat: 'promos', tiers: [1, 5, 15, 40, 100, 250], what: 'promoções de rank' },
  { id: 'contracts', name: 'Palavra cumprida', stat: 'contracts', tiers: [3, 15, 50, 150, 500, 1500], what: 'contratos concluídos' },
  { id: 'rebirths', name: 'Roda das eras', stat: 'rebirths', tiers: [1, 3, 10, 25, 60], what: 'renascimentos' },
  { id: 'maxLvl', name: 'Lenda viva', stat: 'maxLvl', tiers: [10, 20, 30, 40, 50, 60, 70, 80], what: 'nível máximo de um herói' },
  { id: 'jobs', name: 'Muitos caminhos', stat: 'jobs', tiers: [1, 3, 6, 12, 24], what: 'mudanças de vocação' },
  { id: 'artes', name: 'Disciplina secreta', stat: 'artes', tiers: [10, 50, 150, 400, 1000, 3000], what: 'pontos em Artes Secretas' },
  { id: 'wakes', name: 'Olhos abertos', stat: 'wakes', tiers: [1, 4, 8, 16, 32], what: 'despertares' },
  { id: 'mounts', name: 'Mestre das rédeas', stat: 'mounts', tiers: [1, 3, 6, 10], what: 'montarias domadas' },
  { id: 'decor', name: 'Cidade em flor', stat: 'decor', tiers: [1, 5, 10, 20, 30], what: 'níveis de decoração' },
  { id: 'dismantled', name: 'Nada se perde', stat: 'dismantled', tiers: [5, 25, 100, 400, 1500], what: 'peças desmontadas' },
];
G.BEST_TIERS = [10, 50, 200, 800, 3000, 10000, 40000, 150000];

/* ---------- ícones dos portões ---------- */
G.GATES = { n: { x: 44, y: 39.2, out: [44, 36] }, s: { x: 44, y: 67.8, out: [44, 71] }, w: { x: 27.2, y: 54, out: [24.5, 54] }, e: { x: 60.8, y: 54, out: [63.5, 54] } };

;
