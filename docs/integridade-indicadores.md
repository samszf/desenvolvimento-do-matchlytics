# Integridade dos indicadores

## Origem dos dados

A importação ativa recebe a demo em armazenamento privado e chama `parseDemo` no servidor (`app/api/matches/import/route.ts`). O parser `@laihoe/demoparser2` usado pelo servidor está instalado em `0.42.0`; sua declaração TypeScript expõe `parseHeader`, `parseEvent`, `parseTicks` e `parsePlayerInfo`. `parseEvent` recebe propriedades adicionais de jogador e de evento, e `parseTicks` aceita ticks e SteamIDs desejados. Não há arquivo `.dem` no projeto para registrar os campos efetivamente retornados pela demo histórica.

Kills, deaths e assists são contados a partir de `player_death`, pelos papéis do evento. Headshots usam o campo `headshot` do evento de morte. A extração geral e por lado é feita em conjunto por `addPlayerEvent`. ADR continua informado manualmente; KAST permanece opcional/manual e não é calculado automaticamente.

## Identidade e lados

SteamID é a identidade canônica. A importação seleciona o jogador pelo SteamID retornado, não pelo nome. Nomes são apenas rótulos. O lado de cada contribuição é resolvido a partir do campo de equipe do papel correspondente no evento ou do `team_num` amostrado no tick do evento; não se deve inferir o lado da vítima ou do assistente a partir do atacante. Eventos sem lado mantêm sua contagem geral, ficam fora de CT/TR e deixam a reconciliação incompleta.

A versão atual não inclui fixtures de demo ou resultados reais dos campos de equipe por participante. A aceitação de eventos com identificadores ambíguos (userid/nome/entity) e a cobertura de mudanças de equipe durante overtime ainda dependem de validação com demos representativas.

## Fórmulas e ausência de dados

- K/D = Kills / Deaths. Com zero deaths, o valor adotado é Kills (evita `NaN` e `Infinity`); se Kills ou Deaths estiver ausente, K/D é indisponível.
- HS% = Headshots / Kills × 100; quando Kills é zero ou os dados necessários faltam, o percentual não é calculado.
- ADR é manual no fluxo de cadastro/importação.
- KAST é opcional/manual; ausência é `null`, não zero.

Zero é uma medição válida quando os eventos foram processados; `null` representa valor indisponível. O parser ainda precisa de uma demo sem dados suficientes para validar de ponta a ponta quando a contagem deve ser `null` em vez de zero.

## Reconciliação

`reconcileMetrics` retorna, para Kills, Deaths, Assists e Headshots: valores geral, CT, TR, soma CT+TR, diferença, origem, status e mensagem. O status é `approved` apenas quando os totais coincidem e não há eventos com lado não resolvido; se houver classificação pendente, o status é `incomplete`, e uma diferença sem pendências é `mismatch`. Essa estrutura é retornada pela análise para diagnóstico e gera advertência quando não aprovada.

Snapshots agregados como `kills_total` e `headshot_kills_total` não foram consultados nesta execução: embora sejam descritos na documentação externa do parser, não foi possível verificar a disponibilidade e a semântica no fixture real da versão instalada sem uma demo. Não se somam snapshots cumulativos.

## Persistência e interface

O formulário de importação envia os valores selecionados sem recalcular K/D/HS. A API grava os inteiros gerais e por lado em `match_statistics`; GET e páginas do histórico leem os campos persistidos. O dashboard e a rota de visão geral usam `lib/analytics.ts`; a página de detalhes e o histórico também exibem K/D localmente. Os testes abaixo garantem o cálculo de origem e uma verificação de ida e volta dos valores, mas não substituem uma integração com PostgreSQL real.

## Testes e limitações

`lib/demo-parser/integrity.test.ts` cobre reconciliação normal, troca de lado, Headshots sintéticos 7+2, zero Headshots, evento sem lado, filtragem por SteamID, zero deaths, dados ausentes e ida e volta de persistência simulada. Uma demo CS2 real ainda é necessária para validar os nomes/campos retornados pelo parser, comparar eventos com snapshots do round e comparar valores concretos entre prévia, banco e histórico.
