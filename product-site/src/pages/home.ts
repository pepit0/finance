import "../styles.css";
import { mountPage } from "../layout";
import { renderCompanyHome } from "../sections";
import { siteConfig } from "../site.config";

mountPage([renderCompanyHome()], {
  title: `${siteConfig.productName} · ${siteConfig.companyTagline}`,
  description: siteConfig.description
});
