import { useCallback, useEffect, useState } from "react";

import usersService from "services/users.js";

function useUsers({ role, enabled = true } = {}) {
  const [reloadFlag, setReloadFlag] = useState(0);
  const [result, setResult] = useState({ key: null, users: [], error: null });

  const requestKey = enabled ? `${role ?? ""}|${reloadFlag}` : null;

  const refetch = useCallback(() => setReloadFlag((flag) => flag + 1), []);

  useEffect(() => {
    if (!requestKey) return;

    let cancelled = false;

    usersService
      .list({ role })
      .then((rows) => {
        if (!cancelled)
          setResult({ key: requestKey, users: rows, error: null });
      })
      .catch((requestError) => {
        if (!cancelled) {
          setResult({ key: requestKey, users: [], error: requestError });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey, role]);

  const isCurrent = result.key === requestKey;

  return {
    users: isCurrent ? result.users : [],
    loading: Boolean(requestKey) && !isCurrent,
    error: isCurrent ? result.error : null,
    refetch,
  };
}

export default useUsers;
