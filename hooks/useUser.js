import { useEffect, useState } from "react";

import usersService from "services/users.js";

function useUser(username) {
  const [result, setResult] = useState({ key: null, user: null, error: null });

  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    usersService
      .getByUsername(username)
      .then((row) => {
        if (!cancelled) setResult({ key: username, user: row, error: null });
      })
      .catch((requestError) => {
        if (!cancelled) {
          setResult({ key: username, user: null, error: requestError });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const isCurrent = result.key === username;

  return {
    user: isCurrent ? result.user : null,
    loading: Boolean(username) && !isCurrent,
    error: isCurrent ? result.error : null,
  };
}

export default useUser;
