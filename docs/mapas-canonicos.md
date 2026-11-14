# Chaves canônicas de mapas

## Causa da duplicação

O cadastro manual enviava `Mirage`; `POST /api/matches` convertia para `mirage`. O parser devolvia o nome de mapa do cabeçalho da demo (por exemplo `de_mirage`) e a mesma API convertia apenas caixa e espaços, persistindo `de_mirage`. `/api/statistics/maps` agrupava usando `mapId` com hífens trocados por espaços, sem normalizar prefixos técnicos. Por isso `de_mirage` e `mirage` viravam cartões separados. Editar uma partida também usava uma conversão própria.

## Regra e aliases

`lib/maps.ts` é a única fonte de verdade: `normalizeMapName` retorna `key`, `name` e se o alias é conhecido. Comparação ignora caixa, acentos e separadores repetidos. Não há fuzzy matching. Aliases aceitos:

| Chave | Nome exibido | Aliases explícitos |
|---|---|---|
| `mirage` | Mirage | Mirage, de_mirage |
| `inferno` | Inferno | Inferno, de_inferno |
| `ancient` | Ancient | Ancient, de_ancient |
| `nuke` | Nuke | Nuke, de_nuke |
| `dust2` | Dust 2 | Dust 2, dust2, dust_2, dust-2, de_dust2 e variantes separadas |
| `anubis` | Anubis | Anubis, de_anubis |
| `vertigo` | Vertigo | Vertigo, de_vertigo |

Mapas desconhecidos recebem uma chave de slug estável baseada no texto normalizado, sem serem associados a mapas conhecidos. Valores vazios continuam vazios.

## Fluxos e histórico

A chave canônica é aplicada no parser da demo e no backend de criação e edição (`POST/PATCH /api/matches`). `mapId` continua sendo a coluna persistida e passa a guardar `mapKey`; não foi necessário alterar o schema nem criar migration estrutural. A normalização é repetida ao agrupar e ao exibir no histórico, detalhe da partida, Dashboard, Insights e `/maps`, tornando a leitura compatível antes e depois da atualização dos dados antigos.

O histórico é normalizado atualizando exclusivamente `matches.mapId` para aliases conhecidos; IDs de partida, `userId`, datas, placares, estatísticas, ADR e demais colunas ficam intactos. O UPDATE usa `CASE` explícito sobre aliases, ignora valores desconhecidos e não altera chaves já canônicas, portanto pode ser executado novamente sem efeito adicional. Um snapshot Neon é criado antes do backfill.

## Consolidação e métricas

`lib/map-analytics.ts` agrupa por usuário e `mapKey`, com filtros de data inclusivos opcionais. A página `/maps` exibe o nome amigável. Quantidade e vitórias contam as partidas individuais; Win Rate é vitórias/partidas; K/D é soma de kills/soma de deaths (quando deaths é zero, segue `ratio`, que retorna kills, ou zero); ADR permanece a média dos valores manuais disponíveis, ignorando ausências; não há dados de dano/rounds para recalculá-lo. Score é a média de `performanceScore` por partida, preservando a fórmula existente, inclusive seus defaults atuais para Kills, Deaths, ADR e KAST ausentes.

Dashboard e Insights continuam usando agregações compartilhadas e agora usam a mesma normalização de mapa para exibição e agrupamento. O endpoint `/api/statistics/maps` aceita `from` e `to` opcionais e aplica os limites inclusivamente.

## Dados consultados no backfill

Antes da normalização, o Neon consultado tinha `de_mirage`: 9 partidas/9 vitórias; `mirage`: 4 partidas/2 vitórias. Ambas as chaves pertenciam a um único usuário. Portanto, a consolidação efetiva é 13 partidas, 11 vitórias e 84,6% de Win Rate (não os 14 registros do cenário ilustrativo). Os totais consultados para Mirage foram 168 kills e 64 deaths (K/D 2,625), ADR manual médio 67,77 e Score médio 69,08. Nenhuma estatística individual é recalculada ou modificada pelo backfill.
