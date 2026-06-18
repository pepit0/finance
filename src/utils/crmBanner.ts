export type CrmBannerTone = "error" | "success";

export type CrmBannerState = {
  message: string;
  tone: CrmBannerTone;
};

export function crmBannerClassName(tone: CrmBannerTone = "error", extraClassName?: string): string {
  const classes = ["crmBanner"];
  if (tone === "success") {
    classes.push("crmBannerSuccess");
  }
  if (extraClassName) {
    classes.push(extraClassName);
  }
  return classes.join(" ");
}

export function crmErrorBanner(message: string): CrmBannerState {
  return { message, tone: "error" };
}

export function crmSuccessBanner(message: string): CrmBannerState {
  return { message, tone: "success" };
}
