import "../styles.css";
import { mountPage } from "../layout";
import { renderHero } from "../sections";
import { siteConfig } from "../site.config";

mountPage([renderHero()], {
  title: siteConfig.productName,
  description: siteConfig.description
});
