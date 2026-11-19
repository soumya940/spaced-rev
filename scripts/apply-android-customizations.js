#!/usr/bin/env node
/* Run AFTER `npx cap add android` (and safe to re-run).
   - replaces the default Capacitor icons/splash with the custom logo set
   - adds notification / alarm permissions to AndroidManifest.xml
   - sets version code/name and release signing in app/build.gradle            */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const app = path.join(root, 'android', 'app');
const res = path.join(app, 'src', 'main', 'res');
if (!fs.existsSync(res)) { console.error('android/ not found - run "npx cap add android" first'); process.exit(1); }

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const copyDir = (src, dst) => { fs.mkdirSync(dst, { recursive: true }); for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s = path.join(src, e.name), d = path.join(dst, e.name); e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d); } };

/* 1. remove default launcher + splash resources */
let removed = 0;
for (const f of walk(res)) {
  const b = path.basename(f);
  if (/^ic_launcher.*/.test(b) || /^splash\.(png|xml|jpg)$/.test(b)) { fs.rmSync(f); removed++; }
}
console.log('removed default icon/splash files:', removed);

/* 2. copy custom resources over */
copyDir(path.join(root, 'android-overlay', 'res'), res);
console.log('custom icons, splash, theme copied');

/* 3. manifest permissions */
const mf = path.join(app, 'src', 'main', 'AndroidManifest.xml');
let m = fs.readFileSync(mf, 'utf8');
const perms = ['android.permission.POST_NOTIFICATIONS', 'android.permission.SCHEDULE_EXACT_ALARM', 'android.permission.RECEIVE_BOOT_COMPLETED', 'android.permission.VIBRATE', 'android.permission.WAKE_LOCK'];
const add = perms.filter(p => !m.includes(p)).map(p => `    <uses-permission android:name="${p}" />\n`).join('');
if (add) m = m.replace(/<\/manifest>/, add + '</manifest>');
if (!/android:icon=/.test(m)) m = m.replace('<application', '<application android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher_round"');
fs.writeFileSync(mf, m);
console.log('manifest permissions ensured');

/* 4. version + signing */
const gf = path.join(app, 'build.gradle');
let g = fs.readFileSync(gf, 'utf8');
const code = parseInt(process.env.VERSION_CODE || '1', 10) || 1;
const name = process.env.VERSION_NAME || '1.0.0';
g = g.replace(/versionCode\s+\d+/, 'versionCode ' + code).replace(/versionName\s+"[^"]*"/, 'versionName "' + name + '"');
if (!g.includes('// ---- custom signing ----')) {
  const ks = path.join(root, 'app-signing.p12').replace(/\\/g, '/');
  g += `
// ---- custom signing ----
android {
    signingConfigs {
        appsigning {
            storeFile file("${ks}")
            storeType "pkcs12"
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: "spacerev2026"
            keyAlias "spacerevision"
            keyPassword System.getenv("KEYSTORE_PASSWORD") ?: "spacerev2026"
        }
    }
    buildTypes {
        release { signingConfig signingConfigs.appsigning }
        debug { signingConfig signingConfigs.appsigning }
    }
}
`;
}
fs.writeFileSync(gf, g);
console.log('versionCode', code, 'versionName', name, '+ signing configured');
