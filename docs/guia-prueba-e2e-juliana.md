# Guía de Prueba Interna — SPI Smart Flow
**Responsable:** Juliana Gallo  
**Plataforma:** https://spi-smart-flow.web.app  
**Fecha de prueba:** _______________

---

## Antes de empezar

Esta guía te lleva paso a paso por el flujo completo de la plataforma, desde crear una Orden de Trabajo hasta archivar los documentos en la Bóveda. Necesitarás **dos cuentas de Google** distintas:

| Rol | Cuenta sugerida |
|-----|----------------|
| **Administrador SPI** | Tu cuenta principal (la que ya tiene acceso de admin) |
| **Cliente de prueba** | Una segunda cuenta de Google (puede ser personal o un correo de prueba) |

Idealmente haz la prueba en dos navegadores o una ventana normal + una ventana de incógnito al mismo tiempo.

---

## PARTE 1 — Configuración inicial (solo la primera vez)

### Paso 1 — Configurar tipos de actuación
> Esto es el catálogo de trámites que ofrece SPI. Sin este paso, no se pueden crear OTs.

1. Entra a la plataforma con tu cuenta de **administrador**
2. En el menú lateral, haz clic en **"Tipos de Actuación"** (ícono de engranaje)
3. Crea al menos 2 tipos de trámite. Ejemplo:

   | Código | Nombre |
   |--------|--------|
   | `BUSQ` | Búsqueda de Antecedentes |
   | `REG-MCA` | Registro de Marca |
   | `REG-PAT` | Registro de Patente |

4. Para cada uno, define los **requisitos documentales** que el cliente deberá subir (ej: Poder Simple, Cédula del titular, Logo de la marca)

**¿Qué esperas ver?** Los tipos aparecen listados y puedes editarlos.

---

## PARTE 2 — Crear una Orden de Trabajo

### Paso 2 — Crear la OT (como Administrador)
1. Ve al **Dashboard principal** (Pipeline)
2. Haz clic en **"Crear OT Manual"** (botón azul, esquina superior derecha)
3. Completa el formulario:
   - **Área del trámite:** Propiedad Intelectual o Asuntos Regulatorios
   - **Tipo de actuación:** Selecciona uno de los que creaste en el Paso 1
   - **Cliente / Empresa:** Escribe el nombre de la empresa de prueba y selecciónala (o crea una nueva)
   - **Encargado Cliente:** Si la empresa ya tiene usuario registrado, aparecerá aquí
   - **Marca o asunto:** Escribe el nombre de la marca (ej: "FITBIOTIC")
   - **País del trámite:** Colombia (o el que corresponda)
   - **Monto y honorarios:** Puedes dejar en 0 para la prueba
   - **Pipefy Card ID:** Dejar vacío (no aplica para prueba interna)

4. Haz clic en **"Crear Orden de Trabajo"**

**¿Qué esperas ver?** Un mensaje de confirmación y la OT aparece en el Kanban en la columna "Solicitud".

---

## PARTE 3 — Registrar al cliente y activar su acceso

### Paso 3 — Primer ingreso del cliente (como Cliente)
> Cambia al segundo navegador / ventana de incógnito

1. Ve a **https://spi-smart-flow.web.app**
2. Haz clic en **"Continuar con Google"** y entra con la cuenta de prueba del cliente
3. Verás una pantalla de "Cuenta pendiente de activación" — esto es normal

**¿Qué esperas ver?** La plataforma dice que tu cuenta está siendo verificada.

### Paso 4 — Activar al cliente (como Administrador)
> Vuelve al navegador del administrador

1. En el **Dashboard**, verás un banner amarillo en la parte superior:  
   *"1 usuario pendiente de activación — [email del cliente]"*
2. Haz clic en **"Activar"** — esto te lleva a la página de Empresas
3. En la sección **"Usuarios pendientes de activación"** (parte superior, fondo amarillo), busca al cliente recién registrado
4. Haz clic en el ícono de engranaje ⚙️ al lado de su nombre
5. En el modal que aparece:
   - **Rol de Acceso:** Cambia a "Cliente Activo"
   - **Empresa Vinculada:** Selecciona la empresa que creaste en el Paso 2
6. Haz clic en **"Aplicar Cambios"**

**¿Qué esperas ver?** El usuario desaparece de la sección amarilla y aparece dentro de la empresa correspondiente.

### Paso 5 — El cliente accede a su tablero
> Vuelve al navegador del cliente

1. Recarga la página (F5)
2. Ahora deberías ver el tablero del cliente con la OT creada en el Paso 2

**¿Qué esperas ver?**
- 3 tarjetas en la parte superior: **Activas / Pendientes / Finalizadas**
- La OT aparece listada con su estado "Solicitud"
- Si hay documentos pendientes de subir, la tarjeta "Pendientes" se muestra en **rojo**

---

## PARTE 4 — Flujo de documentos

### Paso 6 — El cliente sube sus documentos
> Como Cliente

