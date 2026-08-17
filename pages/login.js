import { useRouter } from "next/router";
import { useState } from "react";

import Alert from "components/Alert.js";
import Button from "components/Button.js";
import Card from "components/Card.js";
import Input from "components/Input.js";
import PageShell from "components/PageShell.js";
import Stack from "components/Stack.js";
import useMutation from "hooks/useMutation.js";
import httpClient from "services/httpClient.js";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation(() =>
    httpClient.post("/sessions", { email, password }),
  );

  async function handleSubmit(event) {
    event.preventDefault();
    await login.run();
    router.push("/share");
  }

  return (
    <PageShell>
      <PageShell.Header title="Entrar" />
      <PageShell.Content>
        <Card>
          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {login.error && (
                <Alert
                  tone="danger"
                  message={login.error.message}
                  action={login.error.action}
                />
              )}
              <Button type="submit" loading={login.loading}>
                Entrar
              </Button>
            </Stack>
          </form>
        </Card>
      </PageShell.Content>
    </PageShell>
  );
}
