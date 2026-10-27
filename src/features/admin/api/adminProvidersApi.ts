// Thin wrappers over the admin provider-oversight endpoints (multi-provider-contract.md
// section 6/9): GET /api/admin/providers/status, GET /api/admin/providers/usage. Both are
// behind authMiddleware + requireAdmin server-side; this file adds no client-side gating of
// its own beyond what AdminRoute already does for the page that calls it.
import { http } from "../../../lib/http";
import type { ApiSuccess } from "../../auth/types/auth.types";
import type { AdminProviderStatus, AdminProviderUsage } from "../types/admin.types";

export async function getAdminProvidersStatus(): Promise<AdminProviderStatus[]> {
  const { data } = await http.get<ApiSuccess<{ providers: AdminProviderStatus[] }>>("/admin/providers/status");
  return data.data.providers;
}

export async function getAdminProvidersUsage(): Promise<AdminProviderUsage[]> {
  const { data } = await http.get<ApiSuccess<{ usage: AdminProviderUsage[] }>>("/admin/providers/usage");
  return data.data.usage;
}
