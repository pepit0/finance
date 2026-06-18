import type { CrmHeaderLogoAlign, CrmHeaderTitleAlign } from "../../utils/crmControlStyle";

type CrmBrandingMiniPreviewProps = {
  headerTitle: string;
  headerSubtitle: string;
  headerIconSrc: string;
  headerLogoAlign?: CrmHeaderLogoAlign;
  headerTitleAlign?: CrmHeaderTitleAlign;
};

export function CrmBrandingMiniPreview({
  headerTitle,
  headerSubtitle,
  headerIconSrc,
  headerLogoAlign = "default",
  headerTitleAlign = "left"
}: CrmBrandingMiniPreviewProps) {
  const title = headerTitle.trim() || "CRM";
  const subtitle = headerSubtitle.trim();
  const brandLayoutClass =
    headerLogoAlign === "default" ? " crmThemeMiniPreviewBrandLayout-default" : "";
  const markAlignClass =
    headerLogoAlign === "default" ? "" : ` crmThemeMiniPreviewMarkAlign-${headerLogoAlign}`;

  return (
    <aside className="crmThemeMiniPreviewAside" aria-label="CRM appearance preview">
      <p className="loginLabel crmThemeMiniPreviewHeading">Live preview</p>
      <div className="crmThemeMiniPreview" aria-hidden="true">
        <div className="crmThemeMiniPreviewFrame">
          <div className="crmThemeMiniPreviewShell">
            <div className="crmThemeMiniPreviewTopBar">
              <div className={`crmThemeMiniPreviewBrand${brandLayoutClass}`}>
                <img
                  src={headerIconSrc}
                  alt=""
                  className={`crmThemeMiniPreviewMark${markAlignClass}`}
                  decoding="async"
                />
                <div className={`crmThemeMiniPreviewBrandText crmThemeMiniPreviewTitleAlign-${headerTitleAlign}`}>
                  <span className="crmThemeMiniPreviewTitle">{title}</span>
                  {subtitle ? <span className="crmThemeMiniPreviewSubtitle">{subtitle}</span> : null}
                </div>
              </div>
              <div className="crmThemeMiniPreviewTopActions">
                <span className="crmThemeMiniPreviewAlert">!</span>
                <span className="crmThemeMiniPreviewAlert">⚙</span>
              </div>
            </div>
            <nav className="crmThemeMiniPreviewTabRow">
              <span className="crmThemeMiniPreviewTab crmThemeMiniPreviewTabActive">Customers</span>
              <span className="crmThemeMiniPreviewTab">Team</span>
            </nav>
            <div className="crmThemeMiniPreviewPanel">
              <div className="crmThemeMiniPreviewPanelHead">
                <span className="crmThemeMiniPreviewPanelTitle">Customers</span>
                <span className="crmThemeMiniPreviewBtn">Add</span>
              </div>
              <div className="crmThemeMiniPreviewSkeleton">
                <span className="crmThemeMiniPreviewSkeletonLine" />
                <span className="crmThemeMiniPreviewSkeletonLine" />
                <span className="crmThemeMiniPreviewSkeletonLine crmThemeMiniPreviewSkeletonLineShort" />
              </div>
              <div className="crmThemeMiniPreviewPanelFoot">
                <span className="crmThemeMiniPreviewBtnSecondary">Cancel</span>
                <span className="crmThemeMiniPreviewBtn">Save</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
