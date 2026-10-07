import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Footer } from "./Footer";
import { Nav } from "./Nav";
import { AboutPage } from "./pages/AboutPage";
import { BookPage } from "./pages/BookPage";
import { CRMPage } from "./pages/CRMPage";
import { CookiesPage } from "./pages/CookiesPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { SharePage } from "./pages/SharePage";
import { TermsPage } from "./pages/TermsPage";
import { TrainingPage } from "./pages/TrainingPage";
import { ViewPage } from "./pages/ViewPage";
import { WebsitePage } from "./pages/WebsitePage";
import { ThemeProvider } from "./ThemeContext";
import { usePageMeta } from "./hooks/usePageMeta";

function AppShell() {
  const { pathname } = useLocation();
  usePageMeta();
  const normalized = pathname.replace(/\/$/, "") || "/";
  const hideChrome = normalized === "/view" || normalized.startsWith("/view/") || normalized.startsWith("/v/");

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {!hideChrome && <Nav />}
      <Routes>
        <Route path="/" element={<WebsitePage />} />
        <Route path="/website" element={<Navigate to="/" replace />} />
        <Route path="/website/" element={<Navigate to="/" replace />} />
        <Route path="/crm" element={<CRMPage />} />
        <Route path="/crm/" element={<CRMPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/portfolio/" element={<PortfolioPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/about/" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/privacy/" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/terms/" element={<TermsPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/cookies/" element={<CookiesPage />} />
        <Route path="/contact" element={<BookPage />} />
        <Route path="/contact/" element={<BookPage />} />
        <Route path="/share" element={<SharePage />} />
        <Route path="/share/" element={<SharePage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/training/" element={<TrainingPage />} />
        <Route path="/view" element={<ViewPage />} />
        <Route path="/view/" element={<ViewPage />} />
        <Route path="/view/:shareId" element={<ViewPage />} />
        <Route path="/v/:shareId" element={<ViewPage />} />
      </Routes>
      {!hideChrome && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
