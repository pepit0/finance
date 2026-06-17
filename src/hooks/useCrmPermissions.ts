import { useCallback, useEffect, useMemo, useState } from "react";
import { resolveCrmDirectoryAdminStatus } from "../lib/crmApi";

export function useCrmPermissions() {
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPermissionsAdmin, setIsPermissionsAdmin] = useState(false);
  const [clientMaster, setClientMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const status = await resolveCrmDirectoryAdminStatus();
    setLoading(false);
    setIsAdmin(status.isAdmin);
    setIsPermissionsAdmin(status.isPermissionsAdmin);
    setClientMaster(status.clientMaster);
    setPermissionKeys(status.permissionKeys);
    setError(status.error);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const permissionSet = useMemo(() => new Set(permissionKeys), [permissionKeys]);

  const hasPermission = useCallback(
    (key: string) => clientMaster || permissionSet.has(key),
    [clientMaster, permissionSet]
  );

  const canManagePermissions = useMemo(
    () => clientMaster || isPermissionsAdmin,
    [clientMaster, isPermissionsAdmin]
  );

  return {
    permissionKeys,
    isAdmin,
    isPermissionsAdmin,
    clientMaster,
    loading,
    error,
    reload,
    hasPermission,
    canManagePermissions
  };
}
