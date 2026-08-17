import { useState } from "react";

import Alert from "components/Alert.js";
import Button from "components/Button.js";
import Card from "components/Card.js";
import Input from "components/Input.js";
import Select from "components/Select.js";
import Stack from "components/Stack.js";

const ROLE_LABELS = {
  admin: "Administrador",
  teacher: "Professor",
  student: "Aluno",
};

function UserForm({
  initialValues = {},
  allowedRoles,
  requirePassword = false,
  showActive = false,
  submitting = false,
  error,
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState({
    name: initialValues.name || "",
    username: initialValues.username || "",
    password: "",
    role: initialValues.role || allowedRoles[0],
    active: initialValues.active ?? true,
  });

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          <Input
            label="Nome"
            required
            maxLength={60}
            value={values.name}
            onChange={(event) => setField("name", event.target.value)}
          />

          <Input
            label="Usuário"
            required
            maxLength={30}
            hint="Usado para fazer login."
            value={values.username}
            onChange={(event) => setField("username", event.target.value)}
          />

          <Input
            label="Senha"
            type="password"
            required={requirePassword}
            hint={
              requirePassword
                ? undefined
                : "Deixe em branco para manter a senha atual."
            }
            value={values.password}
            onChange={(event) => setField("password", event.target.value)}
          />

          <Select
            label="Perfil"
            required
            disabled={allowedRoles.length === 1}
            value={values.role}
            onChange={(event) => setField("role", event.target.value)}
          >
            {allowedRoles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </Select>

          {showActive && (
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-text">
              <input
                type="checkbox"
                className="size-5 cursor-pointer accent-primary"
                checked={values.active}
                onChange={(event) => setField("active", event.target.checked)}
              />
              Usuário ativo
            </label>
          )}

          {error && (
            <Alert
              tone="danger"
              message={error.message}
              action={error.action}
            />
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              Salvar
            </Button>
          </div>
        </Stack>
      </form>
    </Card>
  );
}

export default UserForm;
