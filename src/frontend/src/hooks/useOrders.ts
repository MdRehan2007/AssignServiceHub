import { useAuth } from "@/hooks/useAuth";
import { createOrder, getOrders, updateOrderStatus } from "@/services/api";
import type { Order } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetMyOrders() {
  const { user } = useAuth();
  return useQuery<Order[]>({
    queryKey: ["orders", user?.id],
    queryFn: () => getOrders(user?.id ?? "cust_1"),
    enabled: !!user,
    staleTime: 0,
    refetchInterval: 15000,
  });
}

export function useGetAllOrders() {
  return useQuery<Order[]>({
    queryKey: ["orders", "all"],
    queryFn: () => getOrders("all"),
    staleTime: 0,
    refetchInterval: 15000,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: Partial<Order>) =>
      createOrder({
        ...data,
        customerId: user?.id ?? "cust_1",
        customerName: user?.name ?? "Customer",
        customerEmail: user?.email ?? "",
        college: user?.college,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order["status"] }) =>
      updateOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
