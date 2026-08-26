/**
 * Field Manual design reminder: every calculated signal must be explainable,
 * privacy-preserving, and legible without exposing the entered password.
 */

export type StrengthLevel = "Very weak" | "Weak" | "Fair" | "Strong" | "Excellent";

export type Diagnostic = {
  label: string;
  detail: string;
  tone: "good" | "warn" | "bad" | "neutral";
};

export type PasswordAssessment = {
  entropyBits: number;
  rawEntropyBits: number;
  strength: StrengthLevel;
  score: number;
  strengthScore: number;
  crackTimes: {
    online: string;
    offline: string;
  };
  composition: string[];
  diagnostics: Diagnostic[];
  suggestions: string[];
};

const COMMON_TERMS = [
  "password",
  "passw0rd",
  "qwerty",
  "letmein",
  "welcome",
  "admin",
  "iloveyou",
  "monkey",
  "dragon",
  "football",
  "baseball",
  "secret",
  "login",
  "princess",
  "sunshine",
  "trustno1",
  "abc123",
  "master",
  "gamer",
  "starwars",
  "pokemon",
];

const KEYBOARD_SEQUENCES = [
  "qwerty",
  "asdf",
  "zxcv",
  "123456",
  "098765",
  "!@#$",
];

function log2(value: number) {
  return Math.log(value) / Math.log(2);
}

function hasAscendingOrDescendingRun(value: string) {
  const normalized = value.toLowerCase();
  for (let index = 0; index < normalized.length - 3; index += 1) {
    const slice = normalized.slice(index, index + 4);
    const codes = Array.from(slice).map((char) => char.charCodeAt(0));
    const ascending = codes.every((code, offset) => offset === 0 || code === codes[0] + offset);
    const descending = codes.every((code, offset) => offset === 0 || code === codes[0] - offset);
    if (ascending || descending) return true;
  }
  return false;
}

function hasRepeatedPattern(value: string) {
  if (/(.)\1{2,}/.test(value)) return true;
  for (let size = 1; size <= Math.min(4, Math.floor(value.length / 2)); size += 1) {
    const chunk = value.slice(0, size);
    if (chunk && chunk.repeat(Math.floor(value.length / size)).startsWith(value)) return true;
  }
  return false;
}

function containsDateLikePattern(value: string) {
  return /(?:19|20)\d{2}|(?:0?[1-9]|1[0-2])[-/.]?(?:0?[1-9]|[12]\d|3[01])|(?:0?[1-9]|[12]\d|3[01])[-/.]?(?:0?[1-9]|1[0-2])/.test(value);
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds > 1e18) return "beyond practical estimate";
  if (seconds < 1) return "less than a second";
  const units = [
    [31557600, "year"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
    [1, "second"],
  ] as const;
  for (const [unitSeconds, label] of units) {
    if (seconds >= unitSeconds) {
      const quantity = seconds / unitSeconds;
      const rounded = quantity >= 100 ? Math.round(quantity) : quantity >= 10 ? Math.round(quantity * 10) / 10 : Math.round(quantity * 100) / 100;
      return `${rounded.toLocaleString()} ${label}${rounded === 1 ? "" : "s"}`;
    }
  }
  return "less than a second";
}

function formatGuessCount(guesses: number) {
  if (!Number.isFinite(guesses) || guesses >= 1e18) return "more than 1 quintillion";
  if (guesses >= 1e15) return `${Math.round(guesses / 1e15)} quadrillion`;
  if (guesses >= 1e12) return `${Math.round(guesses / 1e12)} trillion`;
  if (guesses >= 1e9) return `${Math.round(guesses / 1e9)} billion`;
  if (guesses >= 1e6) return `${Math.round(guesses / 1e6)} million`;
  if (guesses >= 1e3) return `${Math.round(guesses / 1e3)} thousand`;
  return Math.max(1, Math.round(guesses)).toLocaleString();
}

export function estimateCrackTime(entropyBits: number, guessesPerSecond: number) {
  const averageGuesses = 2 ** Math.min(entropyBits - 1, 100);
  return {
    duration: formatDuration(averageGuesses / guessesPerSecond),
    averageGuesses: formatGuessCount(averageGuesses),
  };
}

export function createStrongPassword(length = 22) {
  const groups = [
    "abcdefghjkmnpqrstuvwxyz",
    "ABCDEFGHJKMNPQRSTUVWXYZ",
    "23456789",
    "!@#$%&*+-_=?.",
  ];
  const minimum = groups.map((group) => group[crypto.getRandomValues(new Uint32Array(1))[0] % group.length]);
  const allCharacters = groups.join("");
  const randomValues = crypto.getRandomValues(new Uint32Array(Math.max(0, length - minimum.length)));
  const characters = [
    ...minimum,
    ...Array.from(randomValues, (value) => allCharacters[value % allCharacters.length]),
  ];

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % (index + 1);
    [characters[index], characters[randomIndex]] = [characters[randomIndex], characters[index]];
  }
  return characters.join("");
}

