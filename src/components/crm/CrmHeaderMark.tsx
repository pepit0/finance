import {
  CRM_DEFAULT_HEADER_ICON_SRC,
  isBuiltinFeathHeaderIconPath
} from "../../utils/crmBrandingAssets";
import { CrmFeathHeaderMark } from "./CrmFeathHeaderMark";

type CrmHeaderMarkProps = {
  headerIconPath: string | null;
  headerIconSrc?: string;
  className?: string;
};

export function CrmHeaderMark({ headerIconPath, headerIconSrc, className }: CrmHeaderMarkProps) {
  if (isBuiltinFeathHeaderIconPath(headerIconPath)) {
    return <CrmFeathHeaderMark className={className} />;
  }

  return (
    <img
      src={headerIconSrc ?? CRM_DEFAULT_HEADER_ICON_SRC}
      alt=""
      className={className}
      decoding="async"
    />
  );
}
