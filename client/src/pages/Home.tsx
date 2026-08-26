/**
 * Field Manual design: an editorial assessment sheet with tactile margins,
 * a lateral calibration rail, and explanations that never reveal the password.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Clipboard,
  CloudCog,
  Copy,
  Download,
  FileDown,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LogIn,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { analyzePassword, createStrongPassword, estimateCrackTime } from "@/lib/passwordAnalysis";
import { VaultPanel } from "@/components/VaultPanel";
import "./strength-panel.css";

const LOGO_URL = "/manus-storage/fortify-lagoon-lens-shield_b5c4217e.png";
const LEDGER_URL = "/manus-storage/fortify-lagoon-mist_bdcd6510.jpg";
const SPECIMEN_URL = "/manus-storage/fortify-lagoon-inset_ca5b6dc6.jpg";

type CopyState = "idle" | "copied";
type AttackerModel = "online-protected" | "offline-slow" | "offline-fast";
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const ATTACKER_MODELS: { id: AttackerModel; label: string; rate: number; detail: string }[] = [
  { id: "online-protected", label: "Online, protected", rate: 100, detail: "100 guesses / second" },
  { id: "offline-slow", label: "Offline, slow hash", rate: 100_000, detail: "100 thousand guesses / second" },
  { id: "offline-fast", label: "Offline, fast hash", rate: 10_000_000_000, detail: "10 billion guesses / second" },
];

function strengthTone(score: number) {
  return ["weak", "weak", "fair", "strong", "excellent"][score] ?? "weak";
}

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [strongAlternatives, setStrongAlternatives] = useState<string[]>([]);
  const [copiedAlternative, setCopiedAlternative] = useState<string | null>(null);
  const [attackerModel, setAttackerModel] = useState<AttackerModel>("offline-fast");
  const [assessmentMotion, setAssessmentMotion] = useState(0);
  const [generatorMotion, setGeneratorMotion] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installHint, setInstallHint] = useState("");
  const assessment = useMemo(() => analyzePassword(password), [password]);
  const strength = assessment ? strengthTone(assessment.score) : "empty";
  const activeModel = ATTACKER_MODELS.find((model) => model.id === attackerModel) ?? ATTACKER_MODELS[2];
  const modelEstimate = assessment ? estimateCrackTime(assessment.entropyBits, activeModel.rate) : null;
  const preferenceQuery = trpc.securityData.preference.useQuery(undefined, { enabled: isAuthenticated });
  const reportsQuery = trpc.securityData.listReports.useQuery(undefined, { enabled: isAuthenticated });
  const savePreference = trpc.securityData.savePreference.useMutation();
  const exportReport = trpc.securityData.exportSanitizedReport.useMutation({
    onSuccess: () => reportsQuery.refetch(),
  });

  useEffect(() => {
    const savedModel = preferenceQuery.data?.attackerModel;
    if (savedModel && ATTACKER_MODELS.some((model) => model.id === savedModel)) {
      setAttackerModel(savedModel as AttackerModel);
    }
  }, [preferenceQuery.data?.attackerModel]);

  useEffect(() => {
    if (assessment) setAssessmentMotion((current) => current + 1);
  }, [assessment?.score, attackerModel]);

  useEffect(() => {
    if (!assessment) {
      setStrongAlternatives([]);
      setCopiedAlternative(null);
      return;
    }
    setStrongAlternatives([createStrongPassword(), createStrongPassword(), createStrongPassword()]);
    setCopiedAlternative(null);
  }, [assessment?.score]);

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    return () => window.removeEventListener("beforeinstallprompt", capturePrompt);
  }, []);

  const copyPassword = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("idle");
    }
  };

  const generatePassword = () => {
    setGeneratedPassword(createStrongPassword());
    setCopyState("idle");
    setGeneratorMotion((current) => current + 1);
  };

  const refreshAlternatives = () => {
    setStrongAlternatives([createStrongPassword(), createStrongPassword(), createStrongPassword()]);
    setCopiedAlternative(null);
  };

  const copyAlternative = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedAlternative(value);
      window.setTimeout(() => setCopiedAlternative((current) => current === value ? null : current), 1800);
    } catch {
      setCopiedAlternative(null);
    }
  };

  const selectAttackerModel = (model: AttackerModel) => {
    setAttackerModel(model);
    if (isAuthenticated) savePreference.mutate(model);
  };

  const storeSanitizedReport = () => {
    if (!assessment || !isAuthenticated) return;
    exportReport.mutate({
      attackerModel,
      strength: assessment.strength,
      score: assessment.score,
      entropyBits: assessment.entropyBits,
    });
  };

  const installApp = async () => {
    if (!installPrompt) {
      setInstallHint("On iPhone or iPad, open the browser share menu and choose Add to Home Screen.");
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallHint(choice.outcome === "accepted" ? "Fortify is being added to your home screen." : "Install was dismissed. You can try again later.");
    setInstallPrompt(null);
  };

  return (
    <main className="field-manual" style={{ backgroundImage: `linear-gradient(90deg, rgba(248,245,237,.97), rgba(248,245,237,.93)), url(${LEDGER_URL})` }}>
      <div className="paper-grain" aria-hidden="true" />
      <header className="masthead">
        <div className="brand-lockup">
          <img className="brand-mark" src={LOGO_URL} alt="" />
          <div>
            <p className="eyebrow">PRIVATE ASSESSMENT / 01</p>
            <h1>Fortify<br /><em>Field Notes</em></h1>
          </div>
        </div>
        <div className="masthead-actions">
          <button className="install-app-button" type="button" onClick={installApp}><Download size={13} /> Install app</button>
          <div className="local-seal" title="Your password stays in this popup">
            <ShieldCheck size={18} strokeWidth={1.8} />
            <span>LOCAL<br />ONLY</span>
          </div>
        </div>
      </header>

      <section className="intake-section" aria-labelledby="password-label">
        <div className="section-heading">
          <span className="step-number">01</span>
          <label id="password-label" htmlFor="password-input">Assess a password</label>
          <span className="rule" />
        </div>
        <div className="input-shell">
          <KeyRound aria-hidden="true" size={19} strokeWidth={1.8} />
          <input
            id="password-input"
            type={revealed ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Type or paste it here"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {password && (
            <button className="icon-button" type="button" onClick={() => setPassword("")} aria-label="Clear password">
              <X size={17} />
            </button>
          )}
          <button className="icon-button" type="button" onClick={() => setRevealed((current) => !current)} aria-label={revealed ? "Hide password" : "Reveal password"}>
            {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="privacy-note"><LockKeyhole size={13} /> Typed values are analyzed in this popup and are never saved or sent.</p>
        {installHint ? <p className="install-hint">{installHint}</p> : null}
      </section>

      {!assessment ? (
        <section className="empty-assessment">
          <div className="empty-calibration" aria-hidden="true"><span /><span /><span /><span /><span /></div>
          <p className="eyebrow">WAITING FOR A SAMPLE</p>
          <h2>Strength, expressed<br />in plain language.</h2>
          <p>Enter a password to see an estimated search cost, the patterns that reduce it, and an alternative generated on your device.</p>
        </section>
      ) : (
        <>
          <section className={`verdict-band ${strength} verdict-resolve`} key={`verdict-${assessmentMotion}`} aria-live="polite">
            <div className="verdict-copy">
              <p className="eyebrow">ASSESSMENT RESULT</p>
              <h2>{assessment.strength}</h2>
              <p>{assessment.entropyBits} bits of adjusted uncertainty</p>
              <span className="strength-score"><b>{assessment.strengthScore}</b><small>/100 local score</small></span>
            </div>
            <div className="crack-estimate">
              <span className="estimate-label">{activeModel.label.toUpperCase()} MODEL</span>
              <strong>{modelEstimate?.duration}</strong>
              <span className="estimate-method">{activeModel.detail} · average case</span>
            </div>
          </section>

          <section className="calibration-section" aria-label="Password strength calibration">
            <div className="calibration-labels"><span>weak</span><span>resilient</span></div>
            <div className="calibration-rail rail-charge" key={`rail-${assessmentMotion}`}>
              {[0, 1, 2, 3, 4].map((segment) => <span className={segment <= assessment.score ? "filled" : ""} key={segment} />)}
              <i className="rail-marker" style={{ left: `${assessment.score * 25}%` }} />
            </div>
          </section>

          <section className="attack-model">
            <div><span className="eyebrow">ONLINE, RATE-LIMITED</span><strong>{assessment.crackTimes.online}</strong></div>
            <div><span className="eyebrow">CHARACTER POOL</span><strong>{assessment.composition.join(" · ") || "single class"}</strong></div>
          </section>

          <section className="simulation-panel" aria-labelledby="simulation-title">
            <div className="section-heading">
              <span className="step-number">03</span>
              <h2 id="simulation-title">Offline simulation</h2>
              <span className="rule" />
            </div>
            <div className="model-choices" role="radiogroup" aria-label="Attacker model">
              {ATTACKER_MODELS.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  role="radio"
                  aria-checked={attackerModel === model.id}
                  className={attackerModel === model.id ? "model-choice active" : "model-choice"}
                  onClick={() => selectAttackerModel(model.id)}
                >
                  <span>{model.label}</span><small>{model.detail}</small>
                </button>
              ))}
            </div>
            <div className="simulation-result">
              <span className="eyebrow">MODELED AVERAGE TIME</span>
              <strong>{modelEstimate?.duration}</strong>
              <p>About {modelEstimate?.averageGuesses} guesses at the selected rate. This is an arithmetic estimate only; no attempt is made.</p>
            </div>
            <p className="simulation-note"><CloudCog size={13} /> Your selected model can be saved to your private account. Password values stay local.</p>
          </section>

          <section className="diagnostics" aria-labelledby="diagnostics-title">
            <div className="section-heading">
              <span className="step-number">02</span>
              <h2 id="diagnostics-title">Pattern breakdown</h2>
              <span className="rule" />
            </div>
            <div className="diagnostic-stack">
              {assessment.diagnostics.map((diagnostic, index) => (
                <article className={`diagnostic-slip ${diagnostic.tone}`} key={`${assessmentMotion}-${diagnostic.label}-${index}`}>
                  <span className="slip-index">0{index + 1}</span>
                  <div><h3>{diagnostic.label}</h3><p>{diagnostic.detail}</p></div>
                  <span className="slip-mark" aria-hidden="true">{diagnostic.tone === "good" ? "✓" : "!"}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="record-panel" aria-labelledby="record-title">
            <div className="section-heading">
              <span className="step-number">04</span>
              <h2 id="record-title">Private record</h2>
              <span className="rule" />
            </div>
            {authLoading ? (
              <p className="record-status">Checking your private workspace…</p>
            ) : isAuthenticated ? (
              <div className="record-authenticated">
                <p><strong>Signed in as {user?.name ?? "your account"}.</strong> Save this model preference or create a sanitized JSON record with the strength result only.</p>
                <button className="record-button" type="button" onClick={storeSanitizedReport} disabled={!assessment || exportReport.isPending}>
                  <FileDown size={16} /> {exportReport.isPending ? "Storing report…" : "Store sanitized assessment"}
                </button>
                {exportReport.isError ? <p className="record-error">The report could not be stored. Please try again.</p> : null}
                {reportsQuery.data?.[0] ? <a className="record-link" href={reportsQuery.data[0].fileUrl} target="_blank" rel="noreferrer">Open most recent sanitized record <ChevronRight size={14} /></a> : null}
              </div>
            ) : (
              <div className="record-unauthenticated">
                <p>Sign in to persist your model choice and create a managed, sanitized assessment record. It never contains your password.</p>
                <div className="identity-choices" aria-label="Secure sign-in options">
                  <button className="record-button" type="button" onClick={() => startLogin()}><LogIn size={16} /> Continue with Google</button>
                  <button className="identity-email-button" type="button" onClick={() => startLogin()}><Mail size={15} /> Continue with email</button>
                </div>
                <p className="identity-note">Both options use the existing secure identity flow. Provider availability is determined by your connected account.</p>
              </div>
            )}
          </section>
          {isAuthenticated ? <VaultPanel /> : null}
        </>
      )}

      <section className="generator-section" style={{ backgroundImage: `linear-gradient(105deg, rgba(31,33,31,.96), rgba(31,33,31,.91)), url(${SPECIMEN_URL})` }}>
        <div className="generator-copy">
          <p className="eyebrow">FIELD RECOMMENDATION</p>
          <h2>Use an independently generated password.</h2>
          <p>{assessment ? assessment.suggestions[0] : "A unique, random value gives attackers fewer usable clues."}</p>
        </div>
        {generatedPassword ? (
          <div className="generated-value generated-reveal" key={`generated-${generatorMotion}`} aria-label="Generated strong password">
            <code>{generatedPassword}</code>
            <button className={copyState === "copied" ? "copy-confirmed" : ""} type="button" onClick={() => copyPassword(generatedPassword)} aria-label="Copy generated password">
              {copyState === "copied" ? <Check size={17} /> : <Copy size={17} />}
              {copyState === "copied" ? "Copied" : "Copy"}
            </button>
          </div>
        ) : null}
        <button className="generate-button" type="button" onClick={generatePassword}>
          <Sparkles size={17} /> {generatedPassword ? "Generate another" : "Generate a 22-character password"}
          {generatedPassword ? <RefreshCw size={15} /> : <ChevronRight size={17} />}
        </button>
      </section>

      {assessment ? (
        <section className="alternatives-panel" aria-labelledby="alternatives-title">
          <div className="section-heading">
            <span className="step-number">06</span>
            <h2 id="alternatives-title">Strong alternatives</h2>
            <span className="rule" />
          </div>
          <p className="alternatives-intro">Generated locally with a mix of upper- and lowercase letters, numbers, and symbols. These values are never sent to Fortify.</p>
          <div className="alternative-list">
            {strongAlternatives.map((alternative, index) => (
              <div className="alternative-row" key={alternative}>
                <span>0{index + 1}</span>
                <code>{alternative}</code>
                <button type="button" onClick={() => copyAlternative(alternative)} aria-label={`Copy alternative ${index + 1}`}>
                  {copiedAlternative === alternative ? <Check size={16} /> : <Copy size={16} />}
                  {copiedAlternative === alternative ? "Copied" : "Copy"}
                </button>
              </div>
            ))}
          </div>
          <button className="refresh-alternatives" type="button" onClick={refreshAlternatives}><RefreshCw size={15} /> Generate 3 new alternatives</button>
        </section>
      ) : null}

      <section className="download-hub" aria-labelledby="download-title">
        <div className="section-heading">
          <span className="step-number">05</span>
          <h2 id="download-title">Get Fortify anywhere</h2>
          <span className="rule" />
        </div>
        <p className="download-intro">Use Fortify as an installable mobile app, or download the companion extension for Chrome. Both keep password analysis on your device.</p>
        <div className="download-grid">
          <article className="download-card mobile-download">
            <span className="eyebrow">MOBILE WEB APP</span>
            <h3>Add Fortify to your home screen</h3>
            <p>On Android, use the install prompt. On iPhone or iPad, open the browser share menu and choose <strong>Add to Home Screen</strong>.</p>
            <button className="download-action" type="button" onClick={installApp}><Download size={16} /> Install on this phone</button>
          </article>
          <article className="download-card extension-download">
            <span className="eyebrow">CHROME EXTENSION</span>
            <h3>Install Fortify Lens</h3>
            <p>Download the Manifest V3 package, then use Chrome’s <strong>Load unpacked</strong> option for local installation. The future Web Store listing will offer one-click installation.</p>
            <a className="download-action" href="/manus-storage/fortify-lens-chrome-extension-v1.0.3_ddb2b2ed.zip" download><Download size={16} /> Download Chrome extension</a>
          </article>
        </div>
        <p className="share-note"><ShieldCheck size={14} /> Share this page to give people the mobile app and extension download paths in one place.</p>
      </section>

      <footer className="method-note">
        <Clipboard size={15} />
        <p><strong>Method note.</strong> This is a model-based estimate, not a live cracking attempt. Stored reports exclude the password and pattern details. Reuse is still a risk, even for an excellent score.</p>
      </footer>
    </main>
  );
}
