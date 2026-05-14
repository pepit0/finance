import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { CrmAccessGate } from "./components/CrmAccessGate";
import { LoginScreen } from "./components/LoginScreen";
import { supabase } from "./lib/supabase";
import { fetchUserHasCrmAccess } from "./lib/crmAccess";
import { FinanceDashboardPage } from "./pages/FinanceDashboardPage";

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

  useEffect(() => {
    document.title = location.pathname.startsWith("/crm") ? "CRM" : "Car Finance Dashboard";
  }, [location.pathname]);

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
      navigate(`${location.pathname}${location.search}`, { replace: true });
      return null;
    },
    [location.pathname, location.search, navigate]
  );

  if (!authReady) {
    return <div className="loginScreenLoading">Checking session...</div>;
  }

  if (!session?.user) {
    return <LoginScreen onSignIn={signIn} />;
  }

  return (
    <Routes>
      <Route
        path="/crm"
        element={
          <CrmAccessGate
            resolved={crmAccess.resolved}
            allowed={crmAccess.allowed}
            rpcError={crmAccess.rpcError}
            onNavigateHome={() => navigate("/")}
          />
        }
      />
      <Route path="/" element={<FinanceDashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RoutedApp />
    </BrowserRouter>
  );
}
