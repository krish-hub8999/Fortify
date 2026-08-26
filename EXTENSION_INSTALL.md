# Fortify Field Notes — Extension Installation

Fortify Field Notes is a **Manifest V3 Chrome/Edge popup extension**. It performs password analysis entirely inside the popup; it does not send, save, or attempt to crack the password entered into the assessment field.

## Build and load locally

Run `pnpm build` from the project root. Then open `chrome://extensions` in Chrome or `edge://extensions` in Microsoft Edge, enable **Developer mode**, select **Load unpacked**, and choose the generated `dist/public` directory.

The popup is deliberately permission-free. It does not read web pages, inspect form fields, make network requests, or use Hydra. Its “crack time” is a transparent estimate based on the analyzed search space and two attacker-rate assumptions, not a live attack.

| Estimate | Assumption | Intended interpretation |
|---|---:|---|
| Online, rate-limited | 100 guesses/second | A heavily throttled login service |
| Offline, fast hashing | 10 billion guesses/second | A conservative fast-hash scenario after a credential database compromise |

## Use guidance

Treat the result as a **decision aid**, not proof that a password is safe. Use a unique password for every account, prefer a password manager’s random generator, and enable multi-factor authentication wherever it is available.
