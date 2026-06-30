import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "officer" | "responder" | "tourist" | "viewer";

export function useMyRoles() {
  return useQuery({
    queryKey: ["my-roles"],
    queryFn: async (): Promise<AppRole[]> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      if (error) return [];
      return (data ?? []).map((r) => r.role as AppRole);
    },
    staleTime: 60_000,
  });
}

export function useMyUser() {
  return useQuery({
    queryKey: ["my-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
    staleTime: 60_000,
  });
}

export function isStaff(roles: AppRole[] | undefined) {
  if (!roles) return false;
  return roles.some((r) => r === "admin" || r === "officer" || r === "responder");
}
export function isAdmin(roles: AppRole[] | undefined) {
  return !!roles?.includes("admin");
}
export function isResponder(roles: AppRole[] | undefined) {
  return !!roles?.includes("responder");
}
export function isTourist(roles: AppRole[] | undefined) {
  return !!roles?.includes("tourist") || (roles?.length ?? 0) === 0;
}
