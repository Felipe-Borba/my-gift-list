# RFC 0003 — Design de telas e estilização

- **Status:** implementado
- **Autor:** Claude (agente)
- **Data:** 2026-07-04
- **Aprovado por / em:** Felipe Borba / 2026-07-04
- **PRD relacionado:** [PRD 0001](../prds/0001-acompanhamento-de-imc.md)

## Contexto e problema

O PRD 0001 define o quê; falta fixar como o frontend será construído: abordagem de estilização (dependência estrutural — exige RFC pelo RFC 0001), mapa de telas, navegação por perfil e linguagem visual. Sem isso, cada tela sairia com um padrão diferente. O prazo de 7 dias do teste pesa a favor de ferramentas que acelerem a construção de forms e tabelas sem sacrificar a qualidade percebida — front-end é critério explícito de avaliação.

## Decisão proposta

### Abordagem: design system first (leve)

A implementação do frontend segue **design system first na versão leve** — sem Storybook, sem versionamento de tokens, mas com fases e uma regra dura:

1. **Fase 1 — design system antes de qualquer tela:** tokens (cores, tipografia, espaçamento) + componentes base em `components/` (Button, Input, Select, Table, Badge, Modal de confirmação, Layout autenticado e primitivos de layout como PageShell/Stack), cada um com seus estados completos (hover, foco visível, desabilitado, erro, carregando) **e acessibilidade resolvida nos estruturais** — Modal com focus trap, `aria-modal`, fechar com Esc e devolução do foco; navegação por teclado em tudo que é interativo. Retrofitar a11y é o retrabalho mais caro de um design system; entra na definição de pronto da fase 1.
2. **Vitrine em `/design-system`:** página simples do próprio Next.js (dev-only, fora do build de produção) exibindo todos os componentes e estados de uma vez — é onde o design system é validado visualmente antes das telas existirem.
3. **Regra de composição — não há CSS solto fora de `components/`:** classes utilitárias do Tailwind e qualquer estilização vivem **exclusivamente** dentro de `components/`. Páginas em `pages/` não estilizam, compõem componentes; se uma página precisa de um arranjo novo, isso vira um componente (ou variante) primeiro. Única exceção: `styles/globals.css`, restrito ao import do Tailwind, reset e definição de tokens.
4. **Convenção de API dos componentes — composição em vez de configuração:** componentes estruturais (`Table`, `Modal`, `PageShell`, `Layout`) expõem **compound components/slots** (`Table.Head`, `Table.Row`, `Table.Cell`, `Modal.Title`…), compartilhando estado implícito via Context quando necessário — casos fora do padrão se resolvem no ponto de uso, sem inflar o componente com props. Componentes-folha (`Button`, `Input`, `Select`, `Badge`) ficam como componente simples com poucas props (`tone`, `disabled`…), onde compound seria cerimônia sem ganho.
5. **Componentes puramente apresentacionais:** nada de `fetch`, import de `models/` ou regra de negócio dentro de `components/` — dados e callbacks entram por props; quem conhece o domínio é a página. É o que mantém a evolução futura para um design system completo (extração em pacote compartilhado entre projetos) sem cirurgia.
6. **Só classes derivadas de tokens:** nenhum hex hardcoded nem valor mágico de espaçamento/tipografia dentro de componentes — tudo referencia os tokens de `styles/globals.css`. Mudança de token deve alcançar todos os componentes sem caça manual.
7. **Responsividade é requisito de cada componente, não das telas:** mobile-first, com o comportamento em tela estreita definido na fase 1 — `Table` colapsa para cards ou rolagem horizontal contida no próprio componente, `Modal` ocupa a tela no mobile, alvos de toque com no mínimo 44px, navegação do Layout colapsável. A vitrine `/design-system` é conferida em viewport mobile e desktop antes de qualquer tela ser construída.
8. **UI/UX orienta a fase 1:** hierarquia visual clara (uma ação primária por tela), feedback imediato para toda ação (estado de carregamento no próprio botão ao submeter, confirmação visível de sucesso, erros exibindo `message` + `action`), formulários com validação inline e foco levado ao primeiro erro, e o preview do IMC calculado enquanto o professor digita — o design system nasce para servir esses comportamentos, não só para parecer consistente.

