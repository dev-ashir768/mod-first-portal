import { useAuthStore } from "@/store/useAuthStore";

export interface Permissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const FULL_ACCESS: Permissions = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
};

/**
 * Returns CRUD permissions for a given page slug.
 *
 * Resolution order:
 * 1. super_admin always gets full access.
 * 2. Match menuRight where menu.slug OR menu.link_value equals `slug`.
 * 3. No match found → full access (unguarded page).
 */
export function usePermissions(slug: string): Permissions {
  const user = useAuthStore((s) => s.user);
  const menuRights = useAuthStore((s) => s.menuRights);

  // super_admin bypasses all restrictions
  if (!user || user.role === "super_admin") return FULL_ACCESS;

  const right = menuRights.find(
    (r) =>
      r.menu?.slug === slug ||
      r.menu?.link_value === slug ||
      r.menu?.slug === slug.replace(/^\//, "") ||
      r.menu?.link_value === slug.replace(/^\//, "")
  );

  // No rule configured for this page → allow by default
  if (!right) return FULL_ACCESS;

  return {
    canView: right.can_view,
    canCreate: right.can_create,
    canEdit: right.can_edit,
    canDelete: right.can_delete,
  };
}

/**
 * Returns permissions for ALL menu rights keyed by slug.
 * Used in the sidebar to decide which items to show.
 */
export function useAllPermissions(): Map<string, Permissions> {
  const user = useAuthStore((s) => s.user);
  const menuRights = useAuthStore((s) => s.menuRights);

  const map = new Map<string, Permissions>();

  if (!user || user.role === "super_admin") return map; // empty map = full access for super_admin

  for (const r of menuRights) {
    const slug = r.menu?.slug;
    const linkValue = r.menu?.link_value;
    const perms: Permissions = {
      canView: r.can_view,
      canCreate: r.can_create,
      canEdit: r.can_edit,
      canDelete: r.can_delete,
    };
    if (slug) map.set(slug, perms);
    if (linkValue) map.set(linkValue, perms);
  }

  return map;
}
