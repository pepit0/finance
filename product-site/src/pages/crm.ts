import "../styles.css";
import { mountPage } from "../layout";
import { renderCrm } from "../sections";
import { siteConfig } from "../site.config";

mountPage([renderCrm()], {
  title: `CRM · ${siteConfig.productName}`,
  description: "Feath CRM · pipeline, calls, team permissions, custom add-ons, and white-label branding for your business."
});