A partir da fase 1, as telas do mapa abaixo saem por composição — o que garante a consistência visual entre elas (users e evaluations compartilham o mesmo esqueleto de lista + form).

### Estilização: Tailwind CSS

- **Tailwind CSS v4** via PostCSS (`@tailwindcss/postcss`), sem runtime em produção — utilitários gerados no build.
- Tokens de design definidos no tema (CSS custom properties em `styles/globals.css`, importado em `pages/_app.js`): paleta neutra (cinzas) + uma cor de destaque para ações primárias, tipografia system-ui, tema claro único.
- **Cores semânticas para a classificação do IMC** (badge na lista e no gráfico): Abaixo do peso azul, Peso normal verde, Sobrepeso amarelo, Obesidade I/II/III laranja→vermelho.
- Componentes compartilhados em `components/` (novo diretório de primeiro nível — Button, Input, Select, Table, Badge, Modal de confirmação, Layout autenticado). CONVENTIONS.md ganha essa pasta — junto com `services/` e `hooks/` — na estrutura ao implementar.
- Formulários com estado controlado do React — **sem** react-hook-form por ora; se a complexidade justificar depois, será outro RFC. Acesso a dados segue a camada de services/hooks abaixo.

### Gráfico de evolução: Recharts

- Gráfico de linha (IMC × data) na visão de evolução do aluno, com faixas de classificação ao fundo e tooltip por avaliação. Atende o item Nice do PRD 0001.

### Acesso a dados no frontend: services + hooks

Duas camadas isolam as telas do transporte HTTP, espelhando a regra de composição do CSS:

- **`services/`** — `httpClient.js` é o **único** arquivo que conhece o transporte (fetch nativo: base `/api/v1`, JSON, cookies, normalização de erros para o contrato `message`/`action`); módulos por recurso o consomem (`services/users.js`, `services/evaluations.js`, `services/sessions.js`) expondo funções como `usersService.create(data)`.
- **`hooks/`** — um hook por caso de uso de dados (`useUsers`, `useEvaluations`, `useCreateEvaluation`, `useSession`…), encapsulando o ciclo dados/carregando/erro/refetch por cima dos services.

**Regra: tela não chama `fetch` — tela chama hook; hook chama service; só o `httpClient` conhece o transporte.** Consequências desejadas:

- Trocar fetch por axios = editar apenas `httpClient.js`.
- Mockar dados = mockar os services nos testes (ou MSW na camada de rede, se vier a ser útil).
- Se cache/invalidação/dedupe entre telas se tornarem necessidade, o upgrade é React Query **dentro dos hooks** (telas intactas) — dependência estrutural, logo RFC próprio; reinventar isso à mão nos hooks é o sinal de parada.

### Mapa de telas

Rotas de página em inglês (identificadores de código), textos de UI em português:

| Rota                                         | Tela                                                                                                                                  | Acesso                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `/login`                                     | Form usuário/senha; erro claro para credencial inválida ou usuário inativo                                                            | pública                                         |
| `/` (redireciona)                            | Envia ao destino do perfil: admin/professor → `/evaluations`; aluno → sua própria evolução                                            | autenticado                                     |
| `/users`                                     | Lista com filtro por perfil/situação, badge ativo/inativo; ações novo/editar/ativar-inativar/excluir conforme a matriz do PRD         | admin (todos), professor (só alunos)            |
| `/users/new`, `/users/[username]/edit`       | Form: nome, usuário, senha, perfil, situação                                                                                          | admin; professor (só alunos)                    |
| `/evaluations`                               | Lista com filtros por aluno e por professor; colunas altura, peso, IMC, classificação (badge), avaliador, data; ações conforme matriz | todos os perfis (escopo por permissão)          |
| `/evaluations/new`, `/evaluations/[id]/edit` | Form: aluno, altura, peso — IMC e classificação calculados e exibidos ao digitar (preview)                                            | admin, professor                                |
| `/students/[username]`                       | Evolução do aluno: gráfico Recharts + tabela do histórico                                                                             | admin, professor (seus alunos), o próprio aluno |

