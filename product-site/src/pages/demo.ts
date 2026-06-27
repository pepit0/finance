import "../styles.css";
import { mountPage } from "../layout";
import { renderDemo } from "../sections";
import { siteConfig } from "../site.config";

mountPage([renderDemo()], {
  title: `Book live demo · ${siteConfig.productName}`,
  description:
    `Schedule a video call. We'll share our screen and walk you through ${siteConfig.productName} and how it benefits your dealership.`
});
