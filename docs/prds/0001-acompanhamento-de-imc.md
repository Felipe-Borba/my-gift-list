# PRD 0001 — Sistema de acompanhamento de IMC (MVP)

- **Status:** implementado
- **Autor:** Claude (agente), a partir de `docs/Teste para Desenvolvedor Full Stack.pdf`
- **Data:** 2026-07-04
- **Aprovado por / em:** Felipe Borba / 2026-07-04
- **RFC relacionado:** [RFC 0001](../rfcs/0001-stack-padrao.md) (stack); autenticação exigirá RFC próprio antes da implementação

## Problema

Uma academia precisa acompanhar a evolução do IMC (Índice de Massa Corporal) dos seus alunos. Hoje não há sistema: professores realizam avaliações físicas e não existe onde registrá-las nem como o aluno consultar seu histórico. O escopo vem do teste técnico da Sooro (`docs/Teste para Desenvolvedor Full Stack.pdf`), com prazo de entrega de 7 dias.

## Objetivo e métrica de sucesso

Entregar uma aplicação web funcional em que o ciclo completo acontece sem intervenção técnica: administrador cadastra usuários, professor registra avaliações e aluno consulta sua evolução. Sucesso = todos os critérios de aceitação abaixo verificados de ponta a ponta.

## Requisitos

- [x] **Must:** Autenticação com usuário e senha para os três perfis (administrador, professor, aluno). Usuário inativo não consegue acessar o sistema.
- [x] **Must:** Cadastro de usuários com perfil administrador, professor ou aluno (nome, usuário único, senha, perfil, situação ativo/inativo).
- [x] **Must:** Ativar ou inativar um usuário.
- [x] **Must:** Exclusão de usuário — permitida apenas se ele não tiver avaliações vinculadas (como avaliador ou como aluno).
- [x] **Must:** Cadastro de avaliação de IMC de um aluno a partir de altura e peso; o sistema calcula o IMC e **grava** a classificação conforme a tabela abaixo.
- [x] **Must:** Aluno inativo não pode receber novas avaliações.
- [x] **Must:** Consulta de avaliações com filtro por aluno ou por professor (avaliador), respeitando as permissões por perfil.
- [x] **Must:** Permissões por perfil conforme a matriz abaixo.
- [x] **Nice:** Visualização gráfica da evolução do IMC do aluno ao longo do tempo (a consulta em lista ordenada por data já atende o Must).

### Tabela de classificação do IMC

| IMC                | Classificação      |
| ------------------ | ------------------ |
| menor que 18.5     | Abaixo do peso     |
| 18.5 a menos de 25 | Peso normal        |
| 25 a menos de 30   | Sobrepeso          |
| 30 a menos de 35   | Obesidade grau I   |
| 35 a menos de 40   | Obesidade grau II  |
| 40 ou mais         | Obesidade grau III |

_(O PDF define as faixas com uma casa decimal — ex.: "18.5 – 24.9"; os intervalos acima fecham os vãos entre faixas, ex.: IMC 24.95.)_

### Matriz de permissões

| Ação                      | Administrador                   | Professor                   | Aluno              |
| ------------------------- | ------------------------------- | --------------------------- | ------------------ |
| Cadastrar/editar usuários | qualquer perfil                 | apenas alunos               | —                  |
| Excluir usuários          | sim (sem avaliações vinculadas) | —                           | —                  |
| Ativar/inativar usuários  | qualquer perfil                 | apenas alunos (via edição)  | —                  |
| Cadastrar avaliações      | sim                             | sim                         | —                  |
| Editar avaliações         | qualquer uma                    | apenas as que ele registrou | —                  |
| Excluir avaliações        | sim                             | —                           | —                  |
| Consultar avaliações      | de qualquer aluno               | dos seus alunos             | apenas as próprias |

### Decisões assumidas (validar na aprovação)

O PDF deixa pontos em aberto; assumimos o seguinte:

