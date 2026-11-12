# Evil Hunter Tycoon: sistemas e mecânicas centrais

Pesquisa de game design sobre o jogo mobile Evil Hunter Tycoon (SuperPlanet / Retro Arts), com foco em sistemas e mecânicas, com números sempre que existirem nas fontes.

Data da pesquisa: 2026-11-11.

## 0. Antes de tudo: correções ao escopo da tarefa

- **Ano de lançamento:** a tarefa diz 2019, mas as fontes apontam para **março de 2020**. TapTap (kr/app/185496) lista lançamento em 16/03/2020; a Google Play (via appgoblin) lista 17/03/2020; a PocketGamer (pré-lançamento, fev/2020) anunciava 31 de março. Há divergência de dias, mas nenhuma fonte encontrada indica 2019.
- **"Hell Mode":** não encontrei um modo chamado "Hell Mode". O conteúdo "Hell" aparece como **Hell Outpost** (atualização 1.378, 18/09/2026, App Store KR) e **Hell Forward Base** (TapTap, versão 1.417, com defesa de 20 ondas). A dificuldade em si tem outros nomes (Easy, Normal, Hard, Expert, Nightmare, Torment).
- **Sequência:** não encontrei sequência nem jogo irmão com o mesmo nome. Há duas fichas de loja: a global (SuperPlanet, App Store id 1493512288, "Evil Hunter Tycoon - Nonstop") e a coreana (Retro Arts, App Store id 1458318990, "이블헌터 타이쿤 - 방치형 게임"). Tratam-se, pelo que as fontes sugerem, do mesmo título em duas linhas de versão (numeração de versão distinta). Isso é **inferência** a partir das descrições e não foi confirmado por um comunicado oficial.
- **Fontes oficiais:** o Zendesk de suporte (evilhunter.zendesk.com) retornou 403 em todas as tentativas de leitura direta. Wikis (Fandom, Namu Wiki) não foram encontrados. Reddit (r/EvilHunterTycoon) só apareceu como espelho (redlib) sem conteúdo útil. O Google Play foi lido de forma truncada. Vários guias da SuperCheats e MrGuider deram 403; os dados deles aparecem aqui apenas a partir de trechos de busca, marcados como tal.

### Legenda de confiança

- **[FATO]**: afirmado por fonte citada, lida na página (ou no trecho de busca, quando marcado).
- **[FATO-SNIPPET]**: aparece só no resumo da busca, sem leitura da página completa. Confiança menor.
- **[INFERÊNCIA]**: deduzido por mim a partir dos fatos.
- **[CONFLITO]**: fontes discordam.
- **Idade da fonte:** muitos guias são de 2020 e foram atualizados pouco depois. O jogo recebeu muitas atualizações depois disso (até a versão 1.417, de 28/10/2026). **Os números de guias de 2020 podem estar desatualizados.**

---

## 1. Loop central

