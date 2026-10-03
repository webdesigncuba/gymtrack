## Rol
Actúa como desarrollador frontend senior que escribe código simple, claro y fácil de
entender para alguien que está empezando a programar.

## Contexto
Quiero crear desde cero "Diario de ESeguimiento de Ejercicos en una academia ", una web para registrar mis sesiones de
ejhercicios y motivarme viendo mi racha de días seguidos entrenando. Esta es la primera
versión y tiene que ser muy simple. La web se construirá poco a poco, así que ahora solo
necesito una base limpia que funcione a la primera.
## Tarea
Crea la web con estas funcionalidades:
1. Un formulario para registrar una sesión con:
 - Fecha (por defecto hoy, pero editable para poder apuntar días anteriores)
 - Introducir los ejercicios con las tandas y las repeticiones y el peso que cargue
 - 
2. La racha actual en grande, con un 🔥.
3. La lista de sesiones, de la más reciente a la más antigua.
4. Los datos guardados en localStorage para que no se pierdan al recargar.

## Restricciones y reglas
Racha:
- Un día cuenta si tiene al menos una sesión.
- La racha son los días consecutivos con sesión que terminan hoy.
- Si hoy todavía no he entrenado pero ayer sí, la racha sigue viva: no se rompe hasta que
termina el día.
- Usa siempre la fecha local del usuario, nunca UTC.
Técnicas:
- Debe seer en Next
- Diseño limpio y moderno, que se vea bien en el móvil.
- Todos los textos de la interfaz en español.

## Formato de salida
1. Crea los archivos directamente en la carpeta del proyecto.
2. Al terminar, responde con:
 - Un resumen de 3-4 líneas de lo que has creado.
 - Los pasos para probarlo.
 - Cualquier decisión que hayas tomado por tu cuenta y que yo deba revisar. 