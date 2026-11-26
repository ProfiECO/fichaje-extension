# Fichaje Frappe HR

Extensión de Chrome Manifest V3 para registrar entradas y salidas en una instancia de Frappe HR. React, Tailwind CSS y Vite, sin servidor propio ni librería de estado adicional.

## Funcionalidades

- Entrada y salida con el estado del último fichaje y cronómetro de sesión.
- Horas de hoy y resumen semanal en tiempo real mientras el popup está abierto.
- Objetivos diarios y semanales configurables, guardados en este navegador.
- Consulta de semanas anteriores e historial de entradas y salidas.
- Exportación del resumen de la semana seleccionada a CSV, compatible con Excel.
- Actualización manual y comprobación del estado antes de enviar un fichaje.
- Geolocalización cuando la configuración de Frappe HR lo exige.
- Tema claro u oscuro según el sistema y soporte de movimiento reducido.

Los objetivos son orientativos: no modifican horarios, descansos ni registros del servidor. Las pausas se registran como salida y posterior entrada.

## Actualizar la versión que ya tienes instalada

Si cargaste esta misma carpeta siguiendo las instrucciones antiguas:

1. Mantén la extensión instalada y conserva esta carpeta en su ubicación original.
2. Desde esta carpeta ejecuta:

   ```bash
   npm ci
   npm run check
   ```

3. Abre `chrome://extensions`, activa **Modo de desarrollador** y pulsa el botón **Recargar** de **Fichaje Frappe HR**.
4. Abre el popup. La cuenta y los permisos se conservan porque seguimos usando la misma extensión y la clave `config` de `chrome.storage.local`.

La compilación actualiza el manifiesto de la raíz para abrir `dist/popup.html`. Esto permite mantener la instalación original. No cargues `dist/` como una segunda extensión si quieres conservar esa instalación.

Si tu versión instalada apunta a otra carpeta, actualiza el código y compila en aquella carpeta, o instala `dist/` y vuelve a conectar tu cuenta. Al cargar una ruta diferente puede cambiar el identificador y no se transfieren los datos automáticamente. Desactiva la versión anterior para evitar dos extensiones activas.

## Instalación nueva

Requiere Node.js 22.12 o superior compatible con las dependencias instaladas y npm.

```bash
npm ci
npm run check
```

En `chrome://extensions`, activa **Modo de desarrollador**, selecciona **Cargar extensión sin empaquetar** y elige la carpeta `dist/` de este proyecto. Abre la extensión, introduce el dominio de Frappe HR, tu usuario y contraseña, y acepta el permiso para ese dominio.

## Desarrollo

```bash
npm run build:watch  # Recompila al guardar; recarga la extensión en Chrome
npm test            # Cálculos, API, flujos de fichaje e interacción React
npm run build       # Genera dist/ y el manifiesto de compatibilidad de la raíz
npm run format      # Aplica el formato compartido
npm run check       # Formato, pruebas y compilación de producción
```

La extensión utiliza las API de Chrome: se prueba instalada en el navegador, sin un servidor de desarrollo. `dist/` es un artefacto generado y no se versiona. No contiene dependencias de desarrollo ni secretos de la cuenta.

## Estructura

```text
extension/                Configuración del manifiesto de Chrome
scripts/                  Compilación y compatibilidad de instalación
src/
  app/                    Composición del popup y coordinación de estado
  features/
    connection/           Formulario de conexión
    tracking/             API de fichajes, jornada, semanas, historial y CSV
    preferences/          Objetivos y gestión de cuenta
  shared/
    api/                  Transporte HTTP, sesión y CSRF de Frappe
    lib/                  Storage de Chrome, fechas y geolocalización
    ui/                   Iconos y componentes de progreso reutilizables
  styles.css              Tailwind, tokens de tema y estilos base
  main.jsx                Punto de entrada de React
tests/                    Pruebas con Node y DOM simulado
```

Añade funcionalidades dentro de `features/`; lleva a `shared/` únicamente código reutilizado entre funcionalidades. `app/` las compone y coordina los flujos asíncronos. El manifiesto se define en `extension/manifest.js`; la versión se toma de `package.json` y se comparte con la UI. No hacen falta paquetes internos por ahora; la configuración de extensión ya está separada para extraerla si aparecen varias aplicaciones.

## Sesión, precisión y errores

- Se utiliza la cookie de sesión del navegador, compartida con la web de Frappe HR. Desconectar borra las credenciales locales; no cierra la sesión de la web.
- Como en la versión anterior, las credenciales se guardan **sin cifrar** en `chrome.storage.local` para renovar una sesión caducada. No se incluyen en exportaciones.
- Las fechas de Frappe no incluyen zona horaria. Se interpretan en la zona del navegador, que debe coincidir con la del servidor. Los cálculos reparten turnos entre días y tienen en cuenta el cambio de hora local.
- El cálculo usa parejas IN/OUT, mantiene la primera entrada de una secuencia repetida e incluye el registro previo a la semana para contar turnos que atraviesan el lunes. Las horas calculadas pueden diferir de los ajustes de asistencia, redondeos o descansos de Frappe.
- No se permite fichar hasta cargar correctamente los ajustes de HR. Antes de enviar se consulta el último registro para detectar cambios de otro dispositivo; esto reduce errores, aunque no puede garantizar exclusión entre dos clientes simultáneos.
- Si falla la conexión durante el envío, no se reintenta automáticamente. El botón queda bloqueado hasta actualizar y comprobar el último registro.
- El reloj local se actualiza cada segundo. Los cambios realizados desde otros dispositivos se consultan al abrir, al pulsar Actualizar y antes de fichar.

Las pruebas usan respuestas simuladas y no realizan fichajes reales. Tras instalar, comprueba la conexión, los datos y, cuando corresponda tu siguiente fichaje, el registro en tu instancia de Frappe HR. La validación contra un servidor real requiere una cuenta autorizada.
