import "../styles.css";
import { mountPage } from "../layout";
import { renderContact } from "../sections";
import { siteConfig } from "../site.config";

mountPage([renderContact()], {
  title: `Book a consultation · ${siteConfig.productName}`,
  description: `Book a consultation with ${siteConfig.productName} · websites, CRM, or custom business solutions.`
});
