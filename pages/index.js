import { useRouter } from "next/router";
import { useEffect } from "react";

import { FullPageSpinner } from "components/Spinner.js";
import useRequireAuth from "hooks/useRequireAuth.js";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useRequireAuth();

  useEffect(() => {
    if (loading || !user) return;

    if (user.role === "student") {
      router.replace(`/students/${user.username}`);
    } else {
      router.replace("/evaluations");
    }
  }, [loading, user, router]);

  return <FullPageSpinner />;
}
