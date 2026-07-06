import "../styles.css";
import { mountPage } from "../layout";
import { renderPortfolio } from "../sections";
import { siteConfig } from "../site.config";

mountPage([renderPortfolio()], {
  title: `Portfolio · ${siteConfig.productName}`,
  description: "Projects built by Feath · websites and business solutions for clients and our own products."
});
