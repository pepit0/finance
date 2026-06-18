import { useId, useRef, useState } from "react";
import type { CrmPresenceStatus } from "../../lib/crmPresence";
import { removeMyTeamAvatar, teamAvatarPublicUrl, uploadMyTeamAvatar } from "../../lib/crmTeamAvatars";
import { teamMemberInitials } from "../../utils/crmTeamMember";
import { CrmPresenceDot } from "./CrmPresenceDot";

type CrmTeamAvatarProps = {
  name: string;
  email: string;
  displayName: string | null;
  avatarPath: string | null;
  avatarVersion?: string | null;
  presence: CrmPresenceStatus;
  size?: "md" | "lg";
  editable?: boolean;
  onAvatarChange?: (path: string | null) => void;
};

export function CrmTeamAvatar({
  name,
  email,
  displayName,
  avatarPath,
  avatarVersion,
  presence,
  size = "md",
  editable = false,
  onAvatarChange
}: CrmTeamAvatarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = teamMemberInitials({ display_name: displayName, email });
  const imageSrc = teamAvatarPublicUrl(avatarPath, avatarVersion);

  const onPickFile = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    setBusy(true);
    setError(null);
    const { path, error: uploadError } = await uploadMyTeamAvatar(file, avatarPath);
    setBusy(false);
    if (uploadError) {
      setError(uploadError);
      return;
    }
    onAvatarChange?.(path);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const onRemove = async () => {
    setBusy(true);
    setError(null);
    const { error: removeError } = await removeMyTeamAvatar(avatarPath);
    setBusy(false);
    if (removeError) {
      setError(removeError);
      return;
    }
    onAvatarChange?.(null);
  };

  return (
    <div className={`crmTeamAvatarWrap crmTeamAvatarWrap--${size}${editable ? " crmTeamAvatarWrap--editable" : ""}`}>
      <div className={`crmTeamAvatar crmTeamAvatar--${size} crmTeamAvatar--${presence}`} aria-hidden={editable ? undefined : true}>
        {imageSrc ? (
          <img className="crmTeamAvatarImage" src={imageSrc} alt={`${name} profile photo`} />
        ) : (
          <span className="crmTeamAvatarInitials">{initials}</span>
        )}
        <span className="crmTeamAvatarPresence" title={presence}>
          <CrmPresenceDot status={presence} />
        </span>
      </div>

      {editable ? (
        <div className="crmTeamAvatarActions">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="crmTeamAvatarFileInput"
            disabled={busy}
            onChange={(event) => void onPickFile(event.target.files)}
          />
          <label htmlFor={inputId} className="crmModalButtonSecondary crmTeamAvatarUploadBtn">
            {busy ? "Uploading…" : imageSrc ? "Change photo" : "Upload photo"}
          </label>
          {imageSrc ? (
            <button type="button" className="crmModalButtonSecondary crmTeamAvatarRemoveBtn" disabled={busy} onClick={() => void onRemove()}>
              Remove
            </button>
          ) : null}
          {error ? (
            <p className="crmBanner crmTeamAvatarError" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
