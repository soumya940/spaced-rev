# Space Revision Checklist – Android app (Capacitor)

Your original web app (`www/index.html`) wrapped as a native Android app.
Features kept: all UI/themes, local storage of your data, JSON export (share sheet) and import, sounds, revision notifications, Android back button handling.

## Build with GitHub (no Android Studio needed)
1. Put everything from this zip in the ROOT of your repository (this README next to `package.json`).
2. Add the workflow file `.github/workflows/build-android.yml` (provided separately).
3. Push to `main` (or run the workflow manually: Actions -> Build Android APK -> Run workflow).
4. When it finishes, open the run -> **Artifacts** -> download `SpaceRevision-APK` -> install the `.apk` on your phone.

## Build locally (Android Studio)
```
npm install
npm run android:add     # creates android/, applies icons + permissions
npm run android:open    # opens Android Studio
```
After editing `www/index.html`: `npm run android:sync`.

## Important
- `app-signing.p12` is the key that signs your APK. Every build uses it, so new versions install over old ones and keep your data. Don't change/delete it. If your repo is public, anyone could sign an APK with it; for a personal study app that's fine, otherwise make the repo private.
- Keep `appId` (`com.spacerevision.checklist`) and `androidScheme: https` unchanged; your saved data is tied to them.
- Icons: edit `resources/logo-source.png`, run `python3 scripts/generate-icons.py` (needs Pillow, numpy).
