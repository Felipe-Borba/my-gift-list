// Modelo de autorização por permissões (features) explícitas no usuário,
// inspirado no TabNews: não existe um papel "admin" especial no código —
// o sysadmin é só um usuário com todas as features cadastradas nele
// (ver infra/scripts/seed-admin.js).

const DEFAULT_FEATURES = ["create:session", "read:session", "create:gift-list"];

const ROOT_FEATURES = [...DEFAULT_FEATURES, "create:gift-list:without-payment"];

function can(user, feature) {
  return Boolean(user?.features?.includes(feature));
}

const authorization = {
  DEFAULT_FEATURES,
  ROOT_FEATURES,
  can,
};

export default authorization;