**[FATO]** Você é o chefe (ou "líder") de uma vila destruída pelo Senhor das Trevas/Rei Demônio. Recrutas caçadores ("Hunters"), que saem sozinhos para caçar monstros, trazem materiais de volta e voltam para a vila para descansar, comer, se curar e treinar.
- Fonte: [TapTap KR](https://www.taptap.io/kr/app/185496), [App Store KR](https://apps.apple.com/kr/app/id1458318990), [PocketGamer, lançamento](https://www.pocketgamer.com/evil-hunter-tycoon/evil-hunter-tycoon-is-a-town-management-sim-for-ios-and-android-where-youll-asse)

**[FATO]** O jogador não controla o caçador diretamente. Ele escolhe quais caçadores ficam na vila, equipa armas manualmente, distribui missões de recompensa (Bounty) e ajusta as configurações de IA (por exemplo, desligar uso de poção nos campos de caça).
- Fonte: [PocketGamer, guia](https://www.pocketgamer.com/evil-hunter-tycoon/guide) ("você precisa dar as armas manualmente"); [Touch Tap Play, dicas](https://www.touchtapplay.com/evil-hunter-tycoon-tips-cheats-guide-to-play-better/) ("Desligue o uso de poção nos campos de caça"; "aumente todas as barras exceto HP para 80%").

**[FATO]** Necessidades de bem-estar dos caçadores: fome, descanso/estamina e humor, além de HP.
- Caçador com fome recusa lutas; humor baixo impede ir para as terras do mal; HP zerado = morte (ressurreição paga em ouro).
- Fonte: [Search: guias da comunidade, trechos](https://www.touchtapplay.com/evil-hunter-tycoon-tips-cheats-guide-to-play-better/) e [Gaming On Phone](https://gamingonphone.com/guides/evil-hunter-tycoon-guide).

**[FATO]** Ciclo típico de um caçador: sai para caçar/bounty → luta → volta ferido/cansado → Infirmary (cura) → Restaurant (comida) → Inn (descanso) → Tavern (humor) → volta ao campo.
- Fonte: [Gaming On Phone](https://gamingonphone.com/guides/evil-hunter-tycoon-guide), [TapTap KR](https://www.taptap.io/kr/app/185496).

**[FATO]** Visitas de mais caçadores à vila aumentam renda e crescimento.
- Fonte: [TapTap KR](https://www.taptap.io/kr/app/185496) ("Quanto mais caçadores visitantes, maior a renda e o crescimento").

**[FATO]** Gold é o recurso principal; caçadores vendem materiais ao jogador (Trading Post) e pagam por serviços. Fonte: [Levelwinner](https://www.levelwinner.com/?p=32777) ("Trading Post: Request materials from hunters, who sell them to you for gold").

**[INFERÊNCIA]** Há um fluxo de dinheiro: caçador → materiais → Trading Post → ouro → compra de equipamento/poções/serviços → caçador. Confirmado parcialmente pelas fontes; o preço e a fórmula exatos não foram encontrados.

---

## 2. Construções

### 2.1 Lista consolidada

| Construção | Função (FATO, salvo indicação) | Fonte principal |
|---|---|---|
| Town Hall (Prefeitura) | Nível define quais construções podem ser feitas e até que nível cada uma sobe. Prioritária. | [Levelwinner](https://www.levelwinner.com/?p=32777) |
| Trading Post (Posto de troca) | Caçadores trazem materiais; o jogador compra com gold. Usado para balancear custos de materiais. | [Levelwinner](https://www.levelwinner.com/?p=32777), [PocketGamer](https://www.pocketgamer.com/evil-hunter-tycoon/guide) |
| Sanctuary of Resurrection / Statue of Resurrection | Revive caçadores mortos, por ouro. | [Levelwinner](https://www.levelwinner.com/?p=32777), [Gaming On Phone](https://gamingonphone.com/guides/evil-hunter-tycoon-guide) |
| House (Casa) | Cada upgrade adiciona 2 vagas de caçador (dependendo da dificuldade). Capacidade base: 6. | [Levelwinner](https://www.levelwinner.com/?p=32777) |
| Common House | Aumenta o número de pessoas que moram na vila. | [PocketGamer](https://www.pocketgamer.com/evil-hunter-tycoon/guide) |
| Infirmary (Enfermaria) | Cura lesões. Descrita como obrigatória: sem suprimentos, caçadores "ficam parados do lado de fora". | [Touch Tap Play](https://www.touchtapplay.com/evil-hunter-tycoon-tips-cheats-guide-to-play-better/), [Levelwinner](https://www.levelwinner.com/?p=32777) |
| Inn (Hospedaria) | Recupera estamina/exaustão. Quartos pequenos dão descanso e recuperam humor. | [Gaming On Phone](https://gamingonphone.com/guides/evil-hunter-tycoon-guide), [Levelwinner](https://www.levelwinner.com/?p=32777) |
| Restaurant (Restaurante) | Comida para a barra de saciedade dos caçadores. | [Gaming On Phone](https://gamingonphone.com/guides/evil-hunter-tycoon-guide) |
| Tavern (Taverna) | Bebidas que dão humor. Descrita como opcional. | [Gaming On Phone](https://gamingonphone.com/guides/evil-hunter-tycoon-guide), [Touch Tap Play](https://www.touchtapplay.com/evil-hunter-tycoon-tips-cheats-guide-to-play-better/) |
| Blacksmith (Ferreiro) | Crafta armas e armaduras. Precisa de upgrade para fazer itens de tier superior. | [Levelwinner](https://www.levelwinner.com/?p=32777), [PocketGamer](https://www.pocketgamer.com/evil-hunter-tycoon/guide) |
| Alchemist's Home (Alquimista) | Poções. | [Gaming On Phone](https://gamingonphone.com/guides/evil-hunter-tycoon-guide) |
| Jeweler (Joalheiro) | Acessórios. Precisa de upgrade para tiers superiores. | [Levelwinner](https://www.levelwinner.com/?p=32777) |
| Weapon / Armor / Potion / Accessory Shops | Vitrines para o que foi craftado; precisam de upgrade para mostrar itens de tier superior. Loja de armadura também exibe capacetes de masmorra. | [Levelwinner](https://www.levelwinner.com/?p=32777) |
| Academy (Academia) | Caçadores aprendem e melhoram Skills, Traits (traços) e "Secret Techniques". Custo de treino: o jogador paga metade. Também relatado como lugar de troca de classe (ver §3). | [Levelwinner](https://www.levelwinner.com/?p=32777), [Gaming On Phone](https://gamingonphone.com/guides/evil-hunter-tycoon-guide), [PocketGamer launch](https://www.pocketgamer.com/evil-hunter-tycoon/evil-hunter-tycoon-is-a-town-management-sim-for-ios-and-android-where-youll-asse) |
| Enhancement Forge (Forja de aprimoramento) | Upgrade de equipamento. Custo do aprimoramento: ouro do caçador. Mostra chance de sucesso antes de confirmar. | [Levelwinner](https://www.levelwinner.com/?p=32777), [Search: Zendesk/SuperCheats, trecho](https://evilhunter.zendesk.com/hc/en-us/articles/360039886631-Equipment) |
| Training Ground (Campo de treino) | Acelera o nivelamento de caçadores novos. Até 8 vagas; um livro de "Beginner Tactics" leva ~30 min. | [Levelwinner](https://www.levelwinner.com/?p=32777), [Touch Tap Play, reencarnação](https://www.touchtapplay.com/evil-hunter-tycoon-reincarnation-guide-how-to-unlock-normal-mode/) |
| Reincarnation Portal (Portal de reencarnação) | Disponível desde o início. Reencarna caçadores no nível máximo; obrigatório para avançar dificuldade. | [Levelwinner](https://www.levelwinner.com/?p=32777), [Touch Tap Play](https://www.touchtapplay.com/evil-hunter-tycoon-reincarnation-guide-how-to-unlock-normal-mode/) |
| Bounty Hut (Caçada de recompensas) | Designa caçadores para alvos específicos (XP e ouro extra). | [Levelwinner](https://www.levelwinner.com/?p=32777), [Touch Tap Play](https://www.touchtapplay.com/evil-hunter-tycoon-tips-cheats-guide-to-play-better/) |
| Dungeon Entrance (Entrada de masmorra) | Raides de masmorra por nível e dificuldade; níveis mais altos são mais difíceis e pagam mais. | [Levelwinner](https://www.levelwinner.com/?p=32777) |
| Boss Horn (Chifre do chefe) | Invoca o chefe de campo (field boss). Ver §5. | [Touch Tap Play, bosses](https://www.touchtapplay.com/evil-hunter-tycoon-boss-battle-guide-how-to-defeat-bosses/) |
| Colosseum (Coliseu) | PvP. Desbloqueia na dificuldade normal (Levelwinner) ou já no início (Touch Tap Play, ver §7). | [Levelwinner](https://www.levelwinner.com/?p=32777), [Touch Tap Play, PvP](https://www.touchtapplay.com/evil-hunter-tycoon-pvp-guide-best-formation-team-setup/) |
| Guild HQ (Sede da guilda) | Necessário para entrar em guilda. | [Levelwinner](https://www.levelwinner.com/?p=32777) |
| Mansion (Mansão) | Expandida em 1.361 (Dark Knight). | [App Store KR](https://apps.apple.com/kr/app/id1458318990) |
| Equipment warehouse (Armazém de equipamentos) | Ampliado em 1.376. | [App Store KR](https://apps.apple.com/kr/app/id1458318990) |
| Marketplace (거래소) / Hell Trading Post | Trocas/mercado; "Hell Trading Post" adicionado em 1.378. | [App Store KR](https://apps.apple.com/kr/app/id1458318990) |
| Enhancement/Tempering (담금질) | Tempering adicionado/corrigido em 1.381. | [App Store KR](https://apps.apple.com/kr/app/id1458318990) |
| Hell Outpost / Hell Forward Base | Mapa Hell novo (1.378); 20 ondas de defesa, 10 tipos de torre, guarnições de caçadores, forja de Hellfire. | [App Store KR](https://apps.apple.com/kr/app/id1458318990), [TapTap KR](https://www.taptap.io/kr/app/185496) |

### 2.2 Custos e níveis

- **Custos em ouro/materiais por construção: não encontrado** nas fontes lidas.
- **Número de níveis por construção:** PocketGamer diz "Every building has a few update levels", sem número exato.
- **Requisitos de Town Hall por construção:** não encontrado.
- **Obstáculos:** custam ouro para limpar, alguns exigem certa dificuldade (Levelwinner).

### 2.3 Geração de ouro pelos caçadores

- **[FATO]** Caçadores vendem materiais ao Trading Post (Levelwinner).
- **[FATO]** Serviços de hospedagem, cura, comida e ressurreição têm custo em ouro (Levelwinner, Gaming On Phone).
- **[FATO-SNIPPET]** O modo "Full care" gerencia a manutenção dos caçadores e os caçadores precisam de ouro (App Store KR).
- **[NÃO ENCONTRADO]** Salário fixo, contrato, taxa diária, percentual cobrado por serviço. Não há dados numéricos.

---

## 3. Caçadores

### 3.1 Classes

| Classe | Papel | Fonte |
|---|---|---|
| Paladin | Único tanque/defensivo; lidera raides de masmorra. Cura e absorve dano. | [Levelwinner](https://www.levelwinner.com/?p=32777), [Touch Tap Play](https://www.touchtapplay.com/evil-hunter-tycoon-tips-cheats-guide-to-play-better/) |
| Berserker | Melee, mais ataque que o Paladin; chance de atordoar; pode ser off-tank. | [Levelwinner](https://www.levelwinner.com/?p=32777), [Touch Tap Play](https://www.touchtapplay.com/evil-hunter-tycoon-tips-cheats-guide-to-play-better/) |
| Ranger | DPS de alvo único, alta agilidade e esquiva, defesa baixa. Multishot e Evasion inicial. | [Levelwinner](https://www.levelwinner.com/?p=32777), [Touch Tap Play](https://www.touchtapplay.com/evil-hunter-tycoon-tips-cheats-guide-to-play-better/) |
| Sorcerer | Caster ofensivo; Thunderbolt (multi-alvo); Ice Armor (defesa + lentidão em área). | [Levelwinner](https://www.levelwinner.com/?p=32777) |
| Dark Knight | Nova classe; arma principal: lança. Adicionada em 1.361 (05/12/2025). | [App Store KR](https://apps.apple.com/kr/app/id1458318990) |

- **[NÃO ENCONTRADO]** "Night Hunter" e outras classes do pedido. As quatro primeiras classes são as de 2020; Dark Knight é a única adicionada encontrada.
- **[CONFLITO]** Touch Tap Play descreve Ranger como "best overall" e Berserker como "menos útil em equipe". É opinião de autor, não regra.

### 3.2 Atributos

- **[FATO]** Atributos mencionados: Attack, Defence, Crit Rate, e "Attack Power" (valor usado como requisito de entrada no Battlefield of Victory: 80.000). Fontes: [PocketGamer guia](https://www.pocketgamer.com/evil-hunter-tycoon/guide), [PocketGamer Battlefield](https://www.pocketgamer.com/evil-hunter-tycoon/evil-hunter-tycoon-introduces-battlefield-of-victory-guild-war-content-in-latest).
- **[NÃO ENCONTRADO]** STR/DEX/INT/VIT. As fontes não usam esses atributos. Esse é o ponto principal a verificar com a pesquisa de sistemas — não aceite STR/DEX/INT/VIT como verdade para este jogo.
- **[FATO]** Atributos de equipamento: attack speed, attack damage, critical chance, armor com bônus de ataque (Touch Tap Play, PvP).

### 3.3 Raridade e estrelas dos caçadores

- **[FATO]** Graus de caçador, do mais baixo ao mais alto: **Normal, Rare, Superior, Heroic, Legendary**. O grau é definido por RNG (Levelwinner, março de 2020).
- **[FATO]** Recomendação do guia: dispensar Normal e Rare com o tempo, mas manter até surgirem melhores; priorizar os de maior grau.
- **[FATO]** Fontes de recrutamento: "Hunter scrolls" (pergaminhos de caçador) e convites "arcane" gratuitos (um por dia via vídeo-anúncio, com melhores chances de Heroic e Legendary) (Levelwinner).
- **[FATO]** "Free premium scrolls" no armazém da vila podem invocar caçadores (Touch Tap Play, 2020). R e S superam N.
- **[FATO]** Convites Superior, Arcane e Legendary aparecem como recompensas de eventos (3º aniversário, PocketGamer 2023: 1 Legendary Hunter Invitation para jogadores que retornam; 6 milhões de downloads, GamingOnPhone 2023: Arcane Hunter Invitations em evento de screenshot).
- **[CONFLITO]** Touch Tap Play usa "N, R, S" como graus, enquanto Levelwinner usa Normal/Rare/Superior/Heroic/Legendary. Provavelmente a mesma escala com abreviações diferentes, mas é inferência.
- **[NÃO ENCONTRADO]** "Estrelas" (★) como mecânica distinta do grau. A reencarnação, pelo guia de reencarnação (ver §3.6), aumenta uma estrela.

### 3.4 Traits (traços) e personalidades

- **[FATO]** Traits são aprendidos e melhorados na Academia (Levelwinner). PocketGamer (lançamento) também cita Skills, Traits e "Secret Techniques" na Academia.
- **[FATO-SNIPPET]** Traits "impulsionam o desempenho em batalha, como ataque, defesa e efeitos de controle de multidão" (resumo de busca, não lido na página).
- **[FATO]** Caçadores têm **personalidade**, que influencia o comportamento. "Você escolhe quais caçadores ficam na vila. Cada um tem classe, personalidade e habilidades." (PocketGamer, lançamento).
- **[FATO-SNIPPET]** Personality elixirs (elixires de personalidade) são vendidos em pacote semanal (App Store KR, ₩15.000). O que o elixir faz não foi encontrado.
- **[NÃO ENCONTRADO]** Quais personalidades existem, o que cada uma muda no comportamento, impacto em humor/satisfação, salário ou contrato.
- **[INFERÊNCIA]** A personalidade muito provavelmente interage com as regras de humor, mas não há fonte que confirme.

### 3.5 Humor, fome, descanso

- **[FATO]** Fome: caçador com fome recusa lutas (Search: guia de caçadores, trecho e Gaming On Phone).
- **[FATO]** Humor baixo: não vai para as terras do mal. Corrigido com Inn e Tavern (trecho de guia).
- **[FATO]** Estamina: recuperada no Inn.
- **[FATO]** HP: recuperado na Infirmary; caçador com HP zerado morre.
- **[NÃO ENCONTRADO]** Valores numéricos desses medidores (escalas, limiares, taxas de queda).

### 3.6 Nível, reencarnação e promoção de classe

- **Nível máximo inicial:** 100 (Touch Tap Play, reencarnação, 2020). Um guia de março de 2020 diz que o teto deve subir para 150 ou 200 após a primeira reencarnação, mas não confirma.
- **Reencarnação:**
  - **[FATO]** Só pode ser feita quando o caçador atinge o nível máximo (Touch Tap Play, 2020).
  - **[FATO]** Leva cerca de 5 minutos no Portal de Reencarnação (Touch Tap Play).
  - **[FATO]** O caçador ganha uma estrela e volta ao nível 1 "com melhores atributos iniciais" (Touch Tap Play).
  - **[FATO]** Não há limite declarado de quantas vezes reencarnar (Touch Tap Play).
  - **[FATO]** Reencarnar é o que libera dificuldades (ver §5.2).
  - **[CONFLITO]** O lançamento (PocketGamer, fev/2020) diz que reencarnação está disponível no **nível 10**, enquanto os guias de março de 2020 dizem que é no nível máximo, 100. Pode ter havido mudança depois do lançamento. Não consegui resolver isso.
  - **[FATO-SNIPPET]** Pontos de reencarnação que levam a traits (resumo de busca de MrGuider, página não lida; MrGuider deu 403).
- **Troca de classe / promoção:**
  - **[FATO]** PocketGamer (4 milhões de downloads, 02/08/2021) menciona "3rd Class Changes" como atualização recente, sem detalhes. Isso indica que existem trocas de classe em mais de uma etapa.
  - **[FATO-SNIPPET]** Resposta da comunidade (AppGamer, página 403 na leitura direta): troca de classe no Academy, só depois de **5 reencarnações** e nível **100**, com custo de **1.000.000 "Shadow Souls"**. Ver o aviso abaixo.
  - **[NÃO ENCONTRADO]** Requisitos de 1ª, 2ª e 3ª promoção, nomes das classes promovidas, e os caminhos Storm Ranger / Dark Knight (a busca retornou Heva Clonia para "Storm Ranger", outro jogo).
  - **[CONFLITO / ALERTA]** "Shadow Souls" aparece só no resumo de busca, e não consegui confirmar que seja moeda de Evil Hunter Tycoon. Há indícios de que o termo venha de outro jogo (Shadow Hunter). Não usar como fato sem confirmação.
- **Aposentadoria / Hall da Fama / retreino:** não encontrado.

---

## 4. Equipamento

### 4.1 Tipos de equipamento

- **[FATO]** Armas, armaduras, acessórios (colares e anéis), capacetes (vindos de masmorras), poções (Levelwinner, 2020).
- **[FATO]** Armas: três tipos de bônus (Critical Chance, Attack Speed, Attack Damage). Armas mais raras dão mais bônus, mas exigem mais materiais e drops (Touch Tap Play, 2020).
- **[FATO]** Armadura: cada categoria tem três peças; as duas primeiras podem ter efeitos negativos, e a terceira exige "Skeleton Bone Fragments" (Touch Tap Play).

### 4.2 Tiers e raridade

- **[FATO]** Armas: tiers **S+, S, A, B, C** (PocketGamer, 2022). Os tiers mais altos desbloqueiam em estágios avançados.
- **[FATO]** Qualidade de craft: menciona "Advanced" (limiar de missão) e "Ultimate Quality". Cores: azul e roxo (Touch Tap Play, craft). A qualidade vale por peça, então fabricar o mesmo item de novo pode dar resultado melhor ou pior.
- **[FATO]** Opções únicas de equipamento (Unique options) e "Equipment option presets" (App Store KR, 1.382, 22/10/2026).
- **[FATO-SNIPPET]** Escala de qualidade completa, nomes dos tiers e probabilidades: não encontrado de forma confiável.
- **[NÃO ENCONTRADO]** Lista completa de raridades de equipamento (Common/Rare/Epic/Legendary, etc.) e tiers Primal/Ancient. Não aparecem nas fontes lidas.

### 4.3 Forja, crafting e materiais

- **[FATO]** Crafting usa materiais de caça e drops. Materiais são usados para craftar, aprimorar e construir (PocketGamer).
- **[FATO]** Crafting de armas: deve-se fabricar até obter o nível pedido (no caso da missão de "Advanced"); o autor precisou de 2-3 tentativas e obteve "Ultimate" numa delas (Touch Tap Play, craft).
- **[FATO]** O Enhancement Forge aprimora itens usando "enhancement stones" e "upgrade stones" obtidos no Trading Post, e mostra a chance de sucesso antes de confirmar (trecho de resumo do Zendesk e da SuperCheats).
- **[FATO]** Aprimoramento vai até **+10** (Levelwinner, 2020).
- **[FATO]** Equipamento de +10 pode ser mais fraco que o equipamento básico do próximo nível de dificuldade (Levelwinner): "Save gold for the new set."
- **[FATO-SNIPPET]** Reroll de atributos ou qualidade: custo em gems subindo de 40 para 70 para 100 a cada troca (trecho do Zendesk, não lido na página).
- **[FATO]** Tempering (담금질) adicionado/corrigido em 1.381 (App Store KR). Hellfire forging melhora itens de topo com opções especiais (TapTap).
- **[NÃO ENCONTRADO]** Chances de sucesso de aprimoramento por nível, custos em ouro, custo de stones, falha/perda.
- **[NÃO ENCONTRADO]** Sets (conjuntos), encantamentos, gemas e talismãs como sistema separado. "Pets" e "costumes" são coisas diferentes (§6).

### 4.4 Desmontar, vender, descartar

- **[NÃO ENCONTRADO]** Desmontagem de equipamento. Vender: não há confirmação.
- **[FATO]** Caçadores podem ser dispensados ("banish") de forma permanente (Levelwinner; Touch Tap Play). Recomendado com N/Rare quando há melhores disponíveis.

### 4.5 Runas (Darkness' Front Yard)

- **[FATO]** Sistema de runas com **25 variantes**, cada uma de nível **1 a 10**. Runas do mesmo tipo não empilham; equipe variantes diferentes (PocketGamer, 22/05/2020; Droidgamers, 22/05/2020).

---

## 5. Mapas, monstros, chefes, dificuldade, dungeons

### 5.1 Mapas e zonas

- **[FATO]** Quatro mapas no início: **Town (vila), Invaded Land, Land of the Dead, Land of the Fallen** (Gaming On Phone). Limpam-se monstros em todos menos na vila.
- **[FATO]** Terras dos mortos são perigosas para caçadores fracos; "they will be instantly overpowered" (Touch Tap Play, 2020).
- **[FATO]** Dark Lord's Castle, via "Darkness' Front Yard" (atualização de 22/05/2020): acesso exige **Hard mode** e um portal instável (PocketGamer). Monstros: Maids, Stewards, Gardeners, e o mais forte, Bloody Royal Guards. Recomendado: armas com dano extra contra mortos-vivos e demônios.
- **[FATO]** "Demon King castle front yard" (Demon King castle, pátio frontal): estágios 201–300 adicionados na versão 1.373 (App Store KR, data 22 de maio; ano 2026 pela sequência de versões).
- **[FATO]** Hell Outpost (1.378, 18/09/2026): mapa "Hell", novos edifícios, Hell Trading Post, defesa do Outpost; sweep de defesa em 1.381.
- **[FATO]** Região de chefes de campo: nordeste do mapa, acima de Land of the Fallen (Touch Tap Play, bosses).

### 5.2 Dificuldades

- **[FATO]** Existe progressão de dificuldade por reencarnação. Fases citadas: **Easy** (inicial) → **Normal** (2 caçadores reencarnados de 1 estrela) → **Hard** (terceira dificuldade; exige masmorra no nível 50 e 25 conquistas de raides por dificuldade) → Expert, Nightmare, Torment I–III.
  - Normal: "todos os caçadores não reencarnados NÃO lutam"; monstros mais fortes; reseta spawns, bounties e boss battles. Edifícios, níveis de herói e itens são mantidos (Touch Tap Play, reencarnação, 2020).
  - Hard: exige "dungeon level 50" e "clear all 25 dungeon raid achievements per difficulty" (Levelwinner).
  - Torment III: Touch Tap Play (reencarnação, 2020) diz que o ciclo se repete "até chegar ao Torment III", sem detalhar os tiers intermediários.
- **[FATO-SNIPPET]** SuperCheats (dificuldades, página 403; trecho): Expert = 4 caçadores reencarnados 3 vezes ou mais; Nightmare; três tiers de Torment com o mesmo requisito (possível erro de cópia).
- **[CONFLITO]** Hard como terceira dificuldade (Levelwinner) vs. Hard como modo que dá acesso ao Darkness' Front Yard (PocketGamer). Podem ser coisas diferentes ou nomes que mudaram; é inferência.

### 5.3 Monstros

- **[FATO]** Monstros dos mapas: "Maids, Stewards, Gardeners" e "Bloody Royal Guards" (Darkness' Front Yard); "Greentail" (criatura do castelo do Rei Demônio, 1.365). Lista completa não encontrada.
- **[FATO]** Mobs têm densidade ajustável pelos sinais (signboards) de nível 1 a 3, com cooldown de 60 segundos ao voltar para o nível 1 (Levelwinner).

### 5.4 Chefes de campo (field bosses)

- **[FATO]** Invocado pelo **Boss Horn** (Construção). Botão de invocação aparece no canto superior direito quando construído (Touch Tap Play, bosses).
- **[FATO]** Temporização: espera de cerca de **3 minutos** antes da luta (caçadores se curam, comem e descansam); luta dura **10 minutos**; há cooldown após cada batalha, ganhando ou perdendo; pode ser encerrado tocando o mesmo ícone (Touch Tap Play, bosses).
- **[FATO]** Chefes causam dano pesado, têm HP muito alto e invocam mobs periodicamente. Caçadores caídos voltam à vila e, se curados rápido, podem voltar à luta (Touch Tap Play).
- **[FATO]** Cada dificuldade tem um chefe diferente (Levelwinner). Boss kills contam para conquistas.
- **[FATO-AUTOR, não oficial]** O autor venceu em menos de 2 minutos com 8 caçadores nível 100+ e equipamento básico completo. Estimativa para Easy: squad de nível 65+ com equipamento completo.
- **[FATO]** Chefes de campo foram retrabalhados em março de 2026 (1.368, 1.369, 1.371). Sem detalhes numéricos.
- **[FATO]** World Boss (PvE, aniversário 2023): **Poison Hydra** e **Lich Lord**, aparecem segunda, quarta e sexta, a cada duas semanas (PocketGamer, 22/03/2023). Boss Chests dão **Boss Essence**, material para a **Boss Weapon**.
- **[FATO-SNIPPET]** Chefe de guilda (guild boss): "Team up against powerful guild bosses" (TapTap). Detalhes não encontrados.
- **[FATO]** Bug de entrada no World Boss corrigido em 1.371; bug de debuff corrigido em 1.364.

### 5.5 Dungeons / masmorras

- **[FATO]** Masmorras são raidadas por nível e dificuldade. Nível mais alto = mais difícil e mais recompensa. Recompensas: capacetes únicos e itens raros (Levelwinner).
- **[FATO]** Dungeon Entrance (construção). Clear: 25 raid achievements por dificuldade (Levelwinner).
- **[FATO]** "Abyss difficulty" (abismo) expandido em 1.356 (set 2025) e em 1.367 (fev 2026) (App Store KR).
- **[NÃO ENCONTRADO]** Número de andares, timer de dungeon, custo de entrada, recompensas exatas.

### 5.6 Raides e conteúdo cooperativo

- **[FATO]** Alliance raid "Envy of the Four Heavenly Kings: Sarang-ni" (1.365, jan/2026) (App Store KR).
- **[NÃO ENCONTRADO]** Tamanho de raide, dificuldade, recompensa.

### 5.7 Eventos de invasão na cidade

- **[FATO]** World Boss e Poison Hydra/Lich Lord "terrorise the town" durante os horários do evento de aniversário (PocketGamer 2023). É o único caso de invasão encontrado.

---

## 6. Recursos e economia

### 6.1 Moedas e recursos

| Recurso | Função | Fonte |
|---|---|---|
| Gold | Moeda base: construção, serviços (ressurreição, Inn, Infirmary, Restaurant), aprimoramento (Enhancement Forge), compra de itens. | [Levelwinner](https://www.levelwinner.com/?p=32777), [Gaming On Phone](https://gamingonphone.com/guides/evil-hunter-tycoon-guide) |
| Coins (moedas) | Compras no Trading Post. | [Gaming On Phone](https://gamingonphone.com/guides/evil-hunter-tycoon-guide) |
| Gems (gemas) | Premium. Usado em pets, rerolls, aceleração. "Mais difícil de ganhar que gold." | [Levelwinner](https://www.levelwinner.com/?p=32777), [PocketGamer](https://www.pocketgamer.com/evil-hunter-tycoon/guide) |
| Elementals (Elementais) | Stack máximo **3.000**. Gasta-se em ouro, gems, pergaminhos de caçador e buffs. Baú: **800**. Vídeo-anúncio: **+1.000 a cada 4 horas** (Levelwinner). | [Levelwinner](https://www.levelwinner.com/?p=32777) |
| Materiais | Gerados pela caça; coletados pelo caçador ou pelo jogador tocando itens brilhantes. | [Levelwinner](https://www.levelwinner.com/?p=32777), [PocketGamer](https://www.pocketgamer.com/evil-hunter-tycoon/guide) |
| Item Drop Scroll | Raro. Vem de baús de bônus e tesouro. Taxa: não encontrada. | [PocketGamer](https://www.pocketgamer.com/evil-hunter-tycoon/guide) |
| Oranges, Flour, Linen Cloth, Heartwood Fragments | Materiais básicos; Heartwood em grande quantidade (Touch Tap Play). | [Touch Tap Play](https://www.touchtapplay.com/evil-hunter-tycoon-tips-cheats-guide-to-play-better/) |
| Enhancement/upgrade stones | Aprimoramento. | [Search: Zendesk, trecho](https://evilhunter.zendesk.com/hc/en-us/articles/360039886631-Equipment) |
| Boss Essence | Material para Boss Weapon (2023). | [PocketGamer 3rd anniv](https://www.pocketgamer.com/evil-hunter-tycoon/3rd-anniv/) |
| Arcane / Superior / Legendary Hunter Invitations | Convites para recrutar caçadores. | [PocketGamer](https://www.pocketgamer.com/evil-hunter-tycoon/3rd-anniv/), [Levelwinner](https://www.levelwinner.com/?p=32777) |
| Awakening Crystals | Recompensa de evento (3º aniversário, 3 unidades por jogador que retorna). Uso não encontrado. | [PocketGamer 3rd anniv](https://www.pocketgamer.com/evil-hunter-tycoon/3rd-anniv/) |

- **[NÃO ENCONTRADO]** Preço das gemas em dinheiro real (KRW/USD) para o jogo global. Há preços KRW da versão coreana (App Store KR): pacote inicial ₩7.500; Premium 30 dias ₩16.000; Advanced Premium 30 dias ₩23.000; Large Jewel Box ₩10.000; Weekly Personality Elixir ₩15.000.

### 6.2 Energia / tickets / offline

- **[FATO]** Não há progresso offline (Levelwinner, março de 2020: "The game has no offline progress. Active play drives advancement."). Isto contradiz a expectativa de um idle game e é o dado mais relevante para o design.
- **[FATO]** Comunidade afirma que "os melhores ganhos exigem que o jogo fique aberto 24h" (TapTap, comentário de usuário). Fonte de opinião.
- **[FATO]** "Full care mode" gerencia manutenção dos caçadores (App Store KR) — pode ser uma mecânica de "manutenção" que age mesmo sem o jogador, mas não consegui confirmar.
- **[NÃO ENCONTRADO]** Energia, tickets, stamina do jogador, limites diários de dungeon.

### 6.3 Anúncios recompensados

- **[FATO]** Vídeo-anúncio dá **+1.000 elementais a cada 4 horas** (Levelwinner).
- **[FATO]** "Ad goblin" (goblin de anúncio) dá até **15 vezes por dia** de recompensa em gems e gold; o valor depende da dificuldade (Levelwinner). Confirmado por trecho de busca.
- **[FATO]** "Treasure Chest" de anúncio: boost de XP do caçador. "Goblin": gems grátis. "Gold ads não valem a pena" (Touch Tap Play).
- **[FATO]** Convite arcano gratuito por dia via vídeo-anúncio (Levelwinner).
- **[FATO]** Baú dourado aleatório: ouro ou um buff de 50% de XP por 1 hora (Levelwinner).

### 6.4 Pets, costumes, gemas gastas

- **[FATO]** Pets de vila (comprados com gems) dão buffs a todos os caçadores: **Vampire Bat** (até 10% de roubo de vida), **Dark Fox** (defesa), **Baby Dragon** (ataque) (Touch Tap Play; Levelwinner).
- **[FATO]** Pets de campo: caçadores equipam para pegar itens automaticamente (Levelwinner).
- **[FATO]** Costumes dão bônus extras (Touch Tap Play; App Store KR "costume selection box" em 1.373).

---

## 7. Sistemas sociais

### 7.1 Guildas / alianças

- **[FATO]** Há guilda (Guild HQ) e aliança de chefes de vila: buffs compartilhados que aceleram a progressão (App Store KR; TapTap).
- **[FATO]** "Village Chief's Cheer" (촌장의 응원) buff em 1.376.
- **[FATO]** Chat de aliança melhorado em 1.365; alianças têm "honra" (App Store KR).
- **[NÃO ENCONTRADO]** Tamanho máximo de guilda, cargos, cotas, recompensas de contribuição.

### 7.2 PvP: Colosseum

- **[FATO]** Colosseum na tela, botão no canto superior direito, leva à seleção de liga (Touch Tap Play, PvP, 2020).
- **[FATO]** Batalhas **5 contra 5** (Touch Tap Play).
- **[FATO]** Máximo de **dois caçadores da mesma classe** por equipe (Touch Tap Play).
- **[FATO]** Matchmaking por "item level" (Touch Tap Play).
- **[FATO]** Formações sugeridas: 2 frente / 2 meio / 1 trás, ou 1 / 2 / 2.
- **[FATO]** Recompensa: "XP boost scroll" a cada 5 batalhas (Touch Tap Play, 2020). Autor diz que não há recompensas grandes.
- **[NÃO ENCONTRADO]** Pontos de ranking, temporadas, ligas além da Junior League 5x5, recompensas de rank.

### 7.3 Battlefield of Victory (guerra de guildas, 18/08/2021)

- **[FATO]** Formato **10 contra 10** (PocketGamer; GamingOnPhone).
- **[FATO]** Temporada de **duas semanas**: 4 dias de inscrição, 4 dias de composição, 6 dias de batalha.
- **[FATO]** Requisito de entrada: **80.000 Attack Power** por caçador. Caçadores registrados vão para um "Hunter Pool".
- **[FATO]** Regras de equipe: máximo de **4 caçadores da mesma ocupação**; cada extra gera penalidade. Monte 10 de 16 slots.
- **[FATO]** Recompensas de lançamento: 5 "Superior Hunter Invitations", evento de login de 7 dias, cupom de vestimenta "Vacation Costume".

### 7.4 Trocas entre jogadores

- **[FATO]** Existe um "Marketplace" (거래소) e um "Hell Trading Post" (App Store KR).
- **[FATO]** "Trading" é descrito como importante (PocketGamer), sem detalhes.
- **[NÃO ENCONTRADO]** Se o mercado é entre jogadores ou apenas com NPC/sistema; taxas; listagens; leilão.

### 7.5 Ranking

- **[FATO]** Sem ranking de loja observado (AppGoblin; App Store KR "chart #164 em Role Playing"). Ranking interno não encontrado.

---

## 8. Metaprogressão

### 8.1 Nível da vila (Town Hall)

- **[FATO]** Town Hall desbloqueia construções e aumenta o limite dos edifícios (Levelwinner). Ver §2.

### 8.2 Conquistas (achievements)

- **[FATO]** Conquistas dão gems e outras recompensas. Coleta pelo ícone de troféu e depois pelo correio (Levelwinner).
- **[FATO]** Principal fonte de gems, segundo a comunidade (PocketGamer, guia; Gaming On Phone).
- **[FATO]** 25 conquistas de raide por dificuldade (Levelwinner).

### 8.3 Missões diárias, semanais, quests

- **[FATO]** Quests principais (Novice Quests) dão um tutorial e recompensas; seguir a sequência ensina quais construções fazer (Levelwinner; PocketGamer).
- **[FATO]** Missões diárias: fonte pequena de gems (PocketGamer).
- **[FATO]** Eventos de login e recompensas semanais com 100–200 gems (blog de jogador, citado em busca).
- **[NÃO ENCONTRADO]** Quantidade de missões diárias/semanais, reset, recompensa exata.

### 8.4 Passe de batalha / assinatura

- **[FATO]** Premium: "Basic Premium (7 dias) ₩4.800", "Basic Premium (30 dias) ₩16.000", "Advanced Premium (30 dias) ₩23.000" (App Store KR, preços KRW da versão coreana).
- **[NÃO ENCONTRADO]** Passe de batalha com trilha de recompensas.

### 8.5 Coleção, cosméticos

- **[FATO]** Costumes de caçadores e de chefe (novo "chief costume", 1.368). Costume selection box (1.373).
- **[FATO]** Pacotes de Hero Memory, Personality Elixir, Jewel Box (App Store KR).
- **[NÃO ENCONTRADO]** Coleção formal (bestiário, catálogo de caçadores).

### 8.6 Eventos e aniversários

- **[FATO]** Aniversários com recompensas: 1º (2021), 3º (março 2023), 6º, 7º (janeiro de 2026: "7th-anniversary event box") (PocketGamer; App Store KR).
- **[FATO]** Marcos de downloads: **2M** (maio/2020), **3M**, **4M** (02/08/2021), **6M** (fev/2023). Google Play via AppGoblin: 4,8M installs (snapshot sem data).
- **[FATO]** Recompensas de marco de 6 milhões: voucher de 6 "Town Chief's Treasure Chests" (GamingOnPhone, 2023).
- **[FATO]** Evento de screenshot (Valentine's Day 2023): número entre 600–699 na tela → 3 Arcane Hunter Invitations e 200 gems (expirado).
- **[FATO]** Evento 4M (2021): "Find 4&0" e "4M Quiz" → 4M Gold e 200 gems cada.

### 8.7 Login e cupons

- **[FATO]** Coupons e códigos (PocketGamer, "coupon-codes", com data de julho de 2026). Uso específico não verificado.

---

## 9. Histórico de atualizações (versão coreana, App Store KR)

| Versão | Data | Mudança principal |
|---|---|---|
| 1.355 | 08/09/2025 | Ares' Sword ajustada |
| 1.356 | 29/09/2025 | Abyss expandido; acessórios abismais |
| 1.361 | 05/12/2025 | **Nova classe: Dark Knight** (lança) |
| 1.365 | 15/01/2026 | Alliance raid "Sarang-ni"; abyss belt; Greentail |
| 1.367 | 13/02/2026 | Abyss expandido; backup manual |
| 1.371 | 20/03/2026 | Retrabalho de chefes de campo |
| 1.372 | 22/04/2026 | Balanço de classes; mudança de opções únicas |
| 1.376 | 02/07/2026 | Armazém expandido; "Village Chief's Cheer"; relíquias |
| 1.377 | 06/08/2026 | Doação; melhoria de equipamento e treino |
| 1.378 | 18/09/2026 | **Hell Outpost**; novos edifícios; Hell Trading Post; tempering |
| 1.381 | 07/10/2026 | Varredura (sweep) de defesa do Outpost |
| 1.382 | 22/10/2026 | Presets de opções de equipamento |
| 1.417 | 28/10/2026 | Hell Forward Base (TapTap); defesa de 20 ondas, 10 tipos de torre |

Observação: as datas de 2026 vêm da ficha da App Store coreana. Algumas linhas dela parecem ter datas de 2025 e 2026 misturadas (por exemplo, 1.378 e 1.417 com tipos de dados diferentes). Tratar como **[FATO-SNIPPET]** até confirmar.

---

## 10. Recompensas e fórmulas (o que não consegui achar)

- Fórmula de dano, de defesa, de crítico.
- Custos em ouro das construções e níveis máximos.
- Taxas de drop de equipamento, de Item Drop Scroll, de convites.
- Chances de aprimoramento por nível (+1 a +10).
- Escala de humor/fome/estamina.
- Recompensas de Colosseum, de guilda e de Battlefield.
- Preço das gemas em dólar.

---

## 11. Lacunas e próximos passos de pesquisa

1. **Ler a Wiki/Namu Wiki (coreano) diretamente.** A busca não retornou o artigo do Namu Wiki; pode ser preciso buscar pela URL direta (namu.wiki/w/이블헌터%20타이쿤) no navegador.
2. **Zendesk de suporte** (evilhunter.zendesk.com): quase todas as tentativas deram 403. Abrir no navegador para os artigos de classes, reencarnação e equipamento.
3. **Guias SuperCheats e MrGuider (classes, reencarnação, dificuldade)**: 403. Pode ser útil acessar via navegador ou pelo "Wayback Machine".
4. **Reddit r/EvilHunterTycoon**: não lido diretamente.
5. **Atualizações recentes (2025-2026)**: quase todas as fontes de mecânica são de 2020; a fonte mais recente é a ficha da App Store coreana.
6. **Confirmar "Shadow Souls", "Storm Ranger", "Dark Knight"** no próprio jogo.

---

## 12. Fontes

Fontes lidas com sucesso (conteúdo da página):
1. PocketGamer, guia para iniciantes (13/12/2022): https://www.pocketgamer.com/evil-hunter-tycoon/guide
2. Gaming On Phone, guia (abril/2020, atualizado jul/2021): https://gamingonphone.com/guides/evil-hunter-tycoon-guide
3. Levelwinner, guia completo (27/03/2020, copyright 2024): https://www.levelwinner.com/?p=32777
4. Touch Tap Play, dicas e truques (18/03/2020): https://www.touchtapplay.com/evil-hunter-tycoon-tips-cheats-guide-to-play-better/
5. Touch Tap Play, chefes (boss battle guide): https://www.touchtapplay.com/evil-hunter-tycoon-boss-battle-guide-how-to-defeat-bosses/
6. Touch Tap Play, PvP (20/03/2020): https://www.touchtapplay.com/evil-hunter-tycoon-pvp-guide-best-formation-team-setup/
7. Touch Tap Play, reencarnação e Normal mode (19/03/2020): https://www.touchtapplay.com/evil-hunter-tycoon-reincarnation-guide-how-to-unlock-normal-mode/
8. Touch Tap Play, craft de arma avançada: https://www.touchtapplay.com/evil-hunter-tycoon-how-to-craft-an-advanced-weapon/
9. PocketGamer, lançamento (fev/2020): https://www.pocketgamer.com/evil-hunter-tycoon/evil-hunter-tycoon-is-a-town-management-sim-for-ios-and-android-where-youll-asse
10. PocketGamer, Darkness' Front Yard (22/05/2020): https://www.pocketgamer.com/evil-hunter-tycoon/evil-hunter-tycoon-introduces-darkness-front-yard-update-as-the-management-sim-h
11. Droidgamers, Darkness' Front Yard (22/05/2020): https://www.droidgamers.com/2020/05/22/urban-management-sim-evil-hunter-tycoon-gets-a-darkness-front-yard-update/
12. PocketGamer, Battlefield of Victory (18/08/2021): https://www.pocketgamer.com/evil-hunter-tycoon/evil-hunter-tycoon-introduces-battlefield-of-victory-guild-war-content-in-latest
13. GamingOnPhone, Battlefield of Victory: https://gamingonphone.com/news/evil-hunter-tycoon-battlefield-of-victory-update
14. PocketGamer, 4 milhões de downloads (02/08/2021): https://www.pocketgamer.com/articles/087576/evil-hunter-tycoon-celebrates-4-million-downloads-with-in-game-giveaways/
15. GamingOnPhone, 6 milhões de downloads (fev/2023): https://gamingonphone.com/news/evil-hunter-tycoon-celebrates-its-6-million-downloads-with-new-events
16. PocketGamer, 3º aniversário (22/03/2023): https://www.pocketgamer.com/evil-hunter-tycoon/3rd-anniv/
17. TapTap KR (ficha, versão 1.417, 28/10/2026): https://www.taptap.io/kr/app/185496
18. App Store KR, Retro Arts (id1458318990, histórico de versões): https://apps.apple.com/kr/app/id1458318990
19. AppGoblin (dados da Google Play, snapshot): https://appgoblin.info/apps/com.superplanet.evilhunter

Fontes só por trecho de busca (sem leitura da página): SuperCheats (hunter-guide, difficulty-levels, reincarnation, enhancement-forge, tips-for-more-gems, pets-and-fairy), MrGuider (guide-to-hunters, reincarnation-guide), Zendesk (Equipment, 360039886631), AppGamer (what-traits, how-to-change-class, how-to-enhance-equipment), 148apps (2M downloads, redirect), Google Play (página truncada), App Store global (id1493512288), Flickering Myth (lançamento, mar/2020): https://www.flickeringmyth.com/pixel-rpg-evil-hunter-tycoon-now-available-on-google-play-and-the-app-store/

Fontes não relevantes (outros jogos), descartadas: Heva Clonia (Storm Ranger/Dark Stalker), Shadow Hunter (Shadow Souls), Hell Clock, Sintopia, Anime Overload, Mewgenics etc.
