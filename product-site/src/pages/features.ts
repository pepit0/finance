import "../styles.css";
import { mountPage } from "../layout";
import { renderFeatures } from "../sections";
import { siteConfig } from "../site.config";

mountPage([renderFeatures()], {
  title: `Features · ${siteConfig.productName}`,
  description: "Customer pipeline, calls, SMS, team permissions, and white-label branding for independent dealers."
});
