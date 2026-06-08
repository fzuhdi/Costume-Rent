import { interpolateRuntimeValue, runtimeEnvKey } from './config.mjs';
import { playwrightEnv } from './playwright-artifacts.mjs';

export function portsForSlot(runtimeConfig, slot) {
  const slotStep = Number(runtimeConfig.slot_step);
  return {
    frontend: Number(runtimeConfig.base_ports?.frontend) + slotStep * slot,
    backend: Number(runtimeConfig.base_ports?.backend) + slotStep * slot,
    sqlite: Number(runtimeConfig.base_ports?.sqlite) + slotStep * slot,
  };
}

export function runtimeEnvForSlot(projectConfig, root, slot, project) {
  const runtimeConfig = projectConfig.runtime || {};
  const ports = portsForSlot(runtimeConfig, slot);
  const suffix = slot === 0 ? project : `${project}`;
  const env = {
    [runtimeEnvKey(runtimeConfig, 'container_prefix', 'APP_CONTAINER_PREFIX')]: project,
    [runtimeEnvKey(runtimeConfig, 'frontend_host_port', 'FRONTEND_HOST_PORT')]: String(ports.frontend),
    [runtimeEnvKey(runtimeConfig, 'backend_host_port', 'BACKEND_HOST_PORT')]: String(ports.backend),
    [runtimeEnvKey(runtimeConfig, 'sqlite_web_host_port', 'SQLITE_WEB_HOST_PORT')]: String(ports.sqlite),
    [runtimeEnvKey(runtimeConfig, 'db_volume', 'APP_DB_VOLUME')]: `${runtimeConfig.volume_prefixes?.db || 'app_db'}_${suffix}`,
    [runtimeEnvKey(runtimeConfig, 'frontend_node_modules_volume', 'APP_FRONTEND_NODE_MODULES_VOLUME')]: `${runtimeConfig.volume_prefixes?.frontend_node_modules || 'app_frontend_node_modules'}_${suffix}`,
    [runtimeEnvKey(runtimeConfig, 'vite_dev_port', 'VITE_DEV_PORT')]: String(runtimeConfig.vite_dev_port || 5173),
    [runtimeEnvKey(runtimeConfig, 'playwright_base_url', 'PW_BASE_URL')]: `http://localhost:${ports.frontend}`,
    ...playwrightEnv(runtimeConfig, projectConfig, root, slot === 0 ? '' : project),
  };

  for (const [key, value] of Object.entries(runtimeConfig.env_values || {})) {
    env[key] = interpolateRuntimeValue(value, env);
  }

  return env;
}
