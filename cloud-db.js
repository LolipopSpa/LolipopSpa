(function () {
  const cfg = window.SUPABASE_CONFIG || {};
  const table = cfg.table || 'site_content';

  const enabled = Boolean(window.supabase && cfg.url && cfg.anonKey);
  let client = null;

  if (enabled) {
    client = window.supabase.createClient(cfg.url, cfg.anonKey);
  }

  async function signIn(email, password) {
    if (!enabled) throw new Error('Cloud deshabilitado');
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    if (!enabled) return;
    await client.auth.signOut();
  }

  async function hasSession() {
    if (!enabled) return false;
    const { data, error } = await client.auth.getSession();
    if (error) return false;
    return Boolean(data?.session);
  }

  async function fetchContent() {
    if (!enabled) return null;

    const { data, error } = await client
      .from(table)
      .select('id, content, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) return null;

    const row = data[0];
    return row?.content || null;
  }

  async function saveContent(content) {
    if (!enabled) throw new Error('Cloud deshabilitado');

    const { data: latest, error: readError } = await client
      .from(table)
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (readError) throw readError;

    if (Array.isArray(latest) && latest[0]?.id) {
      const { error: updateError } = await client
        .from(table)
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', latest[0].id);
      if (updateError) throw updateError;
      return;
    }

    const { error: insertError } = await client.from(table).insert([{ content }]);
    if (insertError) throw insertError;
  }

  window.CloudDB = {
    enabled,
    signIn,
    signOut,
    hasSession,
    fetchContent,
    saveContent,
  };
})();
