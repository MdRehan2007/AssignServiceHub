import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export function MyTokenPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/" });
  }, [navigate]);
  return null;
}
