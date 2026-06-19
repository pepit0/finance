import "../styles.css";
import { mountPage } from "../layout";
import { renderAddOns } from "../sections";
import { siteConfig } from "../site.config";

mountPage([renderAddOns()], {
  title: `Add-ons · ${siteConfig.productName}`,
  description:
    "Extend Berry CRM with call & text, dealer websites, and DMS — connected add-ons built for independent dealers."
});

