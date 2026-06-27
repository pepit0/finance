import "../styles.css";
import { mountPage } from "../layout";
import { renderContact } from "../sections";
import { siteConfig } from "../site.config";

mountPage([renderContact()], {
  title: `Contact · ${siteConfig.productName}`,
  description: `Get in touch about ${siteConfig.productName} for your dealership.`
});
