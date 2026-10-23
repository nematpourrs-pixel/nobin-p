# Nobin 2.2.3 / Android CafeBazaar release notes
- Android package: ir.nobin.app; versionName 2.2.3; versionCode 20203.
- Admin package: ir.nobin.admin; versionName 1.0.3; versionCode 10003.
- All legacy Alert.alert calls were migrated to the application-wide, Persian, accessible Nobin dialog.
- The dialogs have visual states for success/errors/confirmation, proper destructive actions, and user-choice callbacks.
- The same approved icon source is used; the adaptive foreground is intentionally 440/1024 px, fully inside Android's 66/108 circular safe zone.
- Android build artifacts created by CI are UNSIGNED. Publishing an update requires signing with the existing release keystore. Do NOT create a new signing key for upgrades.
- Storefront acceptance or a Google Play Protect clean verdict cannot be guaranteed without scans and testing on devices.
- Minimal permissions; release build excludes debug signing; data backup disabled; cleartext traffic disabled.
- Tests: CI Typecheck, Expo Android export, Android release APK/AAB build; human device checks still required.
