# Herói de Vaelmar 5.0 — auditoria de fidelidade

Comparação entre o clone e o **Hero of Aethric v3.27.3**, com base em duas gravações de tela do jogo original enviadas pelo usuário (28/10/2026) e nos dados do Codex. Nada vem do cliente comercial: ele não foi extraído e não será.

Legenda: **Igual** = confere com o vídeo · **Próximo** = mesma estrutura, detalhes diferentes · **Inferido** = completei sem ver · **Falta** = não existe ainda.

## Combate

| Elemento | Estado | Observação |
|---|---|---|
| Layout geral, fila de iniciativa, barra do chefe, nome/nível/Codex | Igual | medido no vídeo (1:20, 5:10–5:40) |
| Registro no canto superior direito e frases ("atacou!", "usou X!", "Mas errou!", "Golpe crítico!") | Igual | |
| Faixa com a ação do ator, números de dano amarelos, rótulo de status | Igual | |
| Grade 2 × 3 e atalho de poção | Igual | atalho aparece com mana < 50% ou vida < 60% (regra minha) |
| Ordem de turnos | Próximo | a fila mostra a ordem real do motor (herói → aliados → inimigos). O original ordena por iniciativa |
| Botão "Bate-papo" | Próximo | no clone é "Registro" (offline não tem chat) |
| Menu de habilidades e de itens abertos | Falta ver | o vídeo não abriu esses menus; usei lista de botões no mesmo estilo |

## Mundo

| Elemento | Estado | Observação |
|---|---|---|
| Terreno: grama, pinheiros em grade, trilhas bege, sem manchas | Próximo | paleta e proporções medidas nos quadros; o desenho é meu |
| Vilas com construções, moradores e cachorro | Próximo | construções são as artes oficiais do catálogo; **posições e quantidade são inventadas**, só Loton foi comparada com uma captura de 2022 |
| Interação: "Aproxime-se para desafiar este monstro" | Igual | alcance de 70 px é estimativa |
| Área bloqueada: "Você não está pronto para se aventurar." | Igual | |
| Cabeçalho (nome da área, linha de missão) | Próximo | |
| Coluna esquerda e mostrador | Próximo | o original tem Bate-papo e Árvore Astral; o clone mantém Recompensas, Origem, Portais, Desafio e Masmorra |
| Mapa-múndi com névoa de exploração | Próximo | cinza e bege hachurado, rótulos espaçados, ✕ e ◇; a geografia é a do mapa comunitário |
| Ciclo dia/noite | Igual (aparência) | a duração do ciclo não foi medida |
| Geografia e posição das cidades | Inferido | polígonos de um mapa comunitário, não o mapa real |

## Classes

| Elemento | Estado | Observação |
|---|---|---|
| Telas de Caminhos (Bravura, Omnimancia, Magia das Sombras) | Igual | cabeçalho, estrelas, cartões, silhuetas, contagens reais |
| Guerreiro, Mago e Ladrão, tiers 1–10 (nomes, ordem, descrições, contagens) | Igual | vistos nos dois vídeos; "Adepto" foi associado ao Lanceiro do catálogo pelos equipamentos |
| Detalhe da classe (tela cheia, armas, slots, bônus de atributos, botões) | Igual (estrutura) | textos longos só para 13 classes vistas; as outras recebem um texto montado do catálogo |
| Páginas Habilidades/Feitiços, Passivas e Frascos de Mana | Igual (texto) | 301 descrições de habilidades, 62 de passivas e 11 de frascos, lidas do vídeo; as que não apareceram usam texto montado. Mana e nível vêm do catálogo; «Poder» é estimado pelos atributos |
| Segure para desbloquear + custo em orns | Igual | tempo de 1 s é estimativa |
| Bônus de atributos por classe | Próximo | 18 classes calibradas com o que o vídeo mostrou (herói nível 17); as demais usam o multiplicador genérico do clone |
| Caminho de Valhalla (Adestrador) | Falta | visto a partir do nível 50; as classes existem no catálogo mas o clone ainda não tem o caminho |
| Regra de desbloqueio e preços | Próximo | nível exigido bate com o vídeo (1, 25, 50…225); os preços são os do Codex, o vídeo só mostrou 2.500 orns do Mago |

## Status e números

| Elemento | Estado | Observação |
|---|---|---|
| Layout do Status e do Equipamento | Próximo | já vinha das capturas anteriores do usuário |
| Guerreiro nível 1 e 12 | Igual | HP, mana, ataque, defesa, magia, resistência, destreza, iniciativa conferem |
| Crescimento entre os níveis 2–11 e 13–24 | Inferido | interpolação linear entre os dois pontos medidos |
| Acima do nível 24 | Próximo | mantém o ritmo da versão anterior; não há dados reais |
| XP total e para o próximo nível | Igual | a tabela embutida bate com o vídeo (nível 12) |
| HP do Lorde Goblin nível 8 | Igual | 170; a fórmula para outros chefes de tier 1 é inferida |
| HP de monstros comuns | Próximo | 32 para o Rato nível 4 (no vídeo ficou em ≈27); sem mais pontos |
| Fórmula de dano | Igual (um ponto) | o ataque básico do vídeo (22) bate com a fórmula embutida |

## Menus e telas fora do mundo

| Elemento | Estado | Observação |
|---|---|---|
| Inventário (categorias, busca, detalhes do item) | Próximo | |
| Menu principal | Falta | faltam `Aparência`, `Caminhos Arcanos` (função desconhecida) e `Feitos` |
| Opções | Próximo | aba Jogabilidade igual ao vídeo, com joystick, modo canhoto e FPS funcionando; câmera livre/invertida e as outras abas não foram vistas |
| Título | Próximo | o original tem cartões Jogar/Reinos/Loja/Opções; o clone mantém o formulário |
| Codex | Próximo | |
| Loja de Runas, Aparência | Falta | no original vendem pacotes por dinheiro real; não serão reproduzidos |

## O que não é possível

- **Mapa, tiles, arte de cenário e trilha sonora originais.** Estão no cliente comercial. Extraí-los para empacotar num clone seria copiar material protegido, e eu não faço isso. O que dá para fazer é recriar o *estilo* (paleta, proporções, tipo de vila, disposição da interface) com arte e layout próprios, guiado por capturas.
- **Fórmulas e probabilidades do servidor.** Não são públicas. Onde o clone usa um valor aproximado, ele continua marcado como adaptação.
- **"100% idêntico".** Mesmo com todo o material de referência, o limite é "muito parecido em aparência e comportamento", não cópia.

## Próximos passos, em ordem

1. Topo do caminho de Valhalla (níveis 1–25) e a tela de seguidores.
2. Menu principal: `Aparência`, `Caminhos Arcanos` e `Feitos` (precisa saber o que fazem).
3. Combate: menus de habilidades e itens abertos, e combate em grupo.
4. Dentro de Loton e de outra cidade, andando devagar (confere os layouts das vilas).
