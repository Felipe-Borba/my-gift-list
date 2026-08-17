import { useRouter } from "next/router";

import EvaluationForm from "components/EvaluationForm.js";
import Layout from "components/Layout.js";
import PageShell from "components/PageShell.js";
import { FullPageSpinner } from "components/Spinner.js";
import useMutation from "hooks/useMutation.js";
import useRequireAuth from "hooks/useRequireAuth.js";
import useUsers from "hooks/useUsers.js";
import bmi from "models/bmi.js";
import evaluationsService from "services/evaluations.js";

function computePreview(height, weight) {
  const bmiValue = bmi.calculate(height, weight);
  return { bmi: bmiValue, classification: bmi.classify(bmiValue) };
}

export default function NewEvaluationPage() {
  const router = useRouter();
  const { user, loading, logout } = useRequireAuth({
    blockRoles: ["student"],
  });
  const { users } = useUsers({ enabled: Boolean(user) });
  const createEvaluation = useMutation(evaluationsService.create);

  if (loading || !user) return <FullPageSpinner />;

  const activeStudents = users.filter(
    (row) => row.role === "student" && row.active,
  );

  async function handleSubmit(values) {
    try {
      await createEvaluation.run({
        student_username: values.student_username,
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
          title="Nova avaliação"
          subtitle="Informe o aluno, a altura e o peso — o IMC e a classificação são calculados automaticamente."
        />
        <PageShell.Content>
          <EvaluationForm
            students={activeStudents}
            computePreview={computePreview}
            submitting={createEvaluation.loading}
            error={createEvaluation.error}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/evaluations")}
          />
        </PageShell.Content>
      </PageShell>
    </Layout>
  );
}
