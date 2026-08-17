import { useEffect, useState } from "react";

import httpClient from "services/httpClient.js";

function useGiftList(shareSlug) {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shareSlug) {
      return;
    }

    let cancelled = false;

    httpClient
      .get(`/gift-lists/${shareSlug}`)
      .then((data) => {
        if (!cancelled) {
          setList(data);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shareSlug]);

  return { list, error, loading };
}

export default useGiftList;
