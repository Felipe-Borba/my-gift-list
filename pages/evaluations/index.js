import { useState } from "react";

import Alert from "components/Alert.js";
import { ClassificationBadge } from "components/Badge.js";
import Button from "components/Button.js";
import ButtonGroup from "components/ButtonGroup.js";
import Grid from "components/Grid.js";
import Layout from "components/Layout.js";
import Modal from "components/Modal.js";
import PageShell from "components/PageShell.js";
import Select from "components/Select.js";
import { FullPageSpinner } from "components/Spinner.js";
import Stack from "components/Stack.js";
import Table from "components/Table.js";
import TextLink from "components/TextLink.js";
import useEvaluations from "hooks/useEvaluations.js";
import useMutation from "hooks/useMutation.js";
import useRequireAuth from "hooks/useRequireAuth.js";
import useUsers from "hooks/useUsers.js";
import authorization from "models/authorization.js";
import evaluationsService from "services/evaluations.js";

export default function EvaluationsPage() {
  const { user, loading, logout } = useRequireAuth({
    blockRoles: ["student"],
  });
  const [studentFilter, setStudentFilter] = useState("");
  const [evaluatorFilter, setEvaluatorFilter] = useState("");
  const {
    evaluations,
    loading: loadingEvaluations,
    error,
    refetch,
  } = useEvaluations({
    student: studentFilter || undefined,
    evaluator: evaluatorFilter || undefined,
    enabled: Boolean(user),
  });
  const { users } = useUsers({ enabled: Boolean(user) });
  const [evaluationToDelete, setEvaluationToDelete] = useState(null);
  const removeEvaluation = useMutation((target) =>
    evaluationsService.remove(target.id),
  );

  if (loading || !user) return <FullPageSpinner />;

  const isAdmin = user.role === "admin";
  const students = users.filter((row) => row.role === "student");
  const evaluators = users.filter((row) => row.role !== "student");

  async function handleDelete() {
    try {
      await removeEvaluation.run(evaluationToDelete);
      setEvaluationToDelete(null);
      refetch();
    } catch {
      // erro exibido no modal pelo estado do useMutation
    }
  }

  return (
    <Layout user={user} onLogout={logout}>
      <PageShell>
        <PageShell.Header
          title="Avaliações"
          subtitle="Avaliações de IMC registradas para os alunos."
          actions={<Button href="/evaluations/new">Nova avaliação</Button>}
        />

        <PageShell.Content>
          <Grid columns={2}>
            <Select
              label="Filtrar por aluno"
              value={studentFilter}
              onChange={(event) => setStudentFilter(event.target.value)}
            >
              <option value="">Todos os alunos</option>
              {students.map((student) => (
                <option key={student.username} value={student.username}>
                  {student.name}
                </option>
              ))}
            </Select>

            {isAdmin && (
              <Select
                label="Filtrar por avaliador"
                value={evaluatorFilter}
                onChange={(event) => setEvaluatorFilter(event.target.value)}
              >
                <option value="">Todos os avaliadores</option>
                {evaluators.map((evaluator) => (
                  <option key={evaluator.username} value={evaluator.username}>
                    {evaluator.name}
                  </option>
                ))}
              </Select>
            )}
          </Grid>

          {error && (
            <Alert
              tone="danger"
              message={error.message}
              action={error.action}
            />
          )}

          <Table>
            <Table.Head>
              <Table.Column>Data</Table.Column>
              <Table.Column>Aluno</Table.Column>
              <Table.Column>Avaliador</Table.Column>
              <Table.Column>Altura</Table.Column>
              <Table.Column>Peso</Table.Column>
              <Table.Column>IMC</Table.Column>
              <Table.Column>Classificação</Table.Column>
              <Table.Column>Ações</Table.Column>
            </Table.Head>
            <Table.Body>
              {loadingEvaluations && (
                <Table.Empty colSpan={8}>Carregando…</Table.Empty>
              )}

              {!loadingEvaluations && evaluations.length === 0 && (
                <Table.Empty colSpan={8}>
                  Nenhuma avaliação encontrada. Registre a primeira em
                  &quot;Nova avaliação&quot;.
                </Table.Empty>
              )}

              {!loadingEvaluations &&
                evaluations.map((row) => (
                  <Table.Row key={row.id}>
                    <Table.Cell>
                      {new Date(row.created_at).toLocaleDateString("pt-BR")}
                    </Table.Cell>
                    <Table.Cell>
                      <TextLink href={`/students/${row.student_username}`}>
                        {row.student_name}
                      </TextLink>
                    </Table.Cell>
                    <Table.Cell>{row.evaluator_name}</Table.Cell>
                    <Table.Cell>{row.height.toFixed(2)} m</Table.Cell>
                    <Table.Cell>{row.weight} kg</Table.Cell>
                    <Table.Cell>{row.bmi.toFixed(2)}</Table.Cell>
                    <Table.Cell>
                      <ClassificationBadge
                        classification={row.classification}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <ButtonGroup>
                        {authorization.canUpdateEvaluation(user, row) && (
                          <Button
                            variant="ghost"
                            href={`/evaluations/${row.id}/edit`}
                          >
                            Editar
                          </Button>
                        )}
                        {authorization.canDeleteEvaluation(user) && (
                          <Button
                            variant="ghost-danger"
                            onClick={() => setEvaluationToDelete(row)}
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

      <Modal
        open={Boolean(evaluationToDelete)}
        onClose={() => setEvaluationToDelete(null)}
      >
        <Modal.Title>Excluir avaliação</Modal.Title>
        <Modal.Description>
          Tem certeza que deseja excluir a avaliação de “
          {evaluationToDelete?.student_name}” de{" "}
          {evaluationToDelete &&
            new Date(evaluationToDelete.created_at).toLocaleDateString("pt-BR")}
          ? Esta ação não pode ser desfeita.
        </Modal.Description>
        <Stack gap={4}>
          {removeEvaluation.error && (
            <Alert
              tone="danger"
              message={removeEvaluation.error.message}
              action={removeEvaluation.error.action}
            />
          )}
          <Modal.Actions>
            <Button
              variant="secondary"
              onClick={() => setEvaluationToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={removeEvaluation.loading}
            >
              Excluir
            </Button>
          </Modal.Actions>
        </Stack>
      </Modal>
    </Layout>
  );
}
