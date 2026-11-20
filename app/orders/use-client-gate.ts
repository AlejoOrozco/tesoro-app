"use client";

import { loginPath } from "@/lib/return-path";
import { isClient } from "@/lib/roles";
import { readSessionGate } from "@/lib/session-gate";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type ClientGate =
  | { readonly status: "loading" }
  | { readonly status: "denied" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ready" };

export function useClientGate(apiOriginUrl: string, returnPath: string): ClientGate {
  const router = useRouter();
  const [gate, setGate] = useState<ClientGate>({ status: "loading" });

  useEffect(() => {
    let isCurrent = true;
    void readSessionGate(apiOriginUrl).then((result) => {
      if (!isCurrent) return;
      if (result.status === "unauthorized") {
        router.replace(loginPath(returnPath));
        return;
      }
      if (result.status === "error") {
        setGate(result);
        return;
      }
      setGate(isClient(result.role) ? { status: "ready" } : { status: "denied" });
    });
    return () => {
      isCurrent = false;
    };
  }, [apiOriginUrl, returnPath, router]);

  return gate;
}
