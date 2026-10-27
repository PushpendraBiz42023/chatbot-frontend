// Thin wrapper over GET /api/admin/stats (admin-dashboard-contract.md section 1).
import { http } from "../../../lib/http";
import type { ApiSuccess } from "../../auth/types/auth.types";
import type { AdminStats } from "../types/admin.types";

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await http.get<ApiSuccess<AdminStats>>("/admin/stats");
  return data.data;
}
