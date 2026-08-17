import database from "infra/database.js";
import { NotFoundError, ValidationError } from "infra/errors.js";
import bmi from "models/bmi.js";
import user from "models/user.js";

const SELECT_WITH_USERS = `
  SELECT
    evaluations.*,
    students.username AS student_username,
    students.name AS student_name,
    evaluators.username AS evaluator_username,
    evaluators.name AS evaluator_name
  FROM evaluations
  INNER JOIN users students ON students.id = evaluations.student_id
  INNER JOIN users evaluators ON evaluators.id = evaluations.evaluator_id
`;

async function create({ studentUsername, evaluatorId, height, weight }) {
  const { parsedHeight, parsedWeight } = validateMeasurements(height, weight);
  const student = await findEvaluableStudent(studentUsername);

  const bmiValue = bmi.calculate(parsedHeight, parsedWeight);
  const classification = bmi.classify(bmiValue);

  const results = await database.query({
    text: `
      INSERT INTO evaluations (student_id, evaluator_id, height, weight, bmi, classification)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `,
    values: [
      student.id,
      evaluatorId,
      parsedHeight,
      parsedWeight,
      bmiValue,
      classification,
    ],
  });

  return await findOneById(results.rows[0].id);
}

async function findAll({ studentId, evaluatorId, visibleToTeacherId } = {}) {
  const results = await database.query({
    text: `
      ${SELECT_WITH_USERS}
      WHERE
        ($1::uuid IS NULL OR evaluations.student_id = $1)
        AND ($2::uuid IS NULL OR evaluations.evaluator_id = $2)
        AND (
          $3::uuid IS NULL
          OR evaluations.student_id IN (
            SELECT DISTINCT student_id FROM evaluations WHERE evaluator_id = $3
          )
        )
      ORDER BY evaluations.created_at DESC;
    `,
    values: [
      studentId ?? null,
      evaluatorId ?? null,
      visibleToTeacherId ?? null,
    ],
  });

  return results.rows.map(toNumericRow);
}

async function findOneById(id) {
  validateUuid(id);

  const results = await database.query({
    text: `${SELECT_WITH_USERS} WHERE evaluations.id = $1 LIMIT 1;`,
    values: [id],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "A avaliação informada não foi encontrada no sistema.",
      action: "Verifique se o identificador está correto.",
    });
  }

  return toNumericRow(results.rows[0]);
}

async function update(id, { height, weight }) {
  const currentEvaluation = await findOneById(id);

  const { parsedHeight, parsedWeight } = validateMeasurements(
    height ?? currentEvaluation.height,
    weight ?? currentEvaluation.weight,
  );

  const bmiValue = bmi.calculate(parsedHeight, parsedWeight);
  const classification = bmi.classify(bmiValue);

  await database.query({
    text: `
      UPDATE evaluations
      SET height = $2, weight = $3, bmi = $4, classification = $5, updated_at = now()
      WHERE id = $1;
    `,
    values: [id, parsedHeight, parsedWeight, bmiValue, classification],
  });

  return await findOneById(id);
}

async function remove(id) {
  const currentEvaluation = await findOneById(id);

  await database.query({
    text: "DELETE FROM evaluations WHERE id = $1;",
    values: [id],
  });

  return currentEvaluation;
}

async function isStudentOfTeacher(studentId, teacherId) {
  const results = await database.query({
    text: `
      SELECT 1 FROM evaluations
      WHERE student_id = $1 AND evaluator_id = $2
      LIMIT 1;
    `,
    values: [studentId, teacherId],
  });

  return results.rowCount > 0;
}

async function findEvaluableStudent(studentUsername) {
  if (!studentUsername) {
    throw new ValidationError({
      message: 'O campo "student_username" é obrigatório.',
      action: "Informe o aluno da avaliação.",
    });
  }

  const student = await user.findOneByUsername(studentUsername);

  if (student.role !== "student") {
    throw new ValidationError({
      message: "O usuário informado não é um aluno.",
      action: "Avaliações só podem ser registradas para alunos.",
    });
  }

  if (!student.active) {
    throw new ValidationError({
      message: "Não é possível registrar avaliação para um aluno inativo.",
      action: "Reative o aluno antes de registrar novas avaliações.",
    });
  }

  return student;
}

function validateMeasurements(height, weight) {
  const parsedHeight = Number(height);
  const parsedWeight = Number(weight);

  if (
    !Number.isFinite(parsedHeight) ||
    parsedHeight < 0.3 ||
    parsedHeight > 2.5
  ) {
    throw new ValidationError({
      message: "A altura informada é inválida.",
      action: "Informe a altura em metros, entre 0.3 e 2.5 (ex.: 1.70).",
    });
  }

  if (
    !Number.isFinite(parsedWeight) ||
    parsedWeight < 1 ||
    parsedWeight > 500
  ) {
    throw new ValidationError({
      message: "O peso informado é inválido.",
      action: "Informe o peso em quilogramas, entre 1 e 500 (ex.: 80.5).",
    });
  }

  return { parsedHeight, parsedWeight };
}

function validateUuid(id) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(String(id))) {
    throw new NotFoundError({
      message: "A avaliação informada não foi encontrada no sistema.",
      action: "Verifique se o identificador está correto.",
    });
  }
}

function toNumericRow(row) {
  return {
    ...row,
    height: parseFloat(row.height),
    weight: parseFloat(row.weight),
    bmi: parseFloat(row.bmi),
  };
}

const evaluation = {
  create,
  findAll,
  findOneById,
  update,
  remove,
  isStudentOfTeacher,
};

export default evaluation;
