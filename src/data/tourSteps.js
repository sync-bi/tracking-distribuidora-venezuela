// src/data/tourSteps.js
// Pasos del tour guiado por rol de usuario

export const getTourSteps = (role, activeTab) => {
  const commonSteps = [
    {
      target: 'app-header',
      title: '¡Bienvenido a SAREGO Tracking!',
      content: 'Este sistema te ayudará a gestionar pedidos, camiones y despachos en tiempo real. Comencemos con un recorrido rápido.',
      tip: 'Puedes volver a ver este tutorial en cualquier momento haciendo clic en el botón de ayuda (?) en la esquina inferior derecha.'
    },
    {
      target: 'app-navigation',
      title: 'Navegación Principal',
      content: 'Aquí encontrarás todas las secciones del sistema. Las pestañas disponibles dependen de tu rol de usuario.',
      tip: 'La barra de navegación permanece fija mientras haces scroll para que siempre puedas cambiar de sección.'
    }
  ];

  const pedidosSteps = [
    {
      target: 'pedidos-stats',
      title: 'Estadísticas de Pedidos',
      content: 'Visualiza rápidamente el total de pedidos, pendientes, en ruta y entregados.',
      tip: 'Estas estadísticas se actualizan en tiempo real.'
    },
    {
      target: 'pedidos-search',
      title: 'Búsqueda de Pedidos',
      content: 'Usa el buscador para encontrar pedidos por cliente, ID o dirección rápidamente.',
      tip: 'La búsqueda filtra mientras escribes.'
    },
    {
      target: 'pedidos-import',
      title: 'Importación de Pedidos',
      content: 'Puedes importar múltiples pedidos desde archivos Excel (.xlsx) o CSV.',
      tip: 'El sistema detecta automáticamente las columnas y geocodifica las ciudades.'
    }
  ];

  const despachosSteps = [
    {
      target: 'despachos-pedidos-list',
      title: '📦 Paso 1: Seleccionar Pedidos',
      content: 'INICIO DEL PROCESO: Aquí verás todos los pedidos disponibles agrupados por zona/ciudad. Expande las zonas haciendo clic en ellas y selecciona los pedidos que quieres incluir en el despacho.',
      tip: '💡 Haz clic en el checkbox de la ZONA para seleccionar todos los pedidos de esa área de una vez. Puedes combinar pedidos de diferentes zonas.'
    },
    {
      target: 'despachos-search',
      title: '🔍 Búsqueda Rápida',
      content: 'Si tienes muchos pedidos, usa el buscador para filtrar por cliente, número de pedido o dirección.',
      tip: '💡 La búsqueda es instantánea - escribe y los resultados se filtran automáticamente.'
    },
    {
      target: 'despachos-resumen',
      title: '📊 Paso 2: Verificar Totales',
      content: 'Este panel está SIEMPRE visible. A medida que seleccionas pedidos, verás actualizarse en TIEMPO REAL: cantidad de pedidos, peso total estimado, volumen y número de productos.',
      tip: '💡 Usa estos totales para verificar que no excedes la capacidad del camión (3000kg típicamente).'
    },
    {
      target: 'despachos-camion-select',
      title: '🚚 Paso 3: Asignar Camión',
      content: 'Selecciona el camión que realizará este despacho. Verás el ID, placa y capacidad de cada camión disponible.',
      tip: '💡 Compara el peso total del resumen con la capacidad del camión antes de continuar.'
    },
    {
      target: 'despachos-conductor-select',
      title: '👤 Paso 4: Asignar Conductor',
      content: 'Selecciona el conductor que manejará el camión. Solo verás conductores que estén disponibles en este momento.',
      tip: '💡 Verifica que el conductor tenga la licencia apropiada para el tipo de vehículo.'
    },
    {
      target: 'despachos-crear-btn',
      title: '✅ Paso 5: Crear Despacho',
      content: 'Una vez completados todos los campos (pedidos, camión y conductor), haz clic aquí para crear el despacho. Los pedidos cambiarán a estado "Asignado" automáticamente.',
      tip: '💡 El botón se activará solo cuando TODOS los campos estén completos. Después de crear el despacho, ve a la pestaña "Seguimiento" para continuar.'
    },
    {
      target: null,
      title: '🎯 Siguiente: Hacer Seguimiento',
      content: 'Despacho creado exitosamente! Ahora ve a la pestaña "SEGUIMIENTO" (arriba) para ver tu despacho, optimizar la ruta y hacer seguimiento en tiempo real.',
      tip: '💡 En Seguimiento podrás: 1) Ver el mapa de la ruta, 2) Optimizar el orden de entregas, 3) Marcar pedidos como completados, 4) Ver el progreso en tiempo real.'
    }
  ];

  const seguimientoSteps = [
    {
      target: 'seguimiento-lista',
      title: '📋 Paso 1: Ver Despachos Activos',
      content: 'Aquí verás todos los despachos que has creado. Cada tarjeta muestra: camión asignado, conductor, pedidos incluidos y estado actual.',
      tip: '💡 Los despachos se ordenan por fecha de creación, los más recientes primero.'
    },
    {
      target: 'seguimiento-mapa',
      title: '🗺️ Paso 2: Visualizar en el Mapa',
      content: 'El mapa muestra la ubicación actual del camión (icono de camión) y todos los puntos de entrega (iconos de paquete). Las líneas conectan las paradas según el orden de la ruta.',
      tip: '💡 Haz clic en cualquier marcador para ver detalles completos del pedido o camión.'
    },
    {
      target: 'seguimiento-optimizar',
      title: '🎯 Paso 3: Optimizar Ruta',
      content: 'Haz clic en "Optimizar Ruta" para que el sistema calcule automáticamente el mejor orden de entregas, minimizando distancia y tiempo.',
      tip: '💡 El algoritmo considera la ubicación actual del camión y calcula la ruta más eficiente visitando todos los puntos.'
    },
    {
      target: 'seguimiento-orden',
      title: '🔄 Reorganizar Manualmente',
      content: 'Si necesitas cambiar el orden manualmente, arrastra las paradas hacia arriba o abajo en la lista de ruta.',
      tip: '💡 Útil cuando tienes restricciones especiales como horarios de entrega específicos.'
    },
    {
      target: 'seguimiento-completar',
      title: '✅ Marcar Entregas Completadas',
      content: 'Cuando el conductor complete una entrega, márcala como "Completada". El progreso se actualiza automáticamente y el pedido cambia a estado "Entregado".',
      tip: '💡 El porcentaje de progreso se calcula automáticamente: pedidos completados / total de pedidos.'
    },
    {
      target: null,
      title: '📍 Ver en Tiempo Real en el Mapa',
      content: 'Ve a la pestaña "MAPA" para ver TODOS los despachos activos en un solo mapa con filtros avanzados.',
      tip: '💡 En el mapa podrás filtrar por: todos en seguimiento, solo camiones, solo pedidos, solo en ruta, etc.'
    }
  ];

  const mapaSteps = [
    {
      target: 'mapa-stats',
      title: '📊 Estadísticas en Tiempo Real',
      content: 'Vista general de TODO el sistema: camiones activos, pedidos en seguimiento, rutas activas y distancias.',
      tip: '💡 Los números se actualizan automáticamente cada 5 segundos.'
    },
    {
      target: 'mapa-filtros',
      title: '🔍 Filtros del Mapa',
      content: 'Controla qué elementos se muestran en el mapa. Opciones: Todos en seguimiento (predeterminado), Solo camiones, Solo pedidos, Solo en ruta, Solo pendientes, Solo asignados.',
      tip: '💡 "Todos en Seguimiento" muestra TODOS los pedidos activos (pendientes, asignados y en ruta) - NO muestra entregados ni cancelados.'
    },
    {
      target: 'mapa-canvas',
      title: '🗺️ Mapa Interactivo',
      content: 'Haz clic en cualquier marcador para ver detalles:\n• 🚚 Camiones = Estado, velocidad, combustible, pedidos asignados\n• 📦 Pedidos = Cliente, prioridad, productos, camión asignado',
      tip: '⚠️ Los marcadores con triángulo amarillo indican que las coordenadas fueron corregidas automáticamente por el sistema (ej: estaban muy lejos de la ciudad especificada).'
    },
    {
      target: 'mapa-controles',
      title: '🎮 Controles del Mapa',
      content: 'Usa los botones de control para: Centrar en Venezuela, Seguir un camión específico, Actualizar datos, Limpiar filtros.',
      tip: '💡 "Seguir Camión" centra automáticamente el mapa en el primer camión en ruta y hace zoom.'
    }
  ];

  const conductorSteps = [
    {
      target: 'conductor-select',
      title: 'Selección de Camión',
      content: 'Selecciona tu camión asignado de la lista.',
      tip: 'Solo verás los camiones disponibles para ti.'
    },
    {
      target: 'conductor-tracking-btn',
      title: 'Control de Seguimiento GPS',
      content: 'Inicia el seguimiento GPS para que tu ubicación se envíe en tiempo real al sistema.',
      tip: 'Asegúrate de dar permisos de ubicación a tu navegador cuando lo solicite.'
    },
    {
      target: 'conductor-last-position',
      title: 'Última Posición Registrada',
      content: 'Aquí verás tu última posición GPS registrada con coordenadas, velocidad y hora.',
      tip: 'La posición se actualiza automáticamente cada 15 segundos o cada 50 metros recorridos.'
    }
  ];

  const clientesSteps = [
    {
      target: 'clientes-stats',
      title: '📊 Paso 1: Estadísticas de Clientes',
      content: 'Visualiza el total de clientes y el porcentaje de ubicaciones corregidas. Estos números se actualizan en tiempo real.',
      tip: '💡 Tu objetivo es llegar al 100% de clientes con ubicaciones corregidas.'
    },
    {
      target: 'clientes-filtros',
      title: '🔍 Paso 2: Filtrar Tu Cartera',
      content: 'Usa el filtro de vendedor para ver SOLO tus clientes asignados. También puedes buscar por nombre, código, dirección o ciudad.',
      tip: '💡 Si eres vendedor, solo verás tu propia cartera. Los admin/operadores pueden ver "Todos los vendedores".'
    },
    {
      target: 'clientes-lista',
      title: '📋 Paso 3: Lista de Clientes',
      content: 'Cada cliente muestra: nombre, dirección, vendedor asignado y total de pedidos. Los iconos indican: ✅ Verde = ubicación corregida, 🔴 Rojo = sin corregir.',
      tip: '💡 Haz clic en un cliente para verlo en el mapa. Los clientes sin corregir deben ser tu prioridad.'
    },
    {
      target: 'clientes-mapa',
      title: '🗺️ Paso 4: Mapa Interactivo',
      content: 'El mapa muestra todos tus clientes filtrados. Colores: 🟢 Verde = corregido, 🔴 Rojo = sin corregir, 🟡 Amarillo = editando (arrastrable).',
      tip: '💡 Haz clic en un cliente de la lista para que el mapa haga zoom automáticamente a su ubicación.'
    },
    {
      target: null,
      title: '✏️ Paso 5: Corregir Ubicación',
      content: 'Haz clic en "Corregir Ubicación" de cualquier cliente. Se abrirá un panel lateral con el formulario de edición.',
      tip: '💡 Verás cuántos pedidos serán afectados por el cambio - TODOS los pedidos del cliente se actualizarán.'
    },
    {
      target: null,
      title: '🎯 Paso 6: Ajustar Coordenadas',
      content: 'OPCIÓN A (Recomendada): Arrastra el marcador AMARILLO en el mapa a la ubicación correcta.\n\nOPCIÓN B: Edita manualmente la dirección, ciudad y coordenadas en el formulario.',
      tip: '💡 Arrastar el marcador es más rápido y visual. Las coordenadas se actualizan automáticamente mientras arrastras.'
    },
    {
      target: null,
      title: '💾 Paso 7: Guardar Cambios',
      content: 'Revisa que la ubicación sea correcta y haz clic en "Guardar Cambios". Los cambios se aplicarán a TODOS los pedidos del cliente y se registrarán en el historial.',
      tip: '💡 El marcador cambiará de 🟡 amarillo a 🟢 verde automáticamente. Puedes ver el historial de cambios haciendo clic en el botón "Historial".'
    },
    {
      target: null,
      title: '🎉 ¡Listo! Continúa con el Siguiente',
      content: 'Has corregido exitosamente la ubicación de un cliente. Ahora continúa con los demás clientes de tu cartera hasta completar el 100%.',
      tip: '💡 Tip de eficiencia: Puedes corregir 15-20 clientes por hora una vez que te familiarices con el proceso.'
    }
  ];

  const ubicacionesSteps = [
    {
      target: 'ubicaciones-lista',
      title: '📋 Gestión de Ubicaciones de Pedidos',
      content: 'Este módulo permite corregir ubicaciones a nivel de PEDIDOS individuales. Para corregir a nivel de CLIENTES (recomendado), usa la pestaña "Clientes".',
      tip: '💡 Usar el módulo de Clientes es más eficiente porque un cambio afecta todos los pedidos del cliente.'
    },
    {
      target: 'ubicaciones-filtros',
      title: '🔍 Búsqueda de Pedidos',
      content: 'Busca pedidos específicos por cliente, ID, dirección o ciudad. Solo se mostrarán pedidos con ubicaciones pendientes de validar.',
      tip: '💡 Los pedidos con advertencias de coordenadas tienen prioridad (marcados con triángulo amarillo).'
    },
    {
      target: 'ubicaciones-mapa',
      title: '🗺️ Mapa de Corrección',
      content: 'Similar al módulo de Clientes, puedes arrastrar marcadores para ajustar ubicaciones. La diferencia es que aquí corriges pedido por pedido.',
      tip: '💡 Si varios pedidos son del mismo cliente, es mejor ir a "Clientes" y corregirlos todos de una vez.'
    }
  ];

  // Construir pasos según el tab activo
  let steps = [...commonSteps];

  switch (activeTab) {
    case 'pedidos':
      steps = [...steps, ...pedidosSteps];
      break;
    case 'despachos':
      steps = [...steps, ...despachosSteps];
      break;
    case 'seguimiento':
      steps = [...steps, ...seguimientoSteps];
      break;
    case 'mapa':
      steps = [...steps, ...mapaSteps];
      break;
    case 'conductor':
      steps = [...steps, ...conductorSteps];
      break;
    case 'clientes':
      steps = [...steps, ...clientesSteps];
      break;
    case 'ubicaciones':
      steps = [...steps, ...ubicacionesSteps];
      break;
    default:
      break;
  }

  // Paso final común
  steps.push({
    target: null,
    title: '¡Tour Completado! 🎉',
    content: 'Ya conoces las funciones principales del sistema. Si necesitas ayuda en el futuro, haz clic en el botón de ayuda (?) en la esquina inferior derecha.',
    tip: 'Explora cada sección para familiarizarte más con todas las funcionalidades.'
  });

  return steps;
};
