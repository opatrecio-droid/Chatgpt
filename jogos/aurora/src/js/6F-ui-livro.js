/* 6F-ui-livro: v26 (lote 4-C.2) — Livro do Reino. Ajuda curta da Rosa, uma página por sistema (o que é, como avançar, uma dica de
   especialista). Abre pelo "?" no cabeçalho de cada painel (a página da aba aberta) e pelo índice em Mais › Livro. Só as páginas dos
   sistemas já liberados aparecem; as outras viram "???" com o requisito. Só interface; o catálogo dos sistemas vive em 3I. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, ic = UI.ic, esc = UI.esc, $ = UI.$;

  /* ---------- páginas: id (o do sistema, quando existe) · n título · ic · a "o que é" · b "como avançar" · c dica · go [painel, aba] ---------- */
  const P = {};
  const pg = (id, n, i, go, a, b, c) => { P[id] = { id, n, ic: i, go, a, b, c }; };
  pg('herois', 'Heróis e Portal', 'people', ['herois'],
    'Seus heróis caçam sozinhos: andam pelo mapa, lutam, comem, descansam e compram equipamento com o ouro que ganham.',
    'Chame novos heróis pelo Portal (o + no alto da tela). Eles sobem de nível caçando, e a Hospedaria define quantos cabem. Toque num herói para ver a ficha.',
    'Cada herói tem uma Cautela: Ousado rende mais, Cauteloso recua cedo. Antes de uma zona difícil, escolha Cauteloso.');
  pg('predios', 'Prédios e obras', 'castle', ['reino', 'obras'],
    'Cada prédio faz um trabalho: a Ferraria forja, a Enfermaria cura, a Taverna alimenta. A Cidadela limita o nível de todos os outros.',
    'Em Reino › Prédios, construa o que estiver livre e melhore o que já existe. Faltou material? Os heróis trazem das caçadas, e o Mercado vende o resto.',
    'Melhore a Cidadela cedo: ela abre terrenos, Decoração, Estábulo e Arena. E conserte o que a Maré quebrar, senão o prédio para.');
  pg('jornada', 'Jornada', 'scroll', ['missoes', 'jornada'],
    'A Jornada é a lista de missões que guia o reino, uma de cada vez. A barra no pé da tela mostra a atual.',
    'Cumpra o objetivo e toque na barra para receber o prêmio. Cada passo apresenta um prédio ou sistema novo; o que faltar aparece sob o título.',
    'Os prêmios da Jornada (moedas, Selos, Núcleos) aceleram tudo. Faça-a em dia, porque ela também prepara o que vem depois.');
  pg('reino', 'O Reino', 'crown', ['reino', 'geral'],
    'A visão geral reúne o Nível de Reino, os moradores, a felicidade, os recursos e o livro-caixa de ontem.',
    'O Nível de Reino sobe com abates, obras e feitos. Cada nível abre regiões e sistemas e paga moedas e Selos de Renome.',
    'O livro-caixa mostra para onde o ouro foi. Saldo baixo? Veja salários, obras e compras no Mercado.');
  pg('vida', 'Vida na cidade', 'smile', null,
    'Aurora tem vida própria: à noite os heróis se reúnem na fogueira da praça e na mesa da taverna, de dia treinam no campo, e os moradores conversam entre si.',
    'Não há nada a fazer, só olhar. Heróis cansados ou desanimados sentam à fogueira e se recuperam mais depressa. Os moradores também fazem Pedidos.',
    'Leia os balões de fala: eles citam laços, títulos e feitos reais dos seus heróis. Campeões rivais também passam por lá.');
  pg('forja', 'Forja e Ferraria', 'anvil', ['forja', 'forjar'],
    'Na Ferraria, o espólio vira armas e armaduras. Os heróis compram o que você forja, e o ouro volta ao cofre.',
    'Abra a Forja, escolha o tipo e o tier e toque em Forjar. Ferraria mais alta libera tiers novos; a Obra-prima gasta um Núcleo para chegar a uma raridade maior.',
    'Veja o que os heróis querem e ainda não existe: forjar a peça que alguém precisa vende rápido e acelera a caçada.');
  pg('inscricoes', 'Inscrições e Reforja', 'spark', ['armazem', 'equip'],
    'Peças Incomuns ou melhores nascem com inscrições sorteadas, de qualidade 1 a 5. Cada uma dá um efeito de verdade: ataque, vida, crítico, espólio…',
    'Reforje a peça para sortear inscrições novas e escolha entre manter as antigas ou aceitar as novas. O Pó de Reforja vem do desmonte de peças.',
    'Inscrições da mesma família somam ressonância (Fúria, Baluarte, Vento, Vida, Fortuna, Saber): com 2, 3 e 4 ativam bônus. A ficha mostra o próximo.');
  pg('armazem', 'Armazém', 'chest', ['armazem', 'equip'],
    'O Armazém guarda o equipamento, as poções, os materiais e os itens especiais do reino.',
    'Toque numa peça para ver o poder dela, vesti-la num herói, trancá-la ou desmontá-la. Os recursos também aparecem na visão geral do Reino.',
    'Tranque com o cadeado a peça que quer guardar: peça trancada não é vendida aos heróis nem desmontada sem querer.');
  pg('atelie', 'Ateliê e mascotes', 'shirt', ['armazem', 'atelie'],
    'No Ateliê ficam os trajes e as asas, que mudam o visual do herói e dão bônus, e o Viveiro, onde moram os mascotes.',
    'Compre a peça (ou ganhe de chefes e do Colosso) e vista pelos espaços roxos da ficha. Cada cópia veste um herói por vez.',
    'No Viveiro, três mascotes da mesma raridade viram um da raridade seguinte. Fundir as sobras é o caminho para os raros.');
  pg('contratos', 'Contratos', 'scroll', ['missoes', 'contratos'],
    'Três contratos novos a cada amanhecer: metas simples, como abater monstros ou forjar peças, que pagam moedas.',
    'Cumpra e toque em Receber. Fechando os três, o baú do dia rende Selos e Núcleos, e a sequência de dias aumenta o prêmio.',
    'Os contratos se cumprem sozinhos enquanto os heróis caçam. Abra todo dia, nem que seja só para pegar o baú.');
  pg('pedidos', 'Pedidos da cidade', 'scroll', ['missoes', 'contratos'],
    'Os moradores fazem pedidos curtos, com prazo: trigo para Alda, uma peça Rara para Fábio, ervas raras para Quim.',
    'Um balão dourado surge sobre o morador. Toque nele para ver o pedido e entregue com um toque quando estiver pronto. No máximo 2 por vez.',
    'O prêmio varia: moedas, Pó de Reforja, Núcleo, ânimo, desconto de obras. Os de entrega saem do Armazém na hora; os demorados pedem paciência.');
  pg('caminhos', 'Caminhos', 'map', ['missoes', 'caminhos'],
    'Caminhos são objetivos livres, em qualquer ordem, que apresentam os sistemas do reino e pagam em Selos, Núcleos e materiais.',
    'Abra Missões › Caminhos e escolha o que fazer. Quando o objetivo é cumprido, o prêmio fica pronto: toque para receber.',
    'Sem rumo? Escolha um Caminho. É um bom jeito de descobrir o que você ainda não experimentou.');
  pg('zonas', 'Zonas e corrupção', 'skull', ['missoes', 'zonas'],
    'O mundo tem regiões de caça. A barra de cada zona enche com os abates e, quando completa, o chefe desperta.',
    'Vencer o chefe sobe a corrupção da zona: monstros mais fortes e espólio melhor. Você baixa o nível quando quiser; zonas novas abrem com o Nível de Reino.',
    'Baixe a corrupção para treinar novatos e suba para forjar peças melhores. Desligue "subir sozinha" se não quiser surpresas.');
  pg('mare', 'Maré da Fenda', 'wave', ['reino', 'geral'],
    'De tempos em tempos a Fenda despeja invasores sobre Aurora. É a Maré: uma noite de defesa.',
    'Mantenha os heróis curados e com poções, e construa a Torre de Vigia, que flecha os invasores e avisa com dois dias de antecedência.',
    'Se os invasores chegarem ao coração da cidade, saqueiam o cofre. O Santuário pode salvar um herói do golpe fatal, uma vez por dia.');
  pg('incursoes', 'Incursões', 'paw', ['missoes', 'incursoes'],
    'Até cinco heróis invadem o covil de uma zona: duas ondas de elites e, no fim, o Alfa, um chefe reforçado. Lá dentro ninguém recua.',
    'Escolha o covil e o Grau, monte o grupo e envie. A primeira do dia é grátis; depois custa Núcleos. A vitória choca um ovo de mascote, mais raro nos Graus altos.',
    'Viveiro cheio? O ovo vira Pó Estelar. Funda mascotes no Ateliê antes de ir e leve os heróis mais fortes e bem curados.');
  pg('fenda', 'Fenda Infinita', 'portal', ['missoes', 'fenda'],
    'Uma escada de guardiões sem fim na Cratera. Cada andar vencido rende Essência da Fenda, Selos e Núcleos. Lá dentro ninguém recua.',
    'Monte uma expedição de até 5 heróis e envie; a do dia é grátis. A Essência paga os equipamentos Ascendentes e o caminho até o Rank SSS.',
    'Leve o grupo mais forte e curado. Se cair, tente de novo amanhã: o maior andar fica guardado nos Recordes.');
  pg('arena', 'Arena das Duas Luas', 'trophy', ['missoes', 'arena'],
    'Duelos contra reinos rivais: seus heróis enfrentam campeões deles em "ecos de luz", sem risco de ferimento.',
    'Cada dia traz 5 tíquetes. Escolha um dos três campeões, monte a equipe do tamanho que ele enviou (Sugerir ajuda) e duele. Os pontos sobem a liga da semana; Insígnias compram prêmios.',
    'Olhe a chance estimada e as Formações: classes na posição certa ativam combinações com nome, como a Muralha Arcana (Cavaleiro na frente, Mago atrás).');
  pg('colosso', 'Colosso da Semana', 'skull', ['missoes', 'colosso'],
    'De sexta a domingo, um Colosso desperta na Cratera. A vida dele não volta entre as sessões: o dano de todos soma ao longo do fim de semana.',
    'Em Missões › Colosso, convoque os heróis (ou deixe os aptos decidirem) e suba no ranking de dano contra os reinos rivais. Derrubá-lo rende a relíquia da semana.',
    'O cartão Formação do grupo mostra combinações de classe: corpo a corpo na frente, arqueiros e magos atrás. Convocar todos acelera, mas pausa a caçada.');
  pg('decor', 'Decoração', 'flower', ['reino', 'decor'],
    'Enfeites dão Encanto à cidade: cada ponto rende +1% de dízimo, e cada enfeite ainda tem um bônus próprio.',
    'Compre e melhore enfeites em Reino › Decoração, até o nível 3 cada. Os maiores pedem Cidadela mais alta e materiais raros.',
    'Comece pelos Estandartes (experiência) e pelo Poço dos Desejos (moedas dos monstros): rendem para sempre.');
  pg('mercado', 'Mercado', 'coin', ['reino', 'mercado'],
    'O Mercado vende o excedente do armazém, compra matéria-prima e recebe o comerciante errante e as caravanas.',
    'Em Reino › Mercado, venda o que sobra e compre o que falta. Cada nível do prédio paga melhor e aumenta o armazém.',
    'Com a Caravana do Leste na cidade, tudo o que você vender rende o dobro. Guarde o excedente para esse dia.');
  pg('publicas', 'Obras públicas', 'hammer', ['reino', 'publicas'],
    'Melhorias da cidade sem limite de nível: o destino certo para o ouro que sobra no cofre.',
    'Cada obra tem um efeito pequeno que cresce a cada nível; o preço sobe junto. Compre quando o ouro passar de uma reserva segura.',
    'Antes de gastar, deixe ouro para os salários, a forja e o conserto de prédios depois de uma Maré.');
  pg('estabulo', 'Estábulo e montarias', 'shoe', ['reino', 'estabulo'],
    'O Estábulo do Vale doma e abriga montarias que deixam os heróis mais rápidos e carregam mais espólio.',
    'Construa o Estábulo (Cidadela 3), dome uma montaria e monte-a num herói pela aba Montaria da ficha. Elas comem ração, que o Estábulo faz de trigo.',
    'As baias são limitadas: cada nível do prédio abre uma e doma montarias melhores. Sem ração, as montarias passam fome.');
  pg('decretos', 'Decretos', 'bolt', null,
    'Quatro poderes do trono, no raio à direita do mapa: Toque de Reunir, Luz da Aurora, Chamado às Armas e Banquete Real.',
    'Toque no raio e escolha. Cada decreto tem tempo de recarga, e os mais fortes custam moedas.',
    'Guarde a Luz da Aurora para a Maré e o Chamado às Armas para os chefes. O Toque de Reunir traz todo mundo para a cidade quando o perigo aperta.');
  pg('bencaos', 'Bênçãos e Selos', 'seal', ['mais', 'bencaos'],
    'Selos de Renome são a moeda do prestígio: vêm dos níveis do reino, da Jornada e das conquistas, e compram bênçãos permanentes.',
    'Em Mais › Bênçãos, escolha uma bênção e melhore-a. O Santuário das Duas Luas a deixa mais forte.',
    'Bênçãos são do reino, não dos heróis: ficam com você quando alguém renasce. Invista cedo.');
  pg('promocao', 'Rank e vocações', 'up', ['herois'],
    'O Rank é a patente do herói, de E a SSS. Subir exige nível, um Emblema do chefe da zona e moedas, e abre atributos maiores.',
    'Na ficha, toque em Promover quando o aviso aparecer. No Rank C e no Rank A o herói muda de classe: dois ramos para escolher.',
    'A Guilda autoriza o rank até o nível dela: melhore-a junto. Escolha a vocação pelo papel que o herói cumpre no grupo.');
  pg('artes', 'Artes Secretas', 'book', ['herois'],
    'Cada herói ganha pontos de Arte ao subir de nível e de rank. Cada ponto reforça um aspecto dele para sempre.',
    'Abra a aba Artes na ficha e gaste os pontos; o selo roxo avisa que sobrou algum. Dá para zerar tudo por um preço em Selos e refazer.',
    'Decida pelo papel do herói no grupo e refaça por Selos se mudar de ideia.');
  pg('renascer', 'Renascimento', 'star', ['herois'],
    'No Rank SS, nível 70, o herói pode renascer: volta ao nível 1 e ao Rank E, mas fica mais forte para sempre. Equipamento, vocação e Artes ficam.',
    'Quando a ficha avisar, toque em Renascer. Cada renascimento dá Pontos de Renascimento para o Altar: compre traços raros ou suba os que já tem.',
    'Renasça quem já não evolui no Rank, e nunca todo mundo de uma vez: mantenha um grupo forte para a Arena e o Colosso.');
  pg('feitos', 'Feitos, títulos e laços', 'trophy', ['herois'],
    'Cada herói tem um Livro de Feitos: marcos pessoais viram títulos, e o título exibido dá um bônus pequeno.',
    'Na ficha, abra a aba Feitos para ver a linha do tempo e escolher o título. Heróis que lutam juntos viram Companheiros e Irmãos de Armas.',
    'Irmãos de Armas rendem mais lado a lado: monte os grupos da Arena e do Colosso com eles.');
  pg('recordes', 'Poder do Reino e recordes', 'crown', ['mais', 'recordes'],
    'O Poder do Reino é a coroa no alto da tela: soma a força dos heróis, dos prédios, das bênçãos e das obras.',
    'Cada marco de poder (1 mil, 2,5 mil, 5 mil…) paga um prêmio na hora: Pó de Reforja, Núcleos e Selos. Em Mais › Recordes ficam o maior golpe, o dia mais rico e outras marcas.',
    'O Herói do Dia, escolhido toda manhã, ganha experiência extra. Olhe o próximo marco e invista no que mais sobe o poder.');
  pg('codex', 'Códex', 'book', ['mais', 'codex'],
    'O Códex guarda tudo o que você já viu: as 16 inscrições em 5 qualidades e as peças de cada tier e raridade.',
    'Cada registro novo conta para os marcos do Códex, que pagam Núcleos, Selos e Pó de Reforja. Toque num marco para ver o que falta.',
    'Procure as inscrições que ainda não viu: reforjar peças baratas completa o Códex mais depressa que esperar sorte.');
  pg('cronicas', 'Conquistas', 'trophy', ['mais', 'cronicas'],
    'Metas de longo prazo, em vários degraus: abates, chefes, peças forjadas, vendas e muito mais.',
    'Cada degrau cumprido paga Selos de Renome. Toque em Receber; a próxima meta aparece com a barra de progresso.',
    'A conquista mais perto de completar aparece na linha de próxima recompensa do HUD. Deixe a caçada rodando: a maioria se cumpre sozinha.');
  pg('bestiario', 'Bestiário', 'book', ['mais', 'bestiario'],
    'Cada família de monstros estudada dá +3% de dano e de espólio contra ela, por marco de abates.',
    'Basta caçar: os abates contam sozinhos. Em Mais › Bestiário você vê o marco de cada família.',
    'Mande os heróis à zona da família que quer reforçar antes de enfrentar o chefe dela.');
  pg('dif', 'Dificuldade', 'skull', null,
    'Quatro níveis para o reino todo: Fácil, Normal, Difícil e Pesadelo. Valem para as zonas e para a Maré.',
    'Toque na caveira no alto da tela. Os níveis mais duros rendem mais experiência, moedas e espólio, e abrem com o Nível de Reino.',
    'Trocar não custa nada: suba quando os heróis vencerem fácil demais e volte um degrau se as quedas aumentarem.');
  pg('cal', 'Calendário e semana', 'gift', null,
    'O Calendário de 7 dias dá um presente por dia de visita. A Semana temática traz um bônus por tema, com prazo no alto da tela.',
    'Toque no presente, à esquerda, uma vez por dia. O tema da semana fica no alto da tela e mostra quanto tempo falta.',
    'Ficou um tempo fora? Ao voltar, o reino entrega cartas de retorno, uma por hora de ausência. Fique de olho nas criaturas da sorte no mapa: um toque rende bônus.');
  pg('livro', 'Livro do Reino', 'book', ['mais', 'livro'],
    'O Livro do Reino é o guia da Rosa: uma página para cada sistema do reino.',
    'Toque no ? de qualquer painel para ler a página daquela aba, ou escolha uma aqui no índice. Os sistemas ainda trancados aparecem como ???, com o que falta para abrir.',
    'Releia a página de um sistema quando ele abrir: a dica de especialista costuma poupar tempo.');
  pg('opcoes', 'Opções e desempenho', 'gear', ['mais', 'opcoes'],
    'Volume, vibração, Modo leve, exportar e importar o save e rever o tutorial.',
    'Em Mais › Opções. O jogo salva sozinho neste aparelho a cada 20 segundos; exporte o código para guardar ou mudar de aparelho.',
    'Aparelho antigo? O Modo leve corta partículas e sombras. Se o jogo ficar pesado, ele liga sozinho e você pode desligar aqui.');
  UI.BOOK = P;

  /* índice: grupos (ordem de leitura) */
  const GROUPS = [
    ['Para começar', ['herois', 'predios', 'jornada', 'reino', 'vida', 'livro']],
    ['Forja e Armazém', ['forja', 'inscricoes', 'armazem', 'atelie']],
    ['Missões', ['contratos', 'pedidos', 'caminhos', 'zonas', 'mare', 'incursoes', 'fenda', 'arena', 'colosso']],
    ['Reino e prestígio', ['decor', 'mercado', 'publicas', 'estabulo', 'decretos', 'bencaos']],
    ['Heróis', ['promocao', 'artes', 'renascer', 'feitos']],
    ['Memória do reino', ['recordes', 'codex', 'cronicas', 'bestiario']],
    ['Ajustes', ['dif', 'cal', 'opcoes']],
  ];
  const isOpen = (id) => !G.SYS[id] || G.sysOpen(id);
  const reqOf = (id) => (G.SYS[id] && G.SYS[id].req) || '';

  /* ---------- página da aba aberta ---------- */
  const TAB_PAGE = {
    'reino:geral': 'reino', 'reino:obras': 'predios', 'reino:decor': 'decor', 'reino:estabulo': 'estabulo', 'reino:publicas': 'publicas', 'reino:mercado': 'mercado',
    'forja:forjar': 'forja', 'forja:arsenal': 'armazem',
    'armazem:equip': 'armazem', 'armazem:atelie': 'atelie', 'armazem:consumo': 'armazem', 'armazem:materiais': 'armazem', 'armazem:especiais': 'armazem',
    'missoes:jornada': 'jornada', 'missoes:caminhos': 'caminhos', 'missoes:contratos': 'contratos', 'missoes:zonas': 'zonas', 'missoes:fenda': 'fenda', 'missoes:incursoes': 'incursoes', 'missoes:arena': 'arena', 'missoes:colosso': 'colosso',
    'mais:bencaos': 'bencaos', 'mais:bestiario': 'bestiario', 'mais:cronicas': 'cronicas', 'mais:recordes': 'recordes', 'mais:codex': 'codex', 'mais:livro': 'livro', 'mais:opcoes': 'opcoes',
  };
  const HT_PAGE = { ficha: 'herois', habil: 'promocao', artes: 'artes', mont: 'estabulo', bolsa: 'herois', feitos: 'feitos' };
  const pageNow = () => {
    const s = UI.sheet; if (!s) return 'livro';
    if (s.name === 'herois') { const sub = s.sub; return sub && sub.hero ? HT_PAGE[sub.ht || 'ficha'] || 'herois' : 'herois'; }
    return TAB_PAGE[s.name + ':' + s.tab] || 'livro';
  };

  /* ---------- estilo ---------- */
  const css = document.createElement('style');
  css.textContent = [
    '.sh-head .hq{width:32px;height:32px;border-radius:50%;flex:none;display:grid;place-items:center;border:1.5px solid rgba(226,182,89,.5);color:var(--gold2);font-family:"Aurora Cinzel",serif;font-weight:700;font-size:15px;line-height:1;background:rgba(226,182,89,.08)}',
    '.sh-head .hq::after{content:"";position:absolute;inset:-4px}.sh-head .hq{position:relative}',
    '.bkh{display:flex;align-items:center;gap:10px;margin:8px 0 10px}',
    '.bkh .pt{width:44px;height:44px;border-radius:12px;background-color:rgba(255,255,255,.06);background-size:44px 44px;border:1px solid var(--line);flex:none}',
    '.bkh h2{margin:0;font-size:20px;line-height:1.15}',
    '.bks{margin:0 0 9px}.bks b{display:block;font-family:"Aurora Cinzel",serif;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:3px}',
    '.bks p{font-size:13.5px;line-height:1.45;color:var(--text)}',
    '.bkt{margin:10px 0 2px;padding:10px 12px;border-radius:12px;border:1px solid rgba(226,182,89,.4);background:rgba(226,182,89,.1)}',
    '.bkt b{display:block;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold2);margin-bottom:3px}.bkt p{font-size:13px;line-height:1.45;color:var(--gold2)}',
    '.bkr{display:flex;align-items:center;gap:10px;width:100%;min-height:46px;margin:0 0 6px;padding:6px 12px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid var(--line2);text-align:left}',
    '.bkr svg.i{font-size:20px;color:var(--gold2)}.bkr .gr{flex:1;min-width:0}.bkr b{display:block;font-size:13.5px}.bkr small{display:block;font-size:11px;color:var(--mut)}',
    '.bkr.lk{opacity:.6;border-style:dashed}.bkr.lk svg.i{color:var(--mut)}.bkr.lk b{letter-spacing:.25em;color:var(--mut)}',
    '.bkr::after{content:"";flex:none;width:7px;height:7px;border-right:2px solid var(--mut);border-top:2px solid var(--mut);transform:rotate(45deg)}.bkr.lk::after{display:none}',
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- telas ---------- */
  let rosa = '';
  const rosaImg = () => rosa || (rosa = A.portrait(A.npcLook({ name: 'Rosa', job: 'Escrivã', look: 3 })));
  const groupOf = (id) => { for (const [g, ids] of GROUPS) if (ids.indexOf(id) >= 0) return g; return 'Livro do Reino'; };
  UI.bookPage = (id) => {
    const p = P[id];
    if (!p || !isOpen(id)) return UI.bookIndex();
    UI.modal('<div class="eyebrow">Livro do Reino · ' + groupOf(id) + '</div>' +
      '<div class="bkh"><i class="pt px" style="background-image:url(' + rosaImg() + ')"></i><h2>' + esc(p.n) + '</h2></div>' +
      '<div class="bks"><b>O que é</b><p>' + esc(p.a) + '</p></div>' +
      '<div class="bks"><b>Como avançar</b><p>' + esc(p.b) + '</p></div>' +
      '<div class="bkt"><b>Dica de especialista</b><p>' + esc(p.c) + '</p></div>' +
      '<div class="acts">' + (p.go ? '<button class="btn" data-a="bookgo:' + id + '">Ir até lá</button>' : '') + '<button class="btn" data-a="bookidx">Índice</button><button class="btn pri" data-a="mclose">Fechar</button></div>');
  };
  const indexHtml = (bare) => {
    let n = 0, tot = 0, h = '';
    for (const [g, ids] of GROUPS) {
      h += '<div class="sec">' + g + '</div>';
      for (const id of ids) {
        const p = P[id]; tot++;
        if (isOpen(id)) { n++; h += '<button class="bkr" data-a="bookp:' + id + '">' + ic(p.ic) + '<span class="gr"><b>' + esc(p.n) + '</b></span></button>'; }
        else h += '<div class="bkr lk">' + ic('lock') + '<span class="gr"><b>???</b><small>Abre: ' + esc(reqOf(id)) + '</small></span></div>';
      }
    }
    if (bare) return '<p class="mut" style="font-size:12px;margin:2px 0 0">' + n + ' de ' + tot + ' páginas abertas. As ??? abrem conforme o reino cresce.</p>' + h;
    return '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:var(--gold2)">' + ic('book') + '</span><div class="gr"><h3>Livro do Reino <small>' + n + ' de ' + tot + ' páginas</small></h3><p>A ajuda da Rosa, uma página por sistema. Toque numa página para ler; as ??? abrem conforme o reino cresce.</p></div></div></div>' + h;
  };
  UI.bookIndex = () => UI.modal('<div class="eyebrow">Rosa, escrivã da Cidadela</div><h2>Livro do Reino</h2><div style="margin-top:8px">' + indexHtml(true) + '</div><div class="acts"><button class="btn pri" data-a="mclose">Fechar</button></div>');

  /* Mais › Livro (índice dentro do painel) */
  const M = UI.SHEETS && UI.SHEETS.mais;
  if (M) {
    const k = M.tabs.findIndex((t) => t[0] === 'opcoes');
    if (!M.tabs.some((t) => t[0] === 'livro')) M.tabs.splice(k < 0 ? M.tabs.length : k, 0, ['livro', 'Livro']);
    const r0 = M.render;
    M.render = function (tab) { return tab === 'livro' ? indexHtml() : r0.apply(M, arguments); };
  }

  /* ---------- ações e o "?" do cabeçalho ---------- */
  Object.assign(UI.ACT, {
    book: () => UI.bookPage(pageNow()),
    bookp: (a) => UI.bookPage(a[0]),
    bookidx: () => UI.bookIndex(),
    bookgo: (a) => { const p = P[a[0]]; UI.closeModal(); if (p && p.go) UI.open(p.go[0], p.go[1] || undefined); },
  });
  const bd = UI.build;
  UI.build = () => { bd(); const x = $('#sheet .sh-head .x'); if (x && !$('#sheet .hq')) x.insertAdjacentHTML('beforebegin', '<button class="hq" data-a="book" title="Livro do Reino" aria-label="Livro do Reino">?</button>'); };
})();
;
