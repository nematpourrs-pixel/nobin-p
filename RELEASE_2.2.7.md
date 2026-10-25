# Nobin 2.2.7 — Launcher icon and time-picker safe area
- Enlarged the existing approved calendar and two-face artwork on Samsung One UI and other Android launchers by cropping the oversized gold/white frame.
- The adaptive icon's light background fades into a matching white background, rather than rendering a small image surrounded by white padding.
- The time picker uses safe-area bottom inset and a scrollable time grid with a pinned 52dp confirmation button, preventing Android 3-button navigation overlap.
- Retains 2.2.6 multi-shift calendar, Persian numbers, and the existing application identity and signing requirements.
- CafeBazaar versionCode 20207, versionName 2.2.7.
- Release CI creates UNSIGNED APK/AAB; verify and sign with the existing Nobin release key after build.
