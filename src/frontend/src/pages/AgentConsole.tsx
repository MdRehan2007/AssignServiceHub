import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export function AgentConsolePage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/admin/analytics" });
  }, [navigate]);
  return null;
}
