import { useState } from "react";

function useMutation(mutationFunction) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function run(...args) {
    setLoading(true);
    setError(null);

    try {
      return await mutationFunction(...args);
    } catch (mutationError) {
      setError(mutationError);
      throw mutationError;
    } finally {
      setLoading(false);
    }
  }

  return { run, loading, error };
}

export default useMutation;
