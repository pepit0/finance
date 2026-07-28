import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { CrmAccessGate } from "./components/CrmAccessGate";
import { LoginScreen } from "./components/LoginScreen";
import { useCrmDocumentTitle } from "./hooks/useCrmDocumentTitle";
import { useCrmLoginTheme } from "./hooks/useCrmLoginTheme";
import { fetchUserHasCrmAccess } from "./lib/crmAccess";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { SupabaseMissing } from "./SupabaseMissing";
import {
  defaultAuthenticatedPath,
  isCrmProduct,
  isCrmRoute,
  isFinanceProduct
} from "./utils/productMode";
import { crmAppUrl, navigateToFinanceHome } from "./utils/productUrls";

const isCrmBuild = import.meta.env.VITE_PRODUCT === "crm";

const FinanceDashboardPage = isCrmBuild
  ? null
  : lazy(() =>
      import("./pages/FinanceDashboardPage").then((module) => ({
        default: module.FinanceDashboardPage
      }))
    );

function FinanceRouteFallback() {
  return <div className="loginScreenLoading">Loading dashboard…</div>;
}

function CrmExternalRedirect() {
  const target = crmAppUrl();

  useEffect(() => {
    if (target) {
      window.location.replace(target);
    }
  }, [target]);

  if (!target) {
    return (
      <main className="crmGateShell" role="main">
        <div className="crmGateCard">
          <h1 className="crmGateTitle">CRM not available</h1>
          <p className="crmGateBody">Set VITE_CRM_APP_URL for this finance-only deployment.</p>
        </div>
      </main>
    );
  }

  return <div className="loginScreenLoading">Opening CRM…</div>;
}

function RoutedApp() {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [crmAccess, setCrmAccess] = useState<{
    resolved: boolean;
    allowed: boolean;
    rpcError: string | null;
  }>({
    resolved: false,
    allowed: false,
    rpcError: null
  });
  const navigate = useNavigate();
  const location = useLocation();

  useCrmDocumentTitle(location.pathname);

  const isCrm = isCrmRoute(location.pathname);
  const loginBranding = useCrmLoginTheme(isCrm, { fetchRemote: authReady && !session?.user });

  useEffect(() => {
    if (isCrmRoute(location.pathname)) {
      return;
    }
    document.title = "Car Finance Dashboard";
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-crm", isCrm);
    if (!isCrm) {
      document.documentElement.classList.remove("theme-crm-light");
    }
    return () => {
      document.documentElement.classList.remove("theme-crm");
      document.documentElement.classList.remove("theme-crm-light");
    };
  }, [isCrm]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const appMetadataKey = session?.user ? JSON.stringify(session.user.app_metadata ?? {}) : "";

  useEffect(() => {
    if (!session?.user) {
      setCrmAccess({ resolved: true, allowed: false, rpcError: null });
      return;
    }

    let cancelled = false;
    setCrmAccess({ resolved: false, allowed: false, rpcError: null });

    fetchUserHasCrmAccess(supabase).then((result) => {
      if (!cancelled) {
        setCrmAccess({
          resolved: true,
          allowed: result.allowed,
          rpcError: result.rpcError
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, appMetadataKey]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return error.message;
      }
      const nextPath =
        location.pathname === "/" && isCrmProduct() ? defaultAuthenticatedPath() : location.pathname;
      navigate(`${nextPath}${location.search}`, { replace: true });
      return null;
    },
    [location.pathname, location.search, navigate]
  );

  const onNavigateFinanceHome = useCallback(() => {
    navigateToFinanceHome(navigate);
  }, [navigate]);

  if (!authReady) {
    return <div className="loginScreenLoading">Checking session...</div>;
  }

  if (!session?.user) {
    return (
      <LoginScreen
        onSignIn={signIn}
        title={isCrm ? loginBranding.headerTitle : undefined}
        subtitle={isCrm ? loginBranding.headerSubtitle : undefined}
      />
    );
  }

  const crmGate = (
    <CrmAccessGate
      resolved={crmAccess.resolved}
      allowed={crmAccess.allowed}
      onNavigateHome={onNavigateFinanceHome}
    />
  );

  const financePage = FinanceDashboardPage ? (
    <Suspense fallback={<FinanceRouteFallback />}>
      <FinanceDashboardPage canAccessCrm={crmAccess.resolved && crmAccess.allowed} />
    </Suspense>
  ) : (
    <FinanceRouteFallback />
  );

  if (isCrmProduct()) {
    return (
      <Routes>
        <Route path="/crm" element={crmGate} />
        <Route path="/" element={<Navigate to="/crm" replace />} />
        <Route path="*" element={<Navigate to="/crm" replace />} />
      </Routes>
    );
  }

  if (isFinanceProduct()) {
    return (
      <Routes>
        <Route path="/" element={financePage} />
        <Route path="/crm" element={<CrmExternalRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/crm" element={crmGate} />
      <Route path="/" element={financePage} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  if (!isSupabaseConfigured()) {
    return <SupabaseMissing />;
  }
  return (
    <BrowserRouter>
      <RoutedApp />
    </BrowserRouter>
  );
}