### Estados e layout

- Layout autenticado comum: header com nome do sistema, nome + perfil do usuário logado e botão sair; navegação conforme perfil.
- Toda lista tem estado de carregamento, estado vazio com orientação em português e estado de erro exibindo `message` + `action` do contrato de erros.
- Ações destrutivas (excluir usuário/avaliação, inativar) pedem confirmação em modal.
- Responsivo mobile-first — professor registra avaliação pelo celular no salão; a responsividade vive dentro dos componentes (regra 7 do design system), nunca em ajuste por tela.

### Novas dependências (versões exatas)

`tailwindcss`, `@tailwindcss/postcss`, `recharts`.

## Alternativas consideradas

| Alternativa         | Prós                                              | Contras                                                                 | Por que não                                                          |
| ------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| CSS Modules         | Zero dependência; nativo do Next.js               | Mais lento para construir forms/tabelas consistentes no prazo de 7 dias | Velocidade de entrega pesou; decisão do dono do projeto              |
| Chakra UI           | Sugerido no PDF; componentes prontos e acessíveis | CSS-in-JS com runtime (emotion); dependência estrutural bem maior       | Custo/peso desproporcional ao tamanho da UI                          |
| styled-jsx          | Embutido no Next.js                               | Verboso; sem sistema de tokens/utilitários                              | Produtividade inferior às demais opções                              |
| Gráfico SVG próprio | Zero dependência                                  | Reimplementa eixos, escalas e tooltip                                   | Recharts entrega mais qualidade pelo custo de uma dependência focada |
| Sem gráfico         | Menos escopo                                      | Perde o item Nice que mais comunica "evolução" ao avaliador do teste    | Decisão do dono do projeto de incluir                                |

## Trade-offs e consequências

- Classes utilitárias deixam o JSX mais verboso — contido pela regra de composição: utilitários só existem dentro de `components/`.
- Design system first cobra um custo inicial (a fase 1 não entrega tela nenhuma) em troca de telas quase mecânicas depois — aposta adequada a 7 telas com esqueleto repetido.
- Evoluir para o design system **completo** (Storybook, documentação de variantes, regressão visual, tokens versionados) é trabalho aditivo graças às regras 4–6; a vitrine `/design-system` seria substituída pelo Storybook nesse upgrade (perda pequena e aceita). O comprometimento profundo é o Tailwind: trocar de abordagem de estilização depois seria reescrita real dos componentes.
- Duas dependências estruturais novas (Tailwind, Recharts) ficam registradas aqui; Recharts só é carregado na tela de evolução (import dinâmico se o bundle pesar).
- Tema claro único: modo escuro fica de fora desta versão.
- `components/` passa a existir fora do que CONVENTIONS.md documenta hoje — o documento será atualizado no commit da implementação.

## Impacto no código existente

- `postcss.config.mjs` novo; `styles/globals.css` novo importado por `pages/_app.js` (novo).
- Diretórios novos de primeiro nível: `components/`, `services/` e `hooks/` (CONVENTIONS.md atualizado no commit da implementação).
- `pages/index.js` atual (placeholder) vira o redirecionamento por perfil.
- Nenhuma mudança em backend/infra; o RFC 0002 segue como está.

### Notas da implementação (2026-07-04)

- Além dos componentes listados, a regra "nenhum CSS fora de `components/`" exigiu primitivos extras: `Grid`, `ButtonGroup`, `TextLink`, `AuthShell`, `Card`, `Spinner`.
- `Modal` usa `<dialog>` nativo — focus trap, Esc e devolução de foco vêm do navegador.
- O plugin `@eslint/css` não entende a sintaxe do Tailwind v4; `eslint.config.mjs` ganhou um override desligando `css/no-invalid-at-rules` e `css/no-invalid-properties` apenas para `styles/globals.css`.
- Os hooks de dados usam estado derivado por chave de request (sem `setState` síncrono em effect), exigência da regra `react-hooks/set-state-in-effect` do eslint-plugin-react-hooks 7.
- Recharts entra por import dinâmico (`ssr: false`) na tela de evolução; o gráfico aparece a partir de 2 avaliações.
