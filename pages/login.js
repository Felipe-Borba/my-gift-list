import { useRouter } from "next/router";
import { useState } from "react";

import Alert from "components/Alert.js";
import AuthShell from "components/AuthShell.js";
import Button from "components/Button.js";
import Input from "components/Input.js";
import Stack from "components/Stack.js";
import useMutation from "hooks/useMutation.js";
import sessionsService from "services/sessions.js";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { run: login, loading, error } = useMutation(sessionsService.login);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await login({ username, password });
      router.push("/");
    } catch {
      // erro exibido pelo estado do useMutation
    }
  }

  return (
    <AuthShell
      title="IMC Manager"
      subtitle="Acompanhamento de IMC dos alunos da academia"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          <Input
            label="Usuário"
            required
            autoFocus
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <Input
            label="Senha"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && (
            <Alert
              tone="danger"
              message={error.message}
              action={error.action}
            />
          )}

          <Button type="submit" loading={loading} full>
            Entrar
          </Button>
        </Stack>
      </form>
    </AuthShell>
  );
}
