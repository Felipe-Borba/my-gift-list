import { useRouter } from "next/router";

import Alert from "components/Alert.js";
import Layout from "components/Layout.js";
import PageShell from "components/PageShell.js";
import { FullPageSpinner } from "components/Spinner.js";
import UserForm from "components/UserForm.js";
import useMutation from "hooks/useMutation.js";
import useRequireAuth from "hooks/useRequireAuth.js";
import useUser from "hooks/useUser.js";
import usersService from "services/users.js";

export default function EditUserPage() {
  const router = useRouter();
  const { username } = router.query;
  const { user, loading, logout } = useRequireAuth({
    blockRoles: ["student"],
  });
  const {
    user: targetUser,
    loading: loadingTarget,
    error,
  } = useUser(user ? username : null);
  const updateUser = useMutation((values) =>
    usersService.update(username, values),
  );

  if (loading || !user || (loadingTarget && !error)) {
    return <FullPageSpinner />;
  }

  const isAdmin = user.role === "admin";
  const allowedRoles = isAdmin ? ["student", "teacher", "admin"] : ["student"];

  async function handleSubmit(values) {
    const payload = {
      name: values.name,
      username: values.username,
      role: values.role,
      active: values.active,
    };

    if (values.password) {
      payload.password = values.password;
    }

    try {
      await updateUser.run(payload);
      router.push("/users");
    } catch {
      // erro exibido no formulário pelo estado do useMutation
    }
  }

  return (
    <Layout user={user} onLogout={logout}>
      <PageShell>
        <PageShell.Header
          title={`Editar ${targetUser?.name ?? "usuário"}`}
          subtitle="Altere os dados, o perfil ou a situação do usuário."
        />
        <PageShell.Content>
          {error && (
            <Alert
              tone="danger"
              message={error.message}
              action={error.action}
            />
          )}

          {targetUser && (
            <UserForm
              initialValues={targetUser}
              allowedRoles={allowedRoles}
              showActive
              submitting={updateUser.loading}
              error={updateUser.error}
              onSubmit={handleSubmit}
              onCancel={() => router.push("/users")}
            />
          )}
        </PageShell.Content>
      </PageShell>
    </Layout>
  );
}
