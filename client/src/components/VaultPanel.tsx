import { Eye, EyeOff, KeyRound, LockKeyhole, Plus, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { decryptVaultPayload, encryptVaultPayload, type VaultPayload } from "@/lib/vaultCrypto";

type EntryView = { id: number; payload: VaultPayload };

const blankEntry: VaultPayload = { title: "", website: "", username: "", password: "", note: "" };

export function VaultPanel() {
  const [passphrase, setPassphrase] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<VaultPayload>(blankEntry);
  const [entries, setEntries] = useState<EntryView[]>([]);
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const vaultQuery = trpc.vault.list.useQuery(undefined, { enabled: unlocked });
  const vaultUtils = trpc.useUtils();
  const saveEntry = trpc.vault.save.useMutation({ onSuccess: () => vaultUtils.vault.list.invalidate() });
  const removeEntry = trpc.vault.remove.useMutation({ onSuccess: () => vaultUtils.vault.list.invalidate() });

  useEffect(() => {
    let active = true;
    if (!unlocked || !vaultQuery.data) {
      setEntries([]);
      return;
    }
    Promise.all(vaultQuery.data.map(async (entry) => {
      if (entry.kdfVersion !== "PBKDF2-SHA-256/250000") throw new Error("Unsupported vault encryption version");
      return { id: entry.id, payload: await decryptVaultPayload({ ciphertext: entry.ciphertext, iv: entry.iv, salt: entry.salt, kdfVersion: entry.kdfVersion }, passphrase) };
    }))
      .then((nextEntries) => { if (active) { setEntries(nextEntries); setError(""); } })
      .catch(() => { if (active) { setEntries([]); setError("The vault passphrase could not unlock these entries."); } });
    return () => { active = false; };
  }, [unlocked, vaultQuery.data, passphrase]);

  const unlockVault = () => {
    if (passphrase.length < 12) {
      setError("Use at least 12 characters for a vault passphrase.");
      return;
    }
    setError("");
    setUnlocked(true);
  };

  const saveVaultEntry = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title || !draft.password) {
      setError("Add a label and the password you want to encrypt.");
      return;
    }
    try {
      const encrypted = await encryptVaultPayload(draft, passphrase);
      await saveEntry.mutateAsync(encrypted);
      setDraft(blankEntry);
      setError("");
    } catch {
      setError("The entry could not be encrypted and saved.");
    }
  };

  return (
    <section className="vault-panel" aria-labelledby="vault-title">
      <div className="section-heading"><span className="step-number">05</span><h2 id="vault-title">Encrypted vault</h2><span className="rule" /></div>
      {!unlocked ? (
        <div className="vault-lock-card">
          <LockKeyhole size={18} /><div><strong>Unlock on this device</strong><p>Your vault passphrase creates a session-only key. It is never sent or saved.</p></div>
          <label className="sr-only" htmlFor="vault-passphrase">Vault passphrase</label>
          <input id="vault-passphrase" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} type="password" autoComplete="new-password" placeholder="Vault passphrase" />
          <button className="vault-action" type="button" onClick={unlockVault}><KeyRound size={15} /> Unlock vault</button>
        </div>
      ) : (
        <>
          <form className="vault-entry-form" onSubmit={saveVaultEntry}>
            <div className="vault-form-head"><strong>Add an encrypted entry</strong><span>Only ciphertext is stored</span></div>
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Label, e.g. Personal email" autoComplete="off" />
            <input value={draft.website} onChange={(event) => setDraft({ ...draft, website: event.target.value })} placeholder="Website (encrypted)" autoComplete="off" />
            <input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} placeholder="Username (encrypted)" autoComplete="off" />
            <input value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} placeholder="Password to encrypt" type="password" autoComplete="new-password" />
            <input value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Note (encrypted, optional)" autoComplete="off" />
            <button className="vault-action" disabled={saveEntry.isPending} type="submit"><Plus size={15} /> {saveEntry.isPending ? "Encrypting…" : "Encrypt & save"}</button>
          </form>
          <div className="vault-entry-list" aria-live="polite">
            {vaultQuery.isLoading ? <p>Loading encrypted entries…</p> : null}
            {!vaultQuery.isLoading && entries.length === 0 ? <p>No unlocked entries yet.</p> : null}
            {entries.map((entry) => <article className="vault-entry" key={entry.id}>
              <div><strong>{entry.payload.title}</strong><span>{entry.payload.website || "Encrypted entry"}</span></div>
              <div className="vault-entry-actions">
                <button type="button" onClick={() => setRevealedId(revealedId === entry.id ? null : entry.id)} aria-label="Reveal encrypted entry password">{revealedId === entry.id ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                <button type="button" onClick={() => removeEntry.mutate({ id: entry.id })} aria-label="Remove encrypted entry"><Trash2 size={15} /></button>
              </div>
              {revealedId === entry.id ? <code>{entry.payload.password}</code> : null}
            </article>)}
          </div>
        </>
      )}
      {error ? <p className="vault-error">{error}</p> : null}
    </section>
  );
}
