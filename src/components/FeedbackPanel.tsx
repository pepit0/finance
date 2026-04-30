import { FormEvent, useMemo, useState } from "react";

type FeedbackKind = "suggestion" | "bug";

const FEEDBACK_ENDPOINT = import.meta.env.VITE_FEEDBACK_ENDPOINT as string | undefined;
const FEEDBACK_TO_EMAIL = import.meta.env.VITE_FEEDBACK_TO_EMAIL as string | undefined;

interface FeedbackPanelProps {
  appName: string;
}

export function FeedbackPanel({ appName }: FeedbackPanelProps) {
  const [kind, setKind] = useState<FeedbackKind>("suggestion");
  const [name, setName] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const canSubmit = useMemo(() => message.trim().length >= 8, [message]);

  const resetForm = () => {
    setKind("suggestion");
    setName("");
    setReplyEmail("");
    setMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || status === "sending") {
      return;
    }

    setStatus("sending");
    setStatusMessage("");

    const payload = {
      type: kind,
      message: message.trim(),
      senderName: name.trim() || undefined,
      senderEmail: replyEmail.trim() || undefined,
      appName,
      source: window.location.href
    };

    try {
      if (FEEDBACK_ENDPOINT) {
        const response = await fetch(FEEDBACK_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } else if (FEEDBACK_TO_EMAIL) {
        const subject = `[${appName}] ${kind === "bug" ? "Bug report" : "Suggestion"}`;
        const body = [
          `Type: ${kind}`,
          `Name: ${name.trim() || "Not provided"}`,
          `Reply email: ${replyEmail.trim() || "Not provided"}`,
          "",
          message.trim(),
          "",
          `Page: ${window.location.href}`
        ].join("\n");
        window.location.href = `mailto:${encodeURIComponent(FEEDBACK_TO_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      } else {
        throw new Error("Missing feedback destination");
      }

      setStatus("sent");
      setStatusMessage("Thanks - your message was sent.");
      resetForm();
    } catch {
      setStatus("error");
      setStatusMessage(
        "Could not send right now. Set VITE_FEEDBACK_ENDPOINT (recommended) or VITE_FEEDBACK_TO_EMAIL."
      );
    }
  };

  return (
    <section className="feedbackPanel" aria-labelledby="feedback-title">
      <h2 id="feedback-title">Suggestions & bugs</h2>
      <p className="feedbackSubtext">Send feedback directly from this page. Bug details and ideas are both welcome.</p>

      <form className="feedbackForm" onSubmit={handleSubmit}>
        <label>
          Type
          <select value={kind} onChange={(event) => setKind(event.target.value as FeedbackKind)}>
            <option value="suggestion">Suggestion</option>
            <option value="bug">Bug</option>
          </select>
        </label>

        <label>
          Your name (optional)
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Sales desk"
            autoComplete="name"
          />
        </label>

        <label>
          Reply email (optional)
          <input
            type="email"
            value={replyEmail}
            onChange={(event) => setReplyEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>

        <label>
          Message
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Tell me what happened or what you want improved..."
            rows={7}
            required
          />
        </label>

        <div className="feedbackActions">
          <button type="submit" disabled={!canSubmit || status === "sending"}>
            {status === "sending" ? "Sending..." : "Send feedback"}
          </button>
          {statusMessage ? (
            <p className={`feedbackStatus ${status === "error" ? "feedbackStatusError" : "feedbackStatusSuccess"}`}>
              {statusMessage}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
