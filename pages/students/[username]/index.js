import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import Alert from "components/Alert.js";
import Badge, { ClassificationBadge } from "components/Badge.js";
import Layout from "components/Layout.js";
import PageShell from "components/PageShell.js";
import { FullPageSpinner } from "components/Spinner.js";
import Table from "components/Table.js";
import useEvaluations from "hooks/useEvaluations.js";
import useRequireAuth from "hooks/useRequireAuth.js";
import useUser from "hooks/useUser.js";

const EvolutionChart = dynamic(() => import("components/EvolutionChart.js"), {
  ssr: false,
});

export default function StudentEvolutionPage() {
  const router = useRouter();
  const { username } = router.query;
  const { user, loading, logout } = useRequireAuth();
  const { user: student, error: studentError } = useUser(
    user ? username : null,
  );
  const {
    evaluations,
    loading: loadingEvaluations,
    error,
  } = useEvaluations({
    student: username,
    enabled: Boolean(user && username),
  });

  if (loading || !user) return <FullPageSpinner />;

  const pageError = studentError || error;

  return (
    <Layout user={user} onLogout={logout}>
      <PageShell>
        <PageShell.Header
          title={student ? `Evolução de ${student.name}` : "Evolução do aluno"}
          subtitle="Histórico das avaliações de IMC, da mais recente à mais antiga."
          actions={
            student && (
              <Badge tone={student.active ? "success" : "neutral"}>
                {student.active ? "Ativo" : "Inativo"}
              </Badge>
            )
          }
        />

        <PageShell.Content>
          {pageError && (
            <Alert
              tone="danger"
              message={pageError.message}
              action={pageError.action}
            />
          )}

          {!pageError && !loadingEvaluations && evaluations.length >= 2 && (
            <EvolutionChart evaluations={evaluations} />
          )}

          {!pageError && (
            <Table>
              <Table.Head>
                <Table.Column>Data</Table.Column>
                <Table.Column>Altura</Table.Column>
                <Table.Column>Peso</Table.Column>
                <Table.Column>IMC</Table.Column>
                <Table.Column>Classificação</Table.Column>
                <Table.Column>Avaliador</Table.Column>
              </Table.Head>
              <Table.Body>
                {loadingEvaluations && (
                  <Table.Empty colSpan={6}>Carregando…</Table.Empty>
                )}

                {!loadingEvaluations && evaluations.length === 0 && (
                  <Table.Empty colSpan={6}>
                    Nenhuma avaliação registrada para este aluno ainda.
                  </Table.Empty>
                )}

                {!loadingEvaluations &&
                  evaluations.map((row) => (
                    <Table.Row key={row.id}>
                      <Table.Cell>
                        {new Date(row.created_at).toLocaleDateString("pt-BR")}
                      </Table.Cell>
                      <Table.Cell>{row.height.toFixed(2)} m</Table.Cell>
                      <Table.Cell>{row.weight} kg</Table.Cell>
                      <Table.Cell>{row.bmi.toFixed(2)}</Table.Cell>
                      <Table.Cell>
                        <ClassificationBadge
                          classification={row.classification}
                        />
                      </Table.Cell>
                      <Table.Cell>{row.evaluator_name}</Table.Cell>
                    </Table.Row>
                  ))}
              </Table.Body>
            </Table>
          )}
        </PageShell.Content>
      </PageShell>
    </Layout>
  );
}
