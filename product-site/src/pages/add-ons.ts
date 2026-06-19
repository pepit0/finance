import "../styles.css";
import { mountPage } from "../layout";
import { renderAddOns } from "../sections";
import { siteConfig } from "../site.config";

mountPage([renderAddOns()], {
  title: `Custom add-ons · ${siteConfig.productName}`,
  description:
    "Custom CRM add-ons built for your dealership. Integrations, workflows, and tools tailored to how your team actually works."
});

