import { useCallback, useEffect, useState } from "react";

import evaluationsService from "services/evaluations.js";

function useEvaluations({ student, evaluator, enabled = true } = {}) {
  const [reloadFlag, setReloadFlag] = useState(0);
  const [result, setResult] = useState({
    key: null,
    evaluations: [],
    error: null,
  });

  const requestKey = enabled
    ? `${student ?? ""}|${evaluator ?? ""}|${reloadFlag}`
    : null;

  const refetch = useCallback(() => setReloadFlag((flag) => flag + 1), []);

  useEffect(() => {
    if (!requestKey) return;

    let cancelled = false;

    evaluationsService
      .list({ student, evaluator })
      .then((rows) => {
        if (!cancelled) {
          setResult({ key: requestKey, evaluations: rows, error: null });
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setResult({ key: requestKey, evaluations: [], error: requestError });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey, student, evaluator]);

  const isCurrent = result.key === requestKey;

  return {
    evaluations: isCurrent ? result.evaluations : [],
    loading: Boolean(requestKey) && !isCurrent,
    error: isCurrent ? result.error : null,
    refetch,
  };
}

export default useEvaluations;
