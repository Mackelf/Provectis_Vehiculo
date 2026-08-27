// Se ejecuta automáticamente después de "firebase deploy --only hosting"
// (configurado como "postdeploy" en firebase.json).
// Hace commit + push de cualquier cambio local a GitHub.

const { execSync } = require('child_process');

// Ajusta esto al repo correcto — el script aborta si el remoto no coincide.
const REPO_ESPERADO = 'Mackelf/Provectis_Vehiculo';

function run(cmd) {
  return execSync(cmd, { stdio: 'inherit' });
}

try {
  const remoto = execSync('git remote get-url origin').toString().trim();

  if (!remoto.includes(REPO_ESPERADO)) {
    console.error(`[postdeploy] ABORTADO: el remoto "origin" apunta a "${remoto}", no a "${REPO_ESPERADO}". No se hizo push.`);
    process.exit(1);
  }

  const status = execSync('git status --porcelain').toString().trim();

  if (!status) {
    console.log('[postdeploy] No hay cambios para commitear.');
    process.exit(0);
  }

  const fecha = new Date().toISOString().slice(0, 16).replace('T', ' ');

  console.log(`[postdeploy] Repo verificado (${remoto}). Haciendo commit + push...`);
  run('git add -A');
  run(`git commit -m "Deploy automatico ${fecha}"`);
  run('git push');
  console.log('[postdeploy] Listo.');
} catch (err) {
  console.error('[postdeploy] Error al hacer commit/push:', err.message);
  // No se relanza el error para que un fallo de git no marque el deploy como fallido.
}