1. **"Alunos do professor"** = alunos que possuem ao menos uma avaliação registrada por ele (não há vínculo professor–aluno no modelo de dados do PDF). O professor enxerga todas as avaliações desses alunos.
2. **Professor edita apenas as avaliações que ele mesmo registrou** (o PDF não restringe; restringir é o mais seguro).
3. **Não há auto-cadastro**: todo usuário é criado por um administrador (ou aluno criado por professor). O primeiro administrador nasce por seed/migration.
4. **Avaliações registram quem avaliou**: administrador também pode ser avaliador ao cadastrar uma avaliação.

## Fora de escopo

- Stack/tecnologias da seção 6 do PDF (TypeScript, Express, TypeORM, Chakra etc.) — tratadas à parte; conflitam com o [RFC 0001](../rfcs/0001-stack-padrao.md).
- Recuperação/troca de senha por e-mail, verificação de e-mail.
- Auto-cadastro de usuários.
- Outras medidas antropométricas além de altura/peso; anexos, fotos, observações.
- Relatórios exportáveis (PDF/CSV), notificações.

## Fluxo do usuário

1. **Administrador** faz login → cadastra um professor e um aluno.
2. **Professor** faz login → cadastra a avaliação do aluno (altura, peso) → sistema calcula IMC 27.8 e grava "Sobrepeso".
3. **Professor** consulta a lista de avaliações filtrada por aquele aluno e acompanha a evolução.
4. **Aluno** faz login → vê apenas suas próprias avaliações, da mais recente à mais antiga.
5. **Administrador** inativa o aluno → o aluno não consegue mais logar e o professor não consegue registrar nova avaliação para ele.

## Critérios de aceitação

- [x] Dado um usuário ativo com credenciais válidas, quando faz login, então acessa o sistema com as permissões do seu perfil.
- [x] Dado um usuário inativo, quando tenta fazer login, então o acesso é negado com mensagem clara.
- [x] Dado um administrador, quando cadastra um usuário com perfil e dados válidos, então o usuário aparece na listagem e consegue logar.
- [x] Dado um cadastro com `usuario` já existente, quando submetido, então o sistema recusa com erro de validação.
- [x] Dado um professor, quando cadastra uma avaliação com altura 1.70 m e peso 80 kg, então o sistema grava IMC 27.68 com classificação "Sobrepeso".
- [x] Cada faixa da tabela de classificação produz a classificação correta (um caso de teste por faixa, incluindo os limites 18.5, 25, 30, 35 e 40).
- [x] Dado um aluno inativo, quando alguém tenta registrar avaliação para ele, então o sistema recusa.
- [x] Dado um administrador, quando exclui um usuário sem avaliações, então ele é removido; quando o usuário tem avaliações vinculadas, então a exclusão é recusada.
- [x] Dado um professor, quando consulta avaliações, então vê apenas as dos seus alunos (decisão assumida nº 1); não consegue ver avaliações de alunos de outros professores.
- [x] Dado um aluno, quando consulta avaliações, então vê somente as próprias.
- [x] Dado um aluno, quando tenta cadastrar/editar qualquer usuário ou avaliação (inclusive via API direta), então recebe erro de autorização.
- [x] A consulta de avaliações filtra por aluno e por professor (avaliador).

## Riscos e dependências

- **Autenticação e modelo de sessão exigem RFC** antes da implementação (WORKFLOW, regra 2) — o DER do PDF sugere refresh tokens (`usuario_token`), a decidir no RFC.
- **Modelagem do banco** (adaptação do DER do PDF ao Postgres/convenções) será registrada junto — RFC de auth ou migration comentada.
- **Conflito de stack com a seção 6 do PDF**: se a entrega do teste exigir a stack pedida à risca, será preciso um RFC revisando o RFC 0001. Decisão adiada por escolha do dono do projeto.
- Prazo do teste: 7 dias a partir do recebimento.
