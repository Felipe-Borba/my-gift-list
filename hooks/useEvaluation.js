import { useEffect, useState } from "react";

import evaluationsService from "services/evaluations.js";

function useEvaluation(id) {
  const [result, setResult] = useState({
    key: null,
    evaluation: null,
    error: null,
  });

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    evaluationsService
      .getById(id)
      .then((row) => {
        if (!cancelled) setResult({ key: id, evaluation: row, error: null });
      })
      .catch((requestError) => {
        if (!cancelled) {
          setResult({ key: id, evaluation: null, error: requestError });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const isCurrent = result.key === id;

  return {
    evaluation: isCurrent ? result.evaluation : null,
    loading: Boolean(id) && !isCurrent,
    error: isCurrent ? result.error : null,
  };
}

export default useEvaluation;
