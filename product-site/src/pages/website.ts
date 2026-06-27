import "../styles.css";
import "../website-customizer.css";
import { mountPage } from "../layout";
import { renderWebsite } from "../sections";
import { siteConfig } from "../site.config";

mountPage([renderWebsite()], {
  title: `Website · ${siteConfig.productName}`,
  description: `Custom business websites from ${siteConfig.productName} — standalone brochure sites or fully integrated with our CRM for leads and contact forms.`
});
