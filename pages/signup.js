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

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signup = useMutation(async () => {
    await httpClient.post("/users", { email, password });
    await httpClient.post("/sessions", { email, password });
  });

  async function handleSubmit(event) {
    event.preventDefault();
    await signup.run();
    router.push("/share");
  }

  return (
    <PageShell>
      <PageShell.Header
        title="Criar conta"
        subtitle="Necessário para compartilhar sua lista com outras pessoas."
      />
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
              {signup.error && (
                <Alert
                  tone="danger"
                  message={signup.error.message}
                  action={signup.error.action}
                />
              )}
              <Button type="submit" loading={signup.loading}>
                Criar conta
              </Button>
            </Stack>
          </form>
        </Card>
      </PageShell.Content>
    </PageShell>
  );
}
