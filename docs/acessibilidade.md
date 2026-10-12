# Acessibilidade

## Estrutura

O layout global fornece o link “Pular para o conteúdo principal”, visualmente oculto até receber foco, com destino `#main-content`. As páginas renderizadas possuem um único landmark `<main id="main-content" tabIndex={-1}>`; a navegação global permanece fora do conteúdo principal. Formulários reutilizáveis não criam landmarks próprios.

## Rotas auditadas

- `/`
- `/sign-in`
- `/sign-up`
- `/dashboard`
- `/matches`
- `/matches/new`
- `/matches/import`
- `/matches/[id]`
- `/analysis`
- `/maps`
- `/insights`
- página 404

## Correções realizadas

- Adicionado foco visível consistente para controles interativos.
- Adicionado skip link com contraste e foco persistente.
- Adicionado `main-content` às páginas públicas, autenticadas e 404.
- Navegação global removida de dentro do landmark principal nas páginas que a renderizavam internamente.
- Menu mobile recebeu nome, estado expandido e fechamento por Escape.
- Gráfico de K/D recebeu descrição textual para leitores de tela.

## Verificações

Executados `pnpm typecheck`, `pnpm test` e `pnpm build` após as alterações. Também foi feita auditoria estática dos landmarks e destinos. Não há Playwright nem axe-core configurados no projeto; portanto, a ativação do skip link e a navegação por teclado em navegador ainda devem ser validadas manualmente.

Esta documentação não declara conformidade completa com WCAG 2.2 AA.
