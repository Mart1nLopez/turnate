// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

// Lee la URL base del .env, o usa localhost:3000 por defecto
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  // Carpeta donde vivirán tus pruebas
  testDir: './tests/e2e', 

  // Tiempo máximo que puede durar una prueba (ej. 30 segundos)
  timeout: 30 * 1000,

  expect: {
    timeout: 5000
  },

  fullyParallel: true, // Correr pruebas en paralelo
  retries: process.env.CI ? 2 : 0, // Reintentar 2 veces en CI, 0 localmente
  workers: process.env.CI ? 1 : undefined, // Cantidad de workers

  // Reporter
  reporter: 'html',

  // Configuración MÁGICA:
  // Esto le dice a Playwright que inicie tu servidor de Next.js
  // antes de ejecutar cualquier prueba.
  webServer: {
    command: 'npm run dev', // El comando para iniciar tu app
    url: baseURL,
    timeout: 120 * 1000, // 2 minutos para que inicie
    reuseExistingServer: !process.env.CI, // Reusa el server si ya está corriendo
  },

  // URL base para que tus pruebas usen rutas relativas (ej. page.goto('/'))
  use: {
    baseURL: baseURL,
    trace: 'on-first-retry', // Graba un "video" de la prueba si falla
  },

  // Configura los navegadores que quieres probar
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});