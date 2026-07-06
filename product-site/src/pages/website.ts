import "../styles.css";
import "../feath-website.css";
import { mountPage } from "../layout";
import { renderWebsite } from "../sections";
import { siteConfig } from "../site.config";
import { initWebsiteFigmaReveal } from "../websiteFigmaInteractions";

mountPage([renderWebsite()], {
  title: `Website · ${siteConfig.productName}`,
  description: `AI-integrated custom business websites from ${siteConfig.productName} — capture leads, convert visitors, and connect to our CRM.`
});

initWebsiteFigmaReveal();
