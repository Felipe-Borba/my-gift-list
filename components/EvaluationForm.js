import { useState } from "react";

import Alert from "components/Alert.js";
import { ClassificationBadge } from "components/Badge.js";
import Button from "components/Button.js";
import Card from "components/Card.js";
import Input from "components/Input.js";
import Select from "components/Select.js";
import Stack from "components/Stack.js";

function EvaluationForm({
  students = [],
  initialValues = {},
  lockedStudentLabel,
  computePreview,
  submitting = false,
  error,
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState({
    student_username: initialValues.student_username || "",
    height: initialValues.height ?? "",
    weight: initialValues.weight ?? "",
  });

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(values);
  }

  const preview =
    values.height && values.weight
      ? computePreview(Number(values.height), Number(values.weight))
      : null;

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          {lockedStudentLabel ? (
            <Input label="Aluno" value={lockedStudentLabel} disabled readOnly />
          ) : (
            <Select
              label="Aluno"
              required
              value={values.student_username}
              onChange={(event) =>
                setField("student_username", event.target.value)
              }
            >
              <option value="" disabled>
                Selecione um aluno
              </option>
              {students.map((student) => (
                <option key={student.username} value={student.username}>
                  {student.name} ({student.username})
                </option>
              ))}
            </Select>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Altura (m)"
              type="number"
              required
              step="0.01"
              min="0.3"
              max="2.5"
              placeholder="1.70"
              value={values.height}
              onChange={(event) => setField("height", event.target.value)}
            />
            <Input
              label="Peso (kg)"
              type="number"
              required
              step="0.1"
              min="1"
              max="500"
              placeholder="80.5"
              value={values.weight}
              onChange={(event) => setField("weight", event.target.value)}
            />
          </div>

          {preview && Number.isFinite(preview.bmi) && (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <p className="text-sm text-text-muted">
                IMC calculado:{" "}
                <strong className="text-text">{preview.bmi.toFixed(2)}</strong>
              </p>
              <ClassificationBadge classification={preview.classification} />
            </div>
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
              Salvar avaliação
            </Button>
          </div>
        </Stack>
      </form>
    </Card>
  );
}

export default EvaluationForm;