1. En la lista de OTs, haz clic en **"Completar solicitud"** (botón de la OT)
2. Verás el checklist de requisitos configurados por el admin
3. Sube cada documento requerido (puedes usar archivos PDF de prueba)
4. La plataforma analizará automáticamente cada documento con IA

**¿Qué esperas ver?** Cada documento cambia de estado:
- 🔴 Pendiente → 🔵 En análisis → ✅ Validado (si la IA lo aprueba automáticamente)
- Si no se aprueba solo, queda en "Requiere revisión manual"

### Paso 7 — El admin revisa documentos (si aplica)
> Como Administrador

1. En el **Dashboard**, verás los documentos pendientes de revisión en el panel derecho
2. Haz clic en el documento para verlo y elige **Aprobar** o **Rechazar**

---

## PARTE 5 — Flujo de pagos

### Paso 8 — El cliente sube el comprobante de pago adelanto
> Como Cliente

1. Dentro de la OT, busca la sección de **"Pago Adelanto"**
2. Haz clic en **"Subir comprobante"**
3. Selecciona un archivo de imagen o PDF que simule una transferencia
4. Completa los datos: fecha, monto, tipo de pago
5. Envía el comprobante

**¿Qué esperas ver?** El comprobante queda en estado "Pendiente de revisión".

### Paso 9 — El admin aprueba el comprobante
> Como Administrador

1. En la OT (puedes abrirla desde el Kanban), ve a la sección de pagos
2. Verás el comprobante subido por el cliente
3. Haz clic en **"Aprobar"**

**¿Qué esperas ver?** El comprobante cambia a "Aprobado" y aparece automáticamente en la **Bóveda** del cliente.

---

## PARTE 6 — Avance de etapas y firma de documentos

### Paso 10 — Avanzar la OT por el Kanban
> Como Administrador

1. En el **Dashboard → Kanban**, arrastra la OT de una columna a la siguiente:
   - `Solicitud` → `Pago Adelanto` → `Gestión` → `Pago Cierre` → `Finalizado`
2. También puedes hacer clic en la OT y cambiar la etapa desde el detalle

**¿Qué esperas ver?** La OT se mueve entre columnas y el cliente ve el cambio de estado reflejado en tiempo real.

### Paso 11 — Firma del poder notarial (si aplica)
> Como Cliente

1. Dentro de la OT, si hay un requisito de "Firma Digital", haz clic en él
2. Sigue el proceso de firma electrónica
3. El documento firmado queda guardado automáticamente

---

## PARTE 7 — Verificar la Bóveda

### Paso 12 — Revisar la Bóveda del cliente
> Como Cliente

1. En el menú lateral, haz clic en **"Bóveda"**
2. Deberías ver:
   - El comprobante de pago aprobado
   - Los poderes legales firmados
   - Otros documentos validados

**¿Qué esperas ver?** Los documentos aparecen con opción de descarga o visualización.

### Paso 13 — Revisar la Bóveda del administrador
> Como Administrador

1. En el menú lateral, haz clic en **"Bóveda SPI"**
2. Confirma que los documentos del cliente también están visibles desde el lado admin

---

## Qué reportar

Para cada paso, anota:

| Paso | ¿Funcionó? | ¿Qué observaste? | ¿Hubo algún error? |
|------|-----------|-------------------|---------------------|
| 1 — Tipos de actuación | Sí / No | | |
| 2 — Crear OT | Sí / No | | |
| 3 — Ingreso cliente | Sí / No | | |
| 4 — Activar cliente | Sí / No | | |
| 5 — Tablero cliente | Sí / No | | |
| 6 — Subir documentos | Sí / No | | |
| 7 — Revisar docs (admin) | Sí / No | | |
| 8 — Comprobante cliente | Sí / No | | |
| 9 — Aprobar comprobante | Sí / No | | |
| 10 — Avanzar Kanban | Sí / No | | |
| 11 — Firma digital | Sí / No | | |
| 12 — Bóveda cliente | Sí / No | | |
| 13 — Bóveda admin | Sí / No | | |

---

## Errores comunes y soluciones

| Error | Solución |
|-------|----------|
| "No hay tipos de actuación" al crear OT | Ir a Configuración → Tipos de Actuación y crear al menos uno |
| El cliente no ve su OT después de activar | El cliente debe recargar la página (F5) |
| El banner de usuarios pendientes no aparece | Esperar 10-15 segundos y recargar el dashboard del admin |
| El documento subido queda en "En análisis" por mucho tiempo | Verificar que el archivo sea legible (no escaneado en baja calidad) |
| El comprobante no aparece en la Bóveda | Verificar que el admin lo haya marcado como "Aprobado" |

---

## Contacto técnico

Ante cualquier problema que no esté en la tabla anterior, captura una imagen de pantalla y escríbela junto con el número de paso donde ocurrió.

**Gracias por tu tiempo en esta prueba, Juliana. Tu feedback es fundamental para pulir la plataforma antes del lanzamiento.**
