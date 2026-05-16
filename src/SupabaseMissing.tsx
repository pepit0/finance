export function SupabaseMissing() {
  return (
    <main className="supabaseMissing">
      <h1 className="supabaseMissingTitle">Configuration needed</h1>
      <p className="supabaseMissingText">
        Copy <code className="supabaseMissingCode">.env.example</code> to <code className="supabaseMissingCode">.env.local</code> in
        this project and set <code className="supabaseMissingCode">VITE_SUPABASE_URL</code> and{" "}
        <code className="supabaseMissingCode">VITE_SUPABASE_ANON_KEY</code> from Supabase (Settings → API). Then restart{" "}
        <code className="supabaseMissingCode">npm run dev</code>.
      </p>
    </main>
  );
}
