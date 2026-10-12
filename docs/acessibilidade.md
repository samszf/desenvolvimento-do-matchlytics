# Auditoria de acessibilidade

## Escopo

Foram revisados os padrões globais de foco, o salto para o conteúdo principal, navegação, menu móvel da página inicial, importação de demos, seleção de jogador, gráfico de K/D e landmarks das telas principais.

## Correções aplicadas

- Adicionado `lang="pt-BR"` no documento e link "Pular para o conteúdo principal".
- Criado foco visível consistente com `:focus-visible`, contorno e anel de alto contraste.
- Adicionados `id="main-content"` às telas principais revisadas.
- Menu móvel passou a expor `aria-expanded`, `aria-controls` e fechamento por Escape.
- Controles que não alternam painéis deixaram de usar semântica de abas incorreta e usam `aria-pressed`.
- Gráfico de K/D recebeu título, descrição textual com valores reais e nome acessível.
- Importação passou a comunicar carregamento, aplicar `aria-busy`, nomear o campo de arquivo e expor erros como alerta.
- A seleção de jogador recebeu `required` e `aria-invalid`.

## Verificação executada

- `pnpm typecheck`
- `pnpm build`
- Verificação manual no preview da tela de importação e navegação visual.

## Limitações

Não foi executada uma auditoria completa com axe-core nem uma revisão manual de todas as combinações de contraste, leitor de tela, zoom e todas as rotas autenticadas nesta etapa. Portanto, este documento não declara conformidade completa com WCAG 2.2 AA. Ainda é recomendável executar testes com axe-core/Playwright e validar os fluxos autenticados com teclado e leitor de tela.

Os cálculos, parser, banco, autenticação e regras de negócio não foram alterados.
