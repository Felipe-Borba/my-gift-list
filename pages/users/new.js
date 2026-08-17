import { useRouter } from "next/router";

import Layout from "components/Layout.js";
import PageShell from "components/PageShell.js";
import { FullPageSpinner } from "components/Spinner.js";
import UserForm from "components/UserForm.js";
import useMutation from "hooks/useMutation.js";
import useRequireAuth from "hooks/useRequireAuth.js";
import usersService from "services/users.js";

export default function NewUserPage() {
  const router = useRouter();
  const { user, loading, logout } = useRequireAuth({
    blockRoles: ["student"],
  });
  const createUser = useMutation(usersService.create);

  if (loading || !user) return <FullPageSpinner />;

  const isAdmin = user.role === "admin";
  const allowedRoles = isAdmin ? ["student", "teacher", "admin"] : ["student"];

  async function handleSubmit(values) {
    try {
      await createUser.run({
        name: values.name,
        username: values.username,
        password: values.password,
        role: values.role,
      });
      router.push("/users");
    } catch {
      // erro exibido no formulário pelo estado do useMutation
    }
  }

  return (
    <Layout user={user} onLogout={logout}>
      <PageShell>
        <PageShell.Header
          title={isAdmin ? "Novo usuário" : "Novo aluno"}
          subtitle="Preencha os dados de acesso e o perfil."
        />
        <PageShell.Content>
          <UserForm
            allowedRoles={allowedRoles}
            requirePassword
            submitting={createUser.loading}
            error={createUser.error}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/users")}
          />
        </PageShell.Content>
      </PageShell>
    </Layout>
  );
}
