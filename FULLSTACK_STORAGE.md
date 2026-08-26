# Fortify Field Notes — Persistent Data and Managed Storage

The full-stack version uses authenticated, user-scoped persistence. It retains a selected attacker-model preference and metadata for a report that a signed-in user explicitly creates. The original password input remains only in browser memory during the active assessment.

| Resource | Persistence location | Stored fields | Explicitly excluded |
|---|---|---|---|
| Attacker-model preference | `userSecurityPreferences` database table | User identifier, selected model, timestamps | Password, character content, pattern details |
| Sanitized assessment export | Managed object storage | JSON containing strength, score, entropy estimate, model, and timestamp | Password, fragments, common-word matches, sequences, raw diagnostics |
| Export metadata | `securityReportExports` database table | User identifier, storage key/URL, filename, report summary, timestamp | File bytes, password, password-derived text |

Signed-in users select a model in the **Offline simulation** section. The preference is saved to their account. When an assessment is on screen, the **Private record** section can create a sanitized JSON report. The server writes that report to managed object storage, retains its metadata in the database, and provides a link to the most recent record.

> The selected model is an arithmetic estimate. It does not activate Hydra, submit credentials, attempt logins, or perform password cracking.

## Database schema

The database includes three tables. The built-in `users` table comes from the authenticated full-stack foundation. The `userSecurityPreferences` table allows one saved model per user, and `securityReportExports` stores references to managed report files. Foreign-key deletion cascades remove a user’s related preference and report metadata when that user is removed.

## Validation completed

The database migration was generated and applied. The three expected tables were verified, the full project passed type checking and production build, and the automated test suite verifies that sanitized reports reject unapproved fields and do not serialize a password field.
