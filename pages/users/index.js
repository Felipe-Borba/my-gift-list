import { useState } from "react";

import Alert from "components/Alert.js";
import Badge from "components/Badge.js";
import Button from "components/Button.js";
import ButtonGroup from "components/ButtonGroup.js";
import Layout from "components/Layout.js";
import Modal from "components/Modal.js";
import PageShell from "components/PageShell.js";
import { FullPageSpinner } from "components/Spinner.js";
import Stack from "components/Stack.js";
import Table from "components/Table.js";
import TextLink from "components/TextLink.js";
import useMutation from "hooks/useMutation.js";
import useRequireAuth from "hooks/useRequireAuth.js";
import useUsers from "hooks/useUsers.js";
import usersService from "services/users.js";

const ROLE_LABELS = {
  admin: "Administrador",
  teacher: "Professor",
  student: "Aluno",
};

export default function UsersPage() {
  const { user, loading, logout } = useRequireAuth({
    blockRoles: ["student"],
  });
  const {
    users,
    loading: loadingUsers,
    error,
    refetch,
  } = useUsers({
    enabled: Boolean(user),
  });
  const [userToDelete, setUserToDelete] = useState(null);
  const toggleActive = useMutation((target) =>
    usersService.update(target.username, { active: !target.active }),
  );
  const removeUser = useMutation((target) =>
    usersService.remove(target.username),
  );

  if (loading || !user) return <FullPageSpinner />;

  const isAdmin = user.role === "admin";
  const title = isAdmin ? "Usuários" : "Alunos";

  async function handleToggleActive(target) {
    await toggleActive.run(target);
    refetch();
  }

  async function handleDelete() {
    try {
      await removeUser.run(userToDelete);
      setUserToDelete(null);
      refetch();
    } catch {
      // erro exibido no modal pelo estado do useMutation
    }
  }

  return (
    <Layout user={user} onLogout={logout}>
      <PageShell>
        <PageShell.Header
          title={title}
          subtitle={
            isAdmin
              ? "Cadastre e gerencie administradores, professores e alunos."
              : "Cadastre e gerencie os alunos da academia."
          }
          actions={
            <Button href="/users/new">
              {isAdmin ? "Novo usuário" : "Novo aluno"}
            </Button>
          }
        />

        <PageShell.Content>
          {error && (
            <Alert
              tone="danger"
              message={error.message}
              action={error.action}
            />
          )}
          {toggleActive.error && (
            <Alert
              tone="danger"
              message={toggleActive.error.message}
              action={toggleActive.error.action}
            />
          )}

          <Table>
            <Table.Head>
              <Table.Column>Nome</Table.Column>
              <Table.Column>Usuário</Table.Column>
              <Table.Column>Perfil</Table.Column>
              <Table.Column>Situação</Table.Column>
              <Table.Column>Ações</Table.Column>
            </Table.Head>
            <Table.Body>
              {loadingUsers && (
                <Table.Empty colSpan={5}>Carregando…</Table.Empty>
              )}

              {!loadingUsers && users.length === 0 && (
                <Table.Empty colSpan={5}>
                  Nenhum usuário cadastrado ainda. Clique em &quot;
                  {isAdmin ? "Novo usuário" : "Novo aluno"}&quot; para começar.
                </Table.Empty>
              )}

              {!loadingUsers &&
                users.map((row) => (
                  <Table.Row key={row.id}>
                    <Table.Cell>
                      {row.role === "student" ? (
                        <TextLink href={`/students/${row.username}`}>
                          {row.name}
                        </TextLink>
                      ) : (
                        row.name
                      )}
                    </Table.Cell>
                    <Table.Cell>{row.username}</Table.Cell>
                    <Table.Cell>
                      <Badge>{ROLE_LABELS[row.role]}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={row.active ? "success" : "neutral"}>
                        {row.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <ButtonGroup>
                        <Button
                          variant="ghost"
                          href={`/users/${row.username}/edit`}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleToggleActive(row)}
                          loading={toggleActive.loading}
                        >
                          {row.active ? "Inativar" : "Ativar"}
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost-danger"
                            onClick={() => setUserToDelete(row)}
                          >
                            Excluir
                          </Button>
                        )}
                      </ButtonGroup>
                    </Table.Cell>
                  </Table.Row>
                ))}
            </Table.Body>
          </Table>
        </PageShell.Content>
      </PageShell>

      <Modal open={Boolean(userToDelete)} onClose={() => setUserToDelete(null)}>
        <Modal.Title>Excluir usuário</Modal.Title>
        <Modal.Description>
          Tem certeza que deseja excluir “{userToDelete?.name}”? Esta ação não
          pode ser desfeita. Usuários com avaliações vinculadas não podem ser
          excluídos — nesse caso, inative-o.
        </Modal.Description>
        <Stack gap={4}>
          {removeUser.error && (
            <Alert
              tone="danger"
              message={removeUser.error.message}
              action={removeUser.error.action}
            />
          )}
          <Modal.Actions>
            <Button variant="secondary" onClick={() => setUserToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={removeUser.loading}
            >
              Excluir
            </Button>
          </Modal.Actions>
        </Stack>
      </Modal>
    </Layout>
  );
}
