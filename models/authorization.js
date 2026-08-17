function canManageUser(actor, targetRole) {
  if (actor.role === "admin") {
    return true;
  }

  if (actor.role === "teacher") {
    return targetRole === "student";
  }

  return false;
}

function canDeleteUser(actor) {
  return actor.role === "admin";
}

function canListUsers(actor) {
  return actor.role === "admin" || actor.role === "teacher";
}

function canReadUser(actor, targetUser) {
  if (actor.id === targetUser.id) {
    return true;
  }

  if (actor.role === "admin") {
    return true;
  }

  if (actor.role === "teacher") {
    return targetUser.role === "student";
  }

  return false;
}

function canCreateEvaluation(actor) {
  return actor.role === "admin" || actor.role === "teacher";
}

function canUpdateEvaluation(actor, evaluation) {
  if (actor.role === "admin") {
    return true;
  }

  return actor.role === "teacher" && evaluation.evaluator_id === actor.id;
}

function canDeleteEvaluation(actor) {
  return actor.role === "admin";
}

const authorization = {
  canManageUser,
  canDeleteUser,
  canListUsers,
  canReadUser,
  canCreateEvaluation,
  canUpdateEvaluation,
  canDeleteEvaluation,
};

export default authorization;
