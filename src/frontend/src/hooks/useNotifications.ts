import { useAuth } from "@/hooks/useAuth";
import { getNotifications } from "@/services/api";
import type { Notification } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetNotifications() {
  const { user } = useAuth();
  return useQuery<Notification[]>({
    queryKey: ["notifications", user?.id],
    queryFn: () => getNotifications(user?.id ?? "cust_1"),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function useMarkNotifRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      // Optimistically update cached query data
      qc.setQueryData<Notification[]>(
        ["notifications", user?.id],
        (prev) =>
          prev?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) ?? [],
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useUnreadCount() {
  const { data } = useGetNotifications();
  return data?.filter((n) => !n.isRead).length ?? 0;
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      qc.setQueryData<Notification[]>(
        ["notifications", user?.id],
        (prev) => prev?.map((n) => ({ ...n, isRead: true })) ?? [],
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
