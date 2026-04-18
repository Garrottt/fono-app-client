# Prompt para Stitch

Usa este prompt en Stitch para generar una interfaz mobile-first para una app clínica de fonoaudiología llamada **FonoWebApp**.

## Prompt

Diseña una interfaz moderna, limpia, profesional y mobile-first para una app clínica llamada FonoWebApp.

Quiero una experiencia visual clara, confiable y muy intuitiva para profesionales de salud. La app debe sentirse premium pero humana: fondos suaves, tarjetas elevadas, navegación muy clara, estados visuales fáciles de entender, espaciado generoso, tipografía elegante sin verse fría, y jerarquía visual fuerte.

### Dirección visual
- Estilo: moderno, limpio, clínico, profesional, minimalista con calidez.
- Priorizar mobile-first, pero que escale bien a tablet y desktop.
- Usar una base clara con fondos tipo glass / surfaces suaves.
- Paleta sugerida: teal profundo, slate, blanco, acentos sky, y alertas amber/rose.
- Evitar look genérico SaaS. Debe sentirse una herramienta clínica especializada.
- Navegación inferior en mobile y sidebar en desktop.
- Mucha claridad de estados: pendiente, actualizado, con alertas, no apto, programada, completada.

### Estructura general de producto
Crear vistas consistentes para estos módulos:
1. Inicio
2. Pacientes
3. Anamnesis
4. Pre-Lavado
5. Citas

### Requisitos UX globales
- Todo debe ser fácil de entender en menos de 5 segundos.
- Priorizar acciones rápidas y contexto visible.
- Mostrar resúmenes antes de formularios largos.
- Mantener continuidad visual entre módulos.
- Diseñar para uso frecuente desde celular por profesionales en jornada clínica.

### Pantalla: Inicio
- Hero principal con resumen del día.
- KPIs rápidos: citas de hoy, pacientes activos, citas completadas.
- Calendario mensual visual con tarjetas de citas por día.
- Panel lateral o inferior con detalle del día seleccionado.
- Tarjeta de “próximas citas”.
- Formulario corto de “agendar desde inicio”.
- Reagendado rápido vía interacción visual.

### Pantalla: Pacientes
- Header con mensaje claro y CTA para nuevo paciente.
- Métricas: total pacientes, con portal, con avance clínico.
- Buscador prominente.
- Lista o grid de pacientes con:
  - nombre
  - edad
  - email
  - teléfono
  - diagnóstico breve
  - badges de estado (portal, anamnesis, pre-lavado)
- CTA secundaria para ver ficha.
- Visualización pensada primero en cards mobile.

### Pantalla: Anamnesis
- Selector de paciente muy claro.
- Hero del módulo con foco en antecedentes y alertas.
- Mostrar estado del registro y contador de alertas antes del formulario.
- Formulario clínico organizado por bloques, no como lista interminable.
- Hacer visibles los factores de riesgo y red flags.
- Mantener sensación de flujo guiado.

### Pantalla: Pre-Lavado
- Selector de paciente consistente con Anamnesis.
- Hero enfocado en decisión clínica previa al procedimiento.
- Mostrar “Apto / No apto / Con precauciones” de forma muy visual.
- Resumen de bloqueos y alertas antes del detalle.
- Formulario técnico ordenado, con lectura rápida de observaciones.

### Pantalla: Citas
- Header con CTA para nueva cita.
- Métricas: próximas, recordatorios pendientes, citas de hoy.
- Formulario de creación con recordatorios rápidos.
- Lista de citas con cards elegantes y muy escaneables.
- Estados visibles con badges.
- Edición inline de fecha, estado, recordatorios y notas.
- Búsqueda por paciente, estado o notas.

### Componentes que quiero ver en el diseño
- Sidebar desktop + bottom navigation mobile.
- Hero cards por módulo.
- Tarjetas glassmorphism sutil.
- Inputs amplios, táctiles y muy claros.
- Botones primarios oscuros o teal con alto contraste.
- Badges de estado clínico y operativo.
- Tablas evitadas en mobile; preferir cards responsivas.

### Resultado esperado
Quiero pantallas coherentes entre sí, listas para convertirse en producto real, con foco en claridad clínica, velocidad de uso y estética moderna profesional.

