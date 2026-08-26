# Formularios Provectis

Sistema de formularios y seguimiento para las operaciones de Provectis en Chilquinta Energía: checklists de vehículos y equipos, generación de correos tipo, y seguimiento de casos de asignación/retiro de equipos.

Está construido como una **Single Page Application en un único archivo `index.html`**, sin proceso de build (no hay `npm install` ni bundler) — se edita y se despliega directo.

---

## Stack

| Tecnología | Uso |
|---|---|
| Vue 3 (CDN global) | UI reactiva y componentes |
| Vue Router 4 (CDN, modo hash) | Navegación entre las 4 vistas, sin necesitar rewrites en el hosting |
| Bootstrap 5.3 | Estilos, layout, formularios |
| Firebase Firestore | Base de datos en tiempo real (historiales, configuración compartida) |
| Firebase Authentication (Google) | Login y control de acceso por roles |
| Firebase Hosting (multi-sitio) | Deploy del sitio estático a dos URLs simultáneas durante la marcha blanca |
| jsPDF + jspdf-autotable | Generación de los PDF de checklist en el navegador |
| GitHub Actions | Deploy automático a Firebase Hosting en cada push/PR |

No hay backend propio: toda la persistencia vive en Firestore y el archivo se sirve tal cual desde Firebase Hosting.

---

## Cómo funciona

1. **Un solo archivo (`index.html`)** contiene HTML, CSS y JS. Cada vista es un componente Vue definido como objeto con `template` (string) y `setup()`, registrado en Vue Router.
2. **Login obligatorio**: al abrir la app, si Firebase Auth está configurado, se muestra una pantalla de login con Google. Solo los correos listados en `USUARIOS_AUTORIZADOS` (dentro del código) pueden entrar. Cada correo tiene un rol:
   - **admin**: además de usar la app, puede editar y borrar registros del historial en cada vista.
   - **tecnico**: puede llenar formularios, guardar y generar PDF, pero no editar ni borrar registros ya guardados.
3. **Datos compartidos en Firestore**: información que no cambia por cada formulario (kilometrajes de mantención, diagrama de daños del vehículo, lista de técnicos autorizados) se guarda en documentos de configuración (`config/...`) y se sincroniza en tiempo real a todos los que tengan la app abierta, con botones "Actualizar" para editarlos.
4. **Historiales**: cada checklist/caso generado queda guardado en una colección de Firestore, listado en una tabla con opción de volver a descargar el PDF (y, según el caso, editar o borrar).
5. **Deploy dual (marcha blanca)**: el mismo contenido se publica en dos sitios de Firebase Hosting (`checklist-vehiculo-provectis.web.app` y `formularios-provectis.web.app`) mientras se decide la URL definitiva. Un script `postdeploy.js` hace commit y push automático a GitHub después de cada deploy.

---

## Las 4 vistas

### 1. Checklist Vehículo (`/`)
Digitaliza el checklist físico de inspección de vehículos Provectis (patente fija). Incluye:
- Datos generales (técnico, fecha, ciudad, proyecto, kilometrajes).
- Alerta automática cuando el KM actual supera el KM de próxima mantención.
- Diagrama de 4 ángulos del vehículo (frente, atrás, costados) con fotos reales, sobre los que se puede **dibujar** para marcar daños (canvas), guardando el resultado como imagen fija.
- Checklist de seguridad (3 estados: Buen/Regular/Mal estado), documentos, neumáticos, luces y herramientas (Sí/No, con "seleccionar todo" por sección).
- Botón **Generar PDF** que replica el formato original y guarda automáticamente una copia en el historial.

### 2. Plantillas Provectis (`/plantillas`)
Generador de correos tipo para gestión de equipos (dirigidos al Encargado de Inventario): Asignar equipo, GDD (guía de despacho), ABM de asignación, Retirar equipo, Borrado Seguro. Cada plantilla tiene sus propios campos; el correo se arma automáticamente en un cuadro de texto listo para copiar y pegar.

### 3. Checklist Equipos (`/equipos`)
Digitaliza el checklist de configuración/instalación de equipos de TI (hostname, modelo, S/N, sistema operativo, y checklist de software/configuración de seguridad). A diferencia del checklist de vehículo, este **usa el N° de Ticket como identificador único**: si escribes un ticket ya existente, la app ofrece cargarlo para seguir editándolo en vez de crear uno duplicado. Botones **Guardar** (sin generar PDF) y **Generar PDF** (genera y guarda) por separado.

### 4. Seguimiento (`/seguimiento`)
Tablero de seguimiento por caso (usuario, equipo, ticket/lugar, técnico a cargo) a través de las 6 etapas del proceso de asignación/retiro de equipos: Checklist, Asignación, GDD, ABM Asignación, ABM Retiro/Baja y Borrado Seguro. Cada etapa muestra sus propios checkboxes y un botón que cambia de **rojo (pendiente) a verde (completa)** automáticamente cuando todos sus checkboxes quedan marcados. Cada etapa tiene un atajo directo a su plantilla de correo (vista 2) o al Checklist de Equipos (vista 3), con los datos del caso ya precargados. El historial de casos muestra el avance (X/6 etapas) de un vistazo.

---

## Estructura del proyecto

```
Checklist vehiculo/
├── index.html          # Aplicación completa (HTML + CSS + JS, las 4 vistas)
├── firebase.json        # Configuración de Firebase Hosting (2 sitios)
├── postdeploy.js         # Script de commit+push automático tras el deploy
└── README.md
```

---

## Configuración y despliegue

- **Firebase**: proyecto `checklist-vehiculo-provectis`, con Firestore, Authentication (Google) y Hosting habilitados.
- **Usuarios autorizados**: se editan directamente en el código, en el objeto `USUARIOS_AUTORIZADOS` (correo → `'admin'` o `'tecnico'`).
- **Deploy manual**:
  ```powershell
  firebase deploy --only hosting
  ```
  Publica a ambos sitios y, si `postdeploy.js` detecta cambios locales, hace commit + push automático a GitHub.
- **Deploy automático**: GitHub Actions despliega a Firebase Hosting en cada push/PR a la rama principal (workflows en `.github/workflows/`).
