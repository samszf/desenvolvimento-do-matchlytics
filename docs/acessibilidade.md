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

Executados `pnpm typecheck`, `pnpm test` e `pnpm build` após as alterações. Também foi feita auditoria estática dos landmarks e destinos. Playwright já estava instalado; nesta etapa foi adicionada a configuração `playwright.config.ts` e `@axe-core/playwright` para auditoria automatizada. `e2e/accessibility.spec.ts` cobre axe em `/sign-in`, `/sign-up` e 404, labels e autocomplete de autenticação, skip link, foco e overflow mobile, além do redirecionamento sem autenticação das rotas protegidas. O axe falha apenas para violações críticas/graves no gate do teste; isso não equivale a conformidade WCAG completa.

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

O gráfico de K/D mantém a linha e os valores, além da descrição textual existente para leitores de tela.

## Tabelas e gráficos auditados

- A comparação CT/TR em `/matches/[id]` usa `<table>`, `<caption>`, cabeçalho com `scope="col"` e métricas com `scope="row"`. A região de rolagem horizontal recebe foco e nome acessível no mobile, sem duplicar a tabela.
- `KDChart` mantém os dados reais recebidos pelo dashboard, identifica o gráfico por título e descrição, nomeia os eixos Partida e K/D e marca a camada SVG como decorativa para evitar anúncios duplicados. O controle “Consultar dados do gráfico em tabela” expõe uma alternativa com exatamente os pontos de K/D disponíveis.
- `/analysis` já utilizava tabela semântica para a comparação CT/TR; `/maps` e `/insights` exibem métricas e textos diretamente, sem gráficos adicionais que exigissem uma alternativa tabular.
- Vitória, derrota, CT, TR e séries não dependem apenas de cor: recebem texto ou cabeçalhos explícitos.

A validação automatizada desta etapa inclui `pnpm typecheck`, `pnpm test` e `pnpm build`. A revisão de teclado, leitor de tela e breakpoints mobile foi feita estaticamente e deve ser repetida manualmente no navegador; Playwright e axe-core não estão configurados no projeto.

## Formulários, mensagens e estados de interação

Foram auditados login/cadastro, registro manual de partidas, importação de demos, seleção de jogador e edição do perfil. Os campos usam labels associados por `htmlFor`/`id`, nomes acessíveis, foco visível e indicação textual de campos obrigatórios quando aplicável; placeholders permanecem apenas como exemplos.

O formulário de autenticação agora anuncia envio em andamento com `role="status"`, bloqueia envios duplicados, oferece mostrar/ocultar senha com `aria-pressed` e nome acessível, associa mensagens de erro com `aria-describedby` e mantém erros de e-mail duplicado e credenciais inválidas compreensíveis.

O registro de partida anuncia salvamento, usa `aria-busy`, `role="alert"` para falhas e botão de envio explícito. A importação anuncia arquivo selecionado, envio/análise, sucesso, erro e salvamento; aplica `aria-busy`, impede ações concorrentes, associa o seletor de jogador ao texto de ajuda e identifica o jogador selecionado via `role="radio"`/`aria-checked`.

Não foram criados modais novos. A auditoria automatizada agora usa `@axe-core/playwright`; a validação de componentes continua fora do escopo. A revisão manual com teclado, leitor de tela e mensagens nativas de validação deve continuar antes de declarar conformidade WCAG 2.2 AA.

## Auditoria E2E automatizada

A configuração criada em `playwright.config.ts` define projetos desktop Chromium (1366×768) e mobile WebKit (390×844), com `@axe-core/playwright`. `e2e/accessibility.spec.ts` cobre as páginas públicas `/`, `/sign-in`, `/sign-up` e 404, além de testar labels, autocomplete, skip link, foco visual, ausência de overflow horizontal e redirecionamento das rotas autenticadas sem sessão. Cada execução axe anexa o JSON completo da auditoria ao teste, incluindo `description`, `help`, `helpUrl`, HTML, `target`, `failureSummary` e resultados `any`/`all`/`none` de cada nó.

O relatório identificou `aria-required-children` na página inicial porque filtros visuais estavam marcados como `tablist` sem tabs/painéis correspondentes. Eles foram corrigidos para um grupo de botões com `aria-pressed`, sem ARIA de tabs indevida. Os textos pequenos da prévia da home que usavam `#738094` foram promovidos para `#8995a5`, preservando a paleta escura e elevando o contraste normal acima de 4,5:1 nos fundos da dashboard. Os contrastes de autenticação e 404 foram revisados contra os fundos efetivamente renderizados; não foram adicionadas exceções ao axe.

O teste de foco agora respeita a ordem real skip link → Matchlytics início → e-mail, captura os estilos do campo antes do terceiro Tab, confirma foco por teclado sem foco programático e verifica mudança de `borderColor`, `outline` ou `boxShadow`, mantendo o teste de overflow em 390×844. As APIs `/api/statistics/maps` e `/api/insights` também têm teste explícito de HTTP 401 sem sessão.

O workflow instala Chromium e WebKit. O CI agora inicia PostgreSQL 16 descartável em `127.0.0.1:5432`, executa `pnpm db:init:test` com o schema real (tabelas Better Auth e domínio da aplicação), define `BETTER_AUTH_URL` e usa o secret GitHub `BETTER_AUTH_SECRET_TEST` (com fallback marcado exclusivamente para CI), sem reutilizar produção. Nenhuma credencial de produção é usada ou impressa. O `SELECT 1` no Neon do ambiente atual também passou; isso não substitui o banco isolado do CI.

Os testes unitários e build já passaram: `pnpm typecheck`, `pnpm test` (3 arquivos, 13 testes) e `pnpm build`. A suíte E2E deve ser executada pelo GitHub Actions com as dependências do sistema instaladas; a tentativa local anterior ficou bloqueada por `libnspr4.so` ausente. As rotas protegidas agora têm infraestrutura para validar o redirecionamento real sem sessão; o conteúdo autenticado continua fora da auditoria sem uma conta de teste válida. O axe não comprova conformidade completa, e continuam pendentes leitor de tela, zoom/reflow, teclado completo, diálogos caso sejam adicionados e revisão humana dos contrastes dinâmicos.

## Lista de jogadores na importação

No desktop, a apresentação mantém a organização em colunas para Jogador, Time, Kills, Deaths, Assists, Headshots, K/D e HS%. Em telas menores, cada jogador mantém a mesma linha de seleção, mas exibe um card de largura total com todas as oito informações visíveis: Nome, Time, Kills, Deaths, Assists, Headshots, K/D e HS%. Nenhuma métrica é ocultada por responsividade e não há uma segunda tabela duplicada na árvore de acessibilidade.

Cada jogador é um botão com `role="radio"`, `aria-checked`, nome acessível contendo as estatísticas e foco visível. O grupo anuncia a quantidade de jogadores encontrados; o jogador ativo recebe a indicação textual “Jogador selecionado”. A seleção continua usando o estado existente `player`, portanto o preview e `selectedPlayer` continuam atualizando imediatamente.

Foram considerados os breakpoints de 320px, 375px, 390px, 768px, 1024px e desktop. A validação automatizada deve incluir `pnpm typecheck`, `pnpm test` e `pnpm build`; testes com demo real, teclado e leitor de tela dependem do ambiente e devem ser confirmados manualmente antes de declarar conformidade completa.

A distinção de estados não depende apenas de cor: seleção, erro e foco também possuem estado visual/semântico ou mensagem textual. Esta auditoria cobre as combinações identificadas no tema escuro; não declara conformidade completa com WCAG 2.2 AA nem substitui testes manuais com usuários e ferramentas especializadas.
