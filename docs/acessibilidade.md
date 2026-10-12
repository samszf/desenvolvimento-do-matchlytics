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

## Auditoria de contraste WCAG 2.2 AA

As relações abaixo foram calculadas pela fórmula de luminância relativa sRGB da WCAG, usando os valores hexadecimais reais do tema escuro. Texto comum exige 4,5:1; componentes gráficos e indicadores de interface exigem 3:1 quando necessários para identificar o controle.

| Componente | Cor original | Fundo real | Contraste anterior | Nova cor | Contraste novo | Resultado |
|---|---|---:|---:|---|---:|---|
| Texto secundário e metadados | `#8995a5` | `#080b10` | 6,48:1 | `#8995a5` | 6,48:1 | Aprovado |
| Texto de eixo e estados vazios | `#687588` | `#0c1118` | 3,53:1 | `#94a0b1` | 7,14:1 | Corrigido |
| Texto de eixo e metadados | `#687588` | `#111720` | 3,78:1 | `#94a0b1` | 6,79:1 | Corrigido |
| Borda de inputs/cards | `rgba(255,255,255,0.10)` | `#111720` | 1,43:1 | `#5d6d82` | 3,58:1 | Corrigido |
| Borda de inputs/cards | `rgba(255,255,255,0.08)` | `#0c1118` | 1,29:1 | `#5d6d82` | 3,58:1 | Corrigido |
| Link azul | `#7fb0ff` | `#080b10` | 8,97:1 | `#7fb0ff` | 8,97:1 | Aprovado |
| Botão primário | `#ffffff` | `#1d6cff` | 4,52:1 | `#ffffff` | 4,52:1 | Aprovado |
| Indicador de foco | `#8bb8ff` | `#080b10` | 9,76:1 | `#8bb8ff` | 9,76:1 | Aprovado |

A cor `#586476` sobre `#111923` foi medida em 2,95:1 e não é usada como texto após a auditoria; `#738094` sobre o mesmo fundo mede 4,42:1, abaixo de 4,5:1 para texto comum, e também não foi mantida como texto. A correção foi aplicada na origem visual em `globals.css` para as classes compartilhadas `border-white/8` e `border-white/10`, e nos textos de eixo/metadados que usavam `#687588`.

O gráfico de K/D mantém a linha e os valores, além da descrição textual existente para leitores de tela. A distinção de estados não depende apenas de cor: seleção, erro e foco também possuem estado visual/semântico ou mensagem textual. Esta auditoria cobre as combinações identificadas no tema escuro; não declara conformidade completa com WCAG 2.2 AA nem substitui testes manuais com usuários e ferramentas especializadas.
