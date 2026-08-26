# Fortify Vault and Mobile Installation Design

## Privacy boundary

Fortify will not write a plaintext password, vault label, website, username, master secret, or decryption key to its database, managed file store, logs, or reports. A user unlocks the vault locally with a vault passphrase. The browser uses Web Crypto to derive a session-only AES-GCM key from that passphrase and a per-item random salt. The server receives only an encrypted ciphertext, IV, KDF salt, KDF-version marker, and ownership/timestamp metadata.

> If a user forgets the vault passphrase, the encrypted payload cannot be recovered by the service. No recovery mechanism is being represented as available.

| Layer | Data held | Explicitly excluded |
|---|---|---|
| Browser memory | Vault passphrase, derived key, plaintext entry while unlocked | Persistent storage of key or passphrase |
| Database | User ID, ciphertext, IV, salt, KDF marker, timestamps | Password, title, username, URL, note, key material |
| Managed file store | Not used for vault entries | All vault bytes |
| Sanitized reports | Strength summary only | Password and vault content |

## Account options

The built-in authenticated foundation remains the current production sign-in method. A direct **Google OAuth** option requires a user-owned Google Cloud OAuth client ID and client secret. A direct **email magic-link** option requires a transactional-email provider, verified sending domain, and provider credential. No compatible Google OAuth or transactional-email provider has been configured in this project, so those controls must stay unavailable until the required credentials and redirect settings are supplied.

## Phone installation

The web app will be made installable through a web app manifest, standalone display mode, a same-origin service worker, and an install surface. Android browsers that support installation can use the in-app install action. On iPhone/iPad, the user will use the browser share menu and choose **Add to Home Screen**. The Chrome extension remains a separately installed browser package and can link to the phone-installable companion web app.

## Extension and hosted app

The extension will continue to perform strength analysis locally. It can save selected model preferences and sanitized reports through the protected companion bridge. Encrypted vault entries are created and unlocked only in the installed web app, not automatically extracted from browser pages or the extension popup.
