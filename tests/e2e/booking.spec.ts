// tests/e2e/booking.spec.ts
import { test, expect } from '@playwright/test';

const TEST_SLUG = 'benjiluks'; 

test.describe('Flujo de Reserva de Cita', () => {

  test('Un cliente puede reservar una cita exitosamente', async ({ page }) => {
    // 1. Ir a la página de agendamiento
    await page.goto(`/${TEST_SLUG}/agendar`);
    console.log(`Navegando a /${TEST_SLUG}/agendar...`);

    // 2. Seleccionar un servicio
    // (Basado en tu componente ServiceSelector.tsx)
    // Asumimos que tienes un servicio llamado 'Corte de Cabello'
    await page.getByRole('heading', { name: 'Corte de Cabello' }).click();
    console.log('Servicio seleccionado.');

    // 3. Seleccionar una fecha
    // Hacemos clic en un día, por ejemplo, el 25.
    // Usamos 'exact: true' para evitar conflictos si '2' o '5' existen en otro texto.
    await page.locator('#calendar-section').getByRole('button', { name: '25', exact: true }).click();
    console.log('Fecha seleccionada.');

    // 4. Seleccionar un horario
    await page.locator('#time-slot-selector').getByRole('button', { name: '03:10' }).click();
    console.log('Hora seleccionada.');

    // 5. Clic en "Continuar"
    await page.getByRole('button', { name: 'Continuar' }).click();
    console.log('Formulario de cliente cargado.');

    // 6. Rellenar el formulario del cliente
    await page.getByPlaceholder('tu@email.com').fill('cliente.prueba@gmail.com');
    await page.getByPlaceholder('Tu nombre completo').fill('Cliente de Prueba');
    // Playwright es rápido, esperamos que el input de teléfono esté listo
    await page.waitForSelector('input[placeholder="12345678"]');
    await page.getByPlaceholder('12345678').fill('98765432');
    console.log('Formulario de cliente rellenado.');

    // 7. Confirmar la cita
    await page.getByRole('button', { name: 'Confirmar Cita' }).click();
    console.log('Confirmando cita...');

    // 8. Verificar el resultado
    
    // Esperamos la notificación de éxito (viene de 'sonner')
    await expect(page.getByText('¡Cita agendada exitosamente! Te hemos enviado un correo de confirmación.')).toBeVisible({ timeout: 10000 });

    console.log('¡Toast de éxito visible!');

    // Verificamos que se redirige de vuelta a la página del profesional
    await expect(page).toHaveURL(`/${TEST_SLUG}`, { timeout: 5000 });
    console.log('Redirección a página de perfil confirmada.');
  });

});