export function analyzePassword(value: string): PasswordAssessment | null {
  if (!value) return null;

  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  const normalized = value.toLowerCase();
  const diagnostics: Diagnostic[] = [];
  const suggestions: string[] = [];
  const composition = [
    hasLower && "lowercase",
    hasUpper && "uppercase",
    hasDigit && "digits",
    hasSymbol && "symbols",
  ].filter(Boolean) as string[];

  const poolSize = (hasLower ? 26 : 0) + (hasUpper ? 26 : 0) + (hasDigit ? 10 : 0) + (hasSymbol ? 33 : 0);
  const rawEntropyBits = Math.round(value.length * log2(Math.max(poolSize, 1)));
  let adjustedBits = rawEntropyBits;

  const commonTerm = COMMON_TERMS.find((term) => normalized.includes(term));
  if (commonTerm) {
    adjustedBits = Math.min(adjustedBits, 18 + Math.max(0, value.length - commonTerm.length) * 2);
    diagnostics.push({ label: "Common phrase detected", detail: "A familiar password word or phrase dramatically narrows the search space.", tone: "bad" });
    suggestions.push("Replace familiar words with a password-manager-generated value.");
  }

  const keyboardPattern = KEYBOARD_SEQUENCES.some((sequence) => normalized.includes(sequence));
  if (keyboardPattern) {
    adjustedBits -= 18;
    diagnostics.push({ label: "Keyboard path detected", detail: "Adjacent keys are checked early by informed guessing tools.", tone: "bad" });
    suggestions.push("Avoid runs that follow the keyboard layout.");
  }

  if (hasAscendingOrDescendingRun(value)) {
    adjustedBits -= 14;
    diagnostics.push({ label: "Ordered sequence detected", detail: "Alphabetical or numeric runs are far more predictable than random characters.", tone: "bad" });
    suggestions.push("Break up alphabetic and numeric sequences.");
  }

  if (hasRepeatedPattern(value)) {
    adjustedBits -= 16;
    diagnostics.push({ label: "Repeated pattern detected", detail: "Repetitions add length but little uncertainty for a targeted guesser.", tone: "bad" });
    suggestions.push("Use varied, independently generated characters.");
  }

  if (containsDateLikePattern(value)) {
    adjustedBits -= 12;
    diagnostics.push({ label: "Date-like pattern detected", detail: "Dates are usually tested from a small, predictable range.", tone: "warn" });
    suggestions.push("Do not use birthdays, years, or calendar formats.");
  }

  if (value.length < 12) {
    adjustedBits -= (12 - value.length) * 3;
    diagnostics.push({ label: `Only ${value.length} characters`, detail: "Length is the most reliable way to expand the possible search space.", tone: "bad" });
    suggestions.push("Use at least 16 characters; 20+ is preferable for a generated password.");
  } else if (value.length < 16) {
    diagnostics.push({ label: `${value.length} characters`, detail: "A good foundation; a few more random characters would add meaningful resistance.", tone: "warn" });
    suggestions.push("Extend this to 16 or more randomly selected characters.");
  } else {
    diagnostics.push({ label: `${value.length} characters`, detail: "This length supports strong resistance when the characters are independently chosen.", tone: "good" });
  }

  if (composition.length < 3) {
    adjustedBits -= 6;
    diagnostics.push({ label: "Limited character variety", detail: "The estimated character pool is smaller than a mixed-character password.", tone: "warn" });
    suggestions.push("Mix character classes or generate a random password with a password manager.");
  } else {
    diagnostics.push({ label: `${composition.length} character classes`, detail: "The character pool is broad enough to support a stronger random password.", tone: "good" });
  }

  adjustedBits = Math.max(1, Math.min(120, Math.round(adjustedBits)));
  const score = adjustedBits < 20 ? 0 : adjustedBits < 35 ? 1 : adjustedBits < 50 ? 2 : adjustedBits < 65 ? 3 : 4;
  const strengthScore = Math.min(100, Math.round((adjustedBits / 80) * 100));
  const strength: StrengthLevel[] = ["Very weak", "Weak", "Fair", "Strong", "Excellent"];
  const onlineEstimate = estimateCrackTime(adjustedBits, 100);
  const offlineEstimate = estimateCrackTime(adjustedBits, 10_000_000_000);

  return {
    entropyBits: adjustedBits,
    rawEntropyBits,
    strength: strength[score],
    score,
    strengthScore,
    crackTimes: {
      online: onlineEstimate.duration,
      offline: offlineEstimate.duration,
    },
    composition,
    diagnostics,
    suggestions: suggestions.length ? suggestions.slice(0, 3) : ["Keep this password unique to one account and store it in a password manager."],
  };
}
