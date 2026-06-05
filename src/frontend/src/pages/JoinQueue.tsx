import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export function JoinQueuePage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/customer/place-order" });
  }, [navigate]);
  return null;
}
