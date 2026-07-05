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

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

let supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
let session: Session | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let booted = false;

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

async function loadRemoteState(): Promise<BoardState | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
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

async function saveRemoteState(state: BoardState): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("feath_board_state").upsert(
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

async function ensureRemoteSeed(): Promise<void> {
  const embedded = window.__feathBoardGetState();
  await saveRemoteState(embedded);
}

window.__feathBoardScheduleSave = () => {
  if (!supabase || !session) return;

  setSaveStatus("saving");
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void saveRemoteState(window.__feathBoardGetState())
      .then(() => setSaveStatus("saved"))
      .catch((error) => {
        console.error(error);
        setSaveStatus("error");
      });
  }, 700);
};

async function showAuthenticated(sess: Session): Promise<void> {
  session = sess;
  setLoginError("");
  loginEl()?.setAttribute("hidden", "");
  appEl()?.removeAttribute("hidden");

  const signOutBtn = document.getElementById("feathBoardSignOut");
  if (signOutBtn) signOutBtn.hidden = false;

  if (!booted) {
    try {
      const remote = await loadRemoteState();
      if (hasBoardData(remote)) {
        window.__feathBoardApplyState(remote!);
      } else {
        await ensureRemoteSeed();
      }
    } catch (error) {
      console.error(error);
      setSaveStatus("error");
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

async function init(): Promise<void> {
  if (!supabase) {
    showLogin();
    setLoginError(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.",
    );
    return;
  }

  const form = document.getElementById("feathBoardLoginForm") as HTMLFormElement | null;
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    void (async () => {
      const email = (document.getElementById("feathBoardEmail") as HTMLInputElement).value.trim();
      const password = (document.getElementById("feathBoardPassword") as HTMLInputElement).value;
      setLoginError("");
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) setLoginError(error.message);
    })();
  });

  document.getElementById("feathBoardSignOut")?.addEventListener("click", () => {
    void supabase?.auth.signOut();
  });

  const { data } = await supabase.auth.getSession();
  if (data.session) {
    await showAuthenticated(data.session);
  } else {
    showLogin();
  }

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    if (nextSession) {
      void showAuthenticated(nextSession);
    } else {
      showLogin();
    }
  });
}

void init();
