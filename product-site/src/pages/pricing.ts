import "../styles.css";
import { mountPage } from "../layout";
import { renderPricing } from "../sections";
import { siteConfig } from "../site.config";

mountPage([renderPricing()], {
  title: `Pricing · ${siteConfig.productName}`,
  description: "Simple, transparent pricing for Berry CRM and dealer add-ons. Plans coming soon."
});

