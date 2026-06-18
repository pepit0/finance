import { useEffect, useState } from "react";
import { fetchCallRecordingUrl } from "../../lib/crmApi";

type CrmCallRecordingPlayerProps = {
  activityId: string;
  canListen: boolean;
};

export function CrmCallRecordingPlayer({ activityId, canListen }: CrmCallRecordingPlayerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canListen) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchCallRecordingUrl(activityId).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (result.error || !result.url) {
        setError(result.error ?? "Recording unavailable.");
        setUrl(null);
        return;
      }
      setUrl(result.url);
    });
    return () => {
      cancelled = true;
    };
  }, [activityId, canListen]);

  if (!canListen) {
    return <span className="crmActivityRecordingMuted">Recording on file</span>;
  }

  if (loading) {
    return <span className="crmActivityRecordingMuted">Loading recording…</span>;
  }

  if (error) {
    return <span className="crmActivityRecordingMuted">{error}</span>;
  }

  if (!url) {
    return null;
  }

  return (
    <audio className="crmActivityRecordingPlayer" controls preload="none" src={url}>
      Your browser does not support audio playback.
    </audio>
  );
}
