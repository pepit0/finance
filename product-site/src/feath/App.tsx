import { Navigate, Route, Routes } from "react-router-dom";
import { Footer } from "./Footer";
import { Nav } from "./Nav";
import { AboutPage } from "./pages/AboutPage";
import { BookPage } from "./pages/BookPage";
import { CRMPage } from "./pages/CRMPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { PricingPage } from "./pages/PricingPage";
import { WebsitePage } from "./pages/WebsitePage";
import { ThemeProvider } from "./ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Nav />
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
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/pricing/" element={<PricingPage />} />
          <Route path="/contact" element={<BookPage />} />
          <Route path="/contact/" element={<BookPage />} />
        </Routes>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
