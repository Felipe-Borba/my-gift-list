import { useRouter } from "next/router";

import Alert from "components/Alert.js";
import EvaluationForm from "components/EvaluationForm.js";
import Layout from "components/Layout.js";
import PageShell from "components/PageShell.js";
import { FullPageSpinner } from "components/Spinner.js";
import useEvaluation from "hooks/useEvaluation.js";
import useMutation from "hooks/useMutation.js";
import useRequireAuth from "hooks/useRequireAuth.js";
import bmi from "models/bmi.js";
import evaluationsService from "services/evaluations.js";

function computePreview(height, weight) {
  const bmiValue = bmi.calculate(height, weight);
  return { bmi: bmiValue, classification: bmi.classify(bmiValue) };
}

export default function EditEvaluationPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading, logout } = useRequireAuth({
    blockRoles: ["student"],
  });
  const {
    evaluation,
    loading: loadingEvaluation,
    error,
  } = useEvaluation(user ? id : null);
  const updateEvaluation = useMutation((values) =>
    evaluationsService.update(id, values),
  );

  if (loading || !user || (loadingEvaluation && !error)) {
    return <FullPageSpinner />;
  }

  async function handleSubmit(values) {
    try {
      await updateEvaluation.run({
        height: Number(values.height),
        weight: Number(values.weight),
      });
      router.push("/evaluations");
    } catch {
      // erro exibido no formulário pelo estado do useMutation
    }
  }

  return (
    <Layout user={user} onLogout={logout}>
      <PageShell>
        <PageShell.Header
          title="Editar avaliação"
          subtitle="Ajuste altura e peso — o IMC e a classificação são recalculados."
        />
        <PageShell.Content>
          {error && (
            <Alert
              tone="danger"
              message={error.message}
              action={error.action}
            />
          )}

          {evaluation && (
            <EvaluationForm
              initialValues={evaluation}
              lockedStudentLabel={`${evaluation.student_name} (${evaluation.student_username})`}
              computePreview={computePreview}
              submitting={updateEvaluation.loading}
              error={updateEvaluation.error}
              onSubmit={handleSubmit}
              onCancel={() => router.push("/evaluations")}
            />
          )}
        </PageShell.Content>
      </PageShell>
    </Layout>
  );
}
