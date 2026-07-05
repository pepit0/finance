import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

type BoardState = {
  features: unknown[];
  decisions: unknown[];
  sprintTasks: unknown[];
  bugs: unknown[];
  launchItems: unknown[];
};

const PROJECT_ID = "burd";

declare global {
  interface Window {
    __feathBoardApplyState: (state: Partial<BoardState>) => void;
    __feathBoardGetState: () => BoardState;
    __feathBoardBoot: () => void;
    __feathBoardScheduleSave: () => void;
  }
}

let supabase: SupabaseClient | null = null;
let session: Session | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let booted = false;
let signingIn = false;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  supabase = createClient(url, anonKey);
  return supabase;
}

function loginEl(): HTMLElement | null {
  return document.getElementById("feathBoardLogin");
}

function appEl(): HTMLElement | null {
  return document.getElementById("feathBoardApp");
}

function setLoginError(message: string): void {
  const el = document.getElementById("feathBoardLoginError");
  if (el) {
    el.textContent = message;
    el.hidden = !message;
  }
}

function setSigningIn(active: boolean): void {
  signingIn = active;
  const btn = document.getElementById("feathBoardSignInBtn") as HTMLButtonElement | null;
  if (!btn) return;
  btn.disabled = active;
  btn.textContent = active ? "Signing in…" : "Sign in";
}

function setSaveStatus(status: "idle" | "saving" | "saved" | "error"): void {
  const el = document.getElementById("boardSaveStatus");
  if (!el) return;
  el.dataset.state = status;
  el.textContent =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "error"
          ? "Save failed"
          : "";
}

function configError(): string {
  return "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY on Vercel, redeploy, then try again.";
}

async function waitForBridge(timeoutMs = 8000): Promise<boolean> {
  if (typeof window.__feathBoardBoot === "function") return true;

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (typeof window.__feathBoardBoot === "function") return true;
  }
  return false;
}

async function loadRemoteState(client: SupabaseClient): Promise<BoardState | null> {
  const { data, error } = await client
    .from("feath_board_state")
    .select("features, decisions, sprint_tasks, bugs, launch_items")
    .eq("project_id", PROJECT_ID)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    features: (data.features as unknown[]) ?? [],
    decisions: (data.decisions as unknown[]) ?? [],
    sprintTasks: (data.sprint_tasks as unknown[]) ?? [],
    bugs: (data.bugs as unknown[]) ?? [],
    launchItems: (data.launch_items as unknown[]) ?? [],
  };
}

async function saveRemoteState(client: SupabaseClient, state: BoardState): Promise<void> {
  const { error } = await client.from("feath_board_state").upsert(
    {
      project_id: PROJECT_ID,
      features: state.features,
      decisions: state.decisions,
      sprint_tasks: state.sprintTasks,
      bugs: state.bugs,
      launch_items: state.launchItems,
      updated_at: new Date().toISOString(),
      updated_by: session?.user?.id ?? null,
    },
    { onConflict: "project_id" },
  );

  if (error) throw error;
}

function hasBoardData(state: BoardState | null): boolean {
  if (!state) return false;
  return (
    state.features.length > 0 ||
    state.decisions.length > 0 ||
    state.sprintTasks.length > 0 ||
    state.bugs.length > 0 ||
    state.launchItems.length > 0
  );
}

async function ensureRemoteSeed(client: SupabaseClient): Promise<void> {
  const embedded = window.__feathBoardGetState();
  await saveRemoteState(client, embedded);
}

window.__feathBoardScheduleSave = () => {
  const client = getSupabase();
  if (!client || !session) return;

  setSaveStatus("saving");
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void saveRemoteState(client, window.__feathBoardGetState())
      .then(() => setSaveStatus("saved"))
      .catch((error) => {
        console.error(error);
        setSaveStatus("error");
      });
  }, 700);
};

async function showAuthenticated(sess: Session): Promise<void> {
  const client = getSupabase();
  if (!client) {
    showLogin();
    setLoginError(configError());
    return;
  }

  const bridgeReady = await waitForBridge();
  if (!bridgeReady) {
    showLogin();
    setLoginError("Board failed to load. Refresh the page and try again.");
    return;
  }

  session = sess;
  setLoginError("");
  loginEl()?.setAttribute("hidden", "");
  appEl()?.removeAttribute("hidden");

  const signOutBtn = document.getElementById("feathBoardSignOut");
  if (signOutBtn) signOutBtn.hidden = false;

  if (!booted) {
    try {
      const remote = await loadRemoteState(client);
      if (hasBoardData(remote)) {
        window.__feathBoardApplyState(remote!);
      } else {
        await ensureRemoteSeed(client);
      }
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error && /feath_board_state|relation|permission|policy/i.test(error.message)
          ? "Could not load board data. Run sql/feath_board.sql in Supabase, then try again."
          : "Could not load board data. Check the browser console for details.";
      setLoginError(message);
      showLogin();
      session = null;
      return;
    }

    window.__feathBoardBoot();
    booted = true;
  }
}

function showLogin(): void {
  session = null;
  booted = false;
  loginEl()?.removeAttribute("hidden");
  appEl()?.setAttribute("hidden", "");
  const signOutBtn = document.getElementById("feathBoardSignOut");
  if (signOutBtn) signOutBtn.hidden = true;
}

async function handleSignIn(event: Event): Promise<void> {
  event.preventDefault();

  if (signingIn) return;

  const email = (document.getElementById("feathBoardEmail") as HTMLInputElement).value.trim();
  const password = (document.getElementById("feathBoardPassword") as HTMLInputElement).value;

  const client = getSupabase();
  if (!client) {
    setLoginError(configError());
    return;
  }

  setLoginError("");
  setSigningIn(true);

  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError(error.message);
      return;
    }
    if (data.session) {
      await showAuthenticated(data.session);
    } else {
      setLoginError("Sign-in succeeded but no session was returned. Try again.");
    }
  } catch (error) {
    console.error(error);
    setLoginError(error instanceof Error ? error.message : "Sign-in failed. Try again.");
  } finally {
    setSigningIn(false);
  }
}

function wireLoginForm(): void {
  const form = document.getElementById("feathBoardLoginForm") as HTMLFormElement | null;
  if (!form || form.dataset.wired === "true") return;
  form.dataset.wired = "true";
  form.addEventListener("submit", (event) => {
    void handleSignIn(event);
  });
}

async function init(): Promise<void> {
  wireLoginForm();

  const client = getSupabase();
  if (!client) {
    showLogin();
    setLoginError(configError());
    return;
  }

  document.getElementById("feathBoardSignOut")?.addEventListener("click", () => {
    void client.auth.signOut();
  });

  const { data } = await client.auth.getSession();
  if (data.session) {
    await showAuthenticated(data.session);
  } else {
    showLogin();
  }

  client.auth.onAuthStateChange((_event, nextSession) => {
    if (nextSession) {
      void showAuthenticated(nextSession);
    } else {
      showLogin();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void init();
  });
} else {
  void init();
}
