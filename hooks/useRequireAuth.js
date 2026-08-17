import { useRouter } from "next/router";
import { useEffect } from "react";

import useCurrentUser from "hooks/useCurrentUser.js";
import sessionsService from "services/sessions.js";

function useRequireAuth({ blockRoles = [] } = {}) {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (blockRoles.includes(user.role)) {
      router.replace("/");
    }
    // blockRoles vem de literais nas páginas; a identidade muda a cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, router, blockRoles.join(",")]);

  async function logout() {
    try {
      await sessionsService.logout();
    } finally {
      router.replace("/login");
    }
  }

  const allowed = user && !blockRoles.includes(user.role);

  return { user: allowed ? user : null, loading, logout };
}

export default useRequireAuth;
