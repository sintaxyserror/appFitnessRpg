# Roadmap del proyecto Fitness RPG

## 1. Estado actual del proyecto

El proyecto ya ha superado la fase de “base técnica” y está en una etapa de consolidación del MVP funcional. Ahora mismo ya está validado el flujo principal de rutinas semanales, carga de ejercicio, asignación por día y registro de la sesión real a partir de esa rutina.

Incluye estas piezas ya operativas:

- autenticación con NextAuth y credenciales
- dashboard con personaje y estadísticas reales
- creación, listado y borrado de rutinas
- asignación de rutinas a días de la semana
- búsqueda de ejercicios y movimientos por nombre
- configuración de RIR objetivo por serie
- creación de sesiones desde la rutina del día
- historial de sesiones con datos reales
- cálculo de XP, atributos, racha y clase

Las partes principales ya operativas están alineadas con:

- [app/dashboard/page.tsx](app/dashboard/page.tsx)
- [app/routines/page.tsx](app/routines/page.tsx)
- [app/routines/new/page.tsx](app/routines/new/page.tsx)
- [app/sessions/new/page.tsx](app/sessions/new/page.tsx)
- [app/sessions/page.tsx](app/sessions/page.tsx)
- [components/workouts/RoutineForm.tsx](components/workouts/RoutineForm.tsx)
- [components/workouts/WorkoutSessionForm.tsx](components/workouts/WorkoutSessionForm.tsx)
- [lib/services/workout-session-service.ts](lib/services/workout-session-service.ts)
- [lib/xp.ts](lib/xp.ts)

---

## 2. Qué ya está hecho

### ✅ Fundación del producto
- app con Next.js 16 + App Router
- Prisma con PostgreSQL
- autenticación por email/password
- flujo de registro/login correcto
- personajes, atributos y progreso base

### ✅ Sistema de planificación semanal
- creación de rutinas con nombre y tipo
- asignación de días de la semana
- búsqueda por nombre de ejercicios
- selección de ejercicios o movimientos
- configuración de series, reps y RIR objetivo por serie
- persistencia y lectura de rutina desde la base de datos

### ✅ Sistema de sesiones reales
- nueva sesión por día de la semana
- selección automática de la rutina del día
- precarga de series desde la rutina
- uso del RIR guardado por serie como valor por defecto
- guardado real de sesiones con pesas y calistenia
- historial de sesiones funcionando con datos reales

### ✅ Sistema de progresión
- cálculo de XP por sesión
- niveles por atributo
- cálculo de racha
- lógica de clase dominante / clase pendiente
- pruebas automáticas en [lib/xp.test.ts](lib/xp.test.ts)

### ✅ Correcciones importantes ya resueltas
- sincronización de Prisma con schema real
- migraciones para rutinas y RIR por serie
- corrección de payload inválido en Prisma con nested relation writes
- eliminación de errores de tabla inexistente por esquema desalineado
- validación del flujo guardar rutina -> cargar rutina en sesión

---

## 3. Qué queda por cerrar

### Fase 1: consolidar la experiencia del MVP
- revisar feedback visual tras guardar rutina y sesión
- mejorar mensajes de éxito/error y estados de carga
- validar edge cases en formularios vacíos o incompletos
- consolidar navegación desde nueva sesión y rutinas hacia historial/dashboard
- pulir la vista de rutinas para que muestre mejor los días y el RIR objetivo

### Fase 2: convertirlo en un juego más completo
- missions / misiones y progresión por objetivos
- achievements / logros
- reset o edición de progreso del personaje
- confirmación de cambio de clase
- panel de progreso histórico por tipo de entrenamiento y atributo

### Fase 3: producto de RPG más profundo
- inventario / armas / equipo
- detalle de sesión individual
- edición de sesiones y rutinas existentes
- filtros por tipo de entrenamiento, fechas y atributos
- balance de XP y dificultad
- identidad visual más “RPG” y menos CRUD

---

## 4. Orden recomendado de trabajo

### Fase A: producto estable (prioridad alta)
1. mejorar feedback visual de rutinas y sesiones
2. pulir navegación y mensajes de estado
3. revisar validación y errores de UX
4. dejar flujo completo login -> dashboard -> rutinas -> sesión -> historial
5. realizar QA end-to-end con varios casos reales

### Fase B: gameplay core (prioridad alta)
1. missions
2. achievements
3. cambios de clase con confirmación
4. skill points y mejora de atributos
5. panel de progreso por entrenamiento

### Fase C: RPG depth (prioridad media)
1. inventario y armas
2. historia de clase / historial de cambios
3. detalle de sesión individual
4. filtros y analítica de progreso
5. balance de dificultad y XP

### Fase D: UX final y pulido (prioridad media)
1. diseño visual consistente
2. microcopy del juego
3. responsive refinements
4. animaciones y estados visuales
5. refinamiento final de la experiencia del usuario

---

## 5. Milestones recomendados

### Milestone 1: MVP estable y usable
Objetivo:
- login y personaje operativos
- rutinas semanales creadas y persistidas
- nueva sesión cargando la rutina del día
- historial funcional
- flujo end-to-end validado manualmente

### Milestone 2: juego de progresión real
Objetivo:
- missions + achievements + cambios de clase
- progreso legible para el usuario
- mejora real de atributos y toma de decisiones del entrenamiento

### Milestone 3: producto RPG completo
Objetivo:
- equipamiento, progresión del personaje y experiencia de juego más rica
- narrativa, identidad visual, historial y valor de rejugabilidad

---

## 6. Riesgos actuales

- la base técnica ya no es el problema principal; la UX sí lo es
- falta consolidar el feedback visual para que el usuario perciba que cada acción tiene resultado
- todavía hay tareas de detalle que pueden crecer si no se organizan por fases
- el proyecto necesita una capa de diseño más clara para sentir “juego” y no “formularios de gestión”

---

## 7. Recomendación práctica

La estrategia ideal ahora es:

1. cerrar la experiencia del usuario en rutinas y sesiones
2. estabilizar la lógica de progresión del personaje
3. luego introducir gameplay real y sistema de logros/misiones
4. y finalmente hacer pulido visual y narrativa

Esto evita ampliar el alcance sin dejar bien asentado el núcleo del producto.

---

## 8. Estado de prioridad

### Prioridad inmediata
- cerrar UX de rutinas y sesión
- pulir feedback visual y validación
- dejar estable el flujo completo del usuario

### Prioridad siguiente
- missions / achievements
- sistema de clase y recompensas
- gestión de progreso más clara

### Prioridad posterior
- inventario / armas / mejora del personaje
- análisis de balance y experiencia RPG

---

## 9. Resumen corto

El proyecto ya está en una fase muy buena: la base funcional, la lógica de progresión y el flujo principal de rutinas/sesiones están funcionando. Lo más inteligente ahora es mantener esa base estable, mejorar la experiencia de uso y después seguir con gameplay real y contenido RPG en vez de ampliar la complejidad sin consolidar el MVP.
