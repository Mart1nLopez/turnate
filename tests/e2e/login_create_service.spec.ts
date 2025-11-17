import { test, expect } from '@playwright/test';

const TEST_USER_EMAIL = 'testeo@mail.com';
const TEST_USER_PASSWORD = 'Test2025';

test.describe('Flujo del Profesional - Gestión de Servicios', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder('juan@ejemplo.com').fill(TEST_USER_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    // Esperar a que la redirección al dashboard ocurra
    await expect(page).toHaveURL('/dashboard');
  });

  test('Login verificación', async ({ page }) => {
    // La navegación ya se hizo en el beforeEach
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  // Esta es la prueba principal de este archivo.
  test('Un profesional puede crear un nuevo servicio', async ({ page }) => {
    
    // 1. Navegar a la página de "Servicios"
    await page.getByRole('link', { name: 'Servicios' }).click();
    
    // Verificamos que llegamos a la página correcta
    await expect(page).toHaveURL('/dashboard/servicios');
    await expect(page.getByRole('heading', { name: 'Servicios' })).toBeVisible();

    // 2. Abrir el formulario para crear un servicio
    await page.getByRole('button', { name: 'Añadir Servicios' }).click();

    // Esperamos que el formulario aparezca
    await expect(page.getByRole('heading', { name: 'Nuevo Servicio' })).toBeVisible();

    // 3. Rellenar el formulario
    // Usamos un nombre único con la fecha para que la prueba no falle
    // si se ejecuta varias veces.
    const serviceName = `Servicio de Prueba ${Date.now()}`;
    const servicePrice = '15000';
    const serviceDuration = '45';

    await page.getByPlaceholder('Ej: Corte de cabello').fill(serviceName);
    await page.getByPlaceholder('15000').fill(servicePrice);
    await page.getByPlaceholder('30').fill(serviceDuration);
    
    await page.getByPlaceholder('Describe tu servicio...').fill('Esta es una descripción de prueba automatizada.');

    // 4. Enviar el formulario
    await page.getByRole('button', { name: 'Crear Servicio' }).click();

    // 5. Verificar que el servicio se creó
    
    // A. Verificar que el toast (notificación) de éxito aparece
    await expect(page.getByText('Servicio creado exitosamente')).toBeVisible();

    // B. Verificar que el formulario se cerró
    await expect(page.getByRole('heading', { name: 'Nuevo Servicio' })).not.toBeVisible();

    // C. Verificar que la nueva tarjeta de servicio aparece en la lista
    // Buscamos un div (Card) que contenga un heading (h3) con el nombre de nuestro servicio.
    const newServiceCard = page.locator('div.grid > div').filter({
      has: page.getByRole('heading', { name: serviceName })
    });

    // Verificamos que la tarjeta exista
    await expect(newServiceCard).toBeVisible();

    // D. Verificamos que los datos dentro
    // de la tarjeta son correctos.
    await expect(newServiceCard.getByText('45 min')).toBeVisible();
    await expect(newServiceCard.getByText('$15.000')).toBeVisible(); // Tu app formatea '15000' como '$15.000'
  });

});