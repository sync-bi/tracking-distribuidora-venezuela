// src/components/UI/TourGuide.js
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, HelpCircle, BookOpen } from 'lucide-react';

const TourGuide = ({ steps = [], onComplete, autoStart = false }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [showFullGuide, setShowFullGuide] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya vio el tour
    const tourCompleted = localStorage.getItem('tour_completed');
    if (!tourCompleted && autoStart) {
      // Dar tiempo para que la UI se renderice
      setTimeout(() => setIsActive(true), 1000);
    } else {
      setHasSeenTour(!!tourCompleted);
    }
  }, [autoStart]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollToElement(steps[currentStep + 1].target);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollToElement(steps[currentStep - 1].target);
    }
  };

  const completeTour = () => {
    localStorage.setItem('tour_completed', 'true');
    setIsActive(false);
    setCurrentStep(0);
    setHasSeenTour(true);
    if (onComplete) onComplete();
  };

  const skipTour = () => {
    completeTour();
  };

  const restartTour = () => {
    setCurrentStep(0);
    setIsActive(true);
    scrollToElement(steps[0].target);
  };

  const scrollToElement = (targetId) => {
    if (!targetId) return;
    setTimeout(() => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  if (!isActive && hasSeenTour) {
    // Botones flotantes para reactivar el tour o ver guía completa
    return (
      <>
        <button
          onClick={restartTour}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg z-50 transition-all hover:scale-110"
          title="Volver a mostrar la guía interactiva"
        >
          <HelpCircle size={24} />
        </button>
        <button
          onClick={() => setShowFullGuide(true)}
          className="fixed bottom-6 right-20 bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg z-50 transition-all hover:scale-110"
          title="Ver guía completa de usuario"
        >
          <BookOpen size={24} />
        </button>
        {showFullGuide && <FullGuideModal onClose={() => setShowFullGuide(false)} />}
      </>
    );
  }

  if (!isActive) return null;

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <>
      {/* Overlay oscuro */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={skipTour}></div>

      {/* Spotlight en el elemento actual */}
      {step.target && (
        <style>
          {`
            #${step.target} {
              position: relative;
              z-index: 45 !important;
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5) !important;
              border-radius: 8px;
            }
          `}
        </style>
      )}

      {/* Tooltip con información */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">{step.title}</h3>
              <button
                onClick={skipTour}
                className="text-white hover:text-gray-200 transition-colors"
                title="Cerrar guía"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-sm opacity-90">
              Paso {currentStep + 1} de {steps.length}
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6">
            <p className="text-gray-700 mb-4 leading-relaxed">{step.content}</p>

            {step.tip && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Consejo:</strong> {step.tip}
                </p>
              </div>
            )}

            {/* Barra de progreso */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>

            {/* Botones de navegación */}
            <div className="flex justify-between items-center mb-3">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentStep === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ChevronLeft size={16} />
                Anterior
              </button>

              <button
                onClick={skipTour}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Saltar tutorial
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                {currentStep < steps.length - 1 && <ChevronRight size={16} />}
              </button>
            </div>

            {/* Botón para ver guía completa */}
            <button
              onClick={() => setShowFullGuide(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors border border-green-200"
            >
              <BookOpen size={16} />
              Ver Guía Completa de Usuario
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Guía Completa */}
      {showFullGuide && <FullGuideModal onClose={() => setShowFullGuide(false)} />}
    </>
  );
};

// Componente Modal con la guía completa
const FullGuideModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={28} />
            <h2 className="text-2xl font-bold">Guía Completa de Usuario - SAREGO Tracking</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            title="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">🎯 Índice</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><a href="#crear-despacho" className="text-blue-600 hover:underline">Crear un Despacho</a></li>
              <li><a href="#seguimiento" className="text-blue-600 hover:underline">Hacer Seguimiento del Despacho</a></li>
              <li><a href="#optimizar" className="text-blue-600 hover:underline">Optimizar Rutas</a></li>
              <li><a href="#ver-mapa" className="text-blue-600 hover:underline">Ver Despachos en el Mapa</a></li>
              <li><a href="#conductor" className="text-blue-600 hover:underline">Modo Conductor (GPS)</a></li>
              <li><a href="#importar" className="text-blue-600 hover:underline">Importar Pedidos desde Excel</a></li>
            </ul>
          </div>

          <hr className="my-6" />

          {/* Sección 1: Crear Despacho */}
          <section id="crear-despacho" className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📦 1. Crear un Despacho</h3>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <h4 className="font-bold text-blue-900 mb-2">Paso 1: Ir a la Pestaña "Despachos"</h4>
              <p className="text-blue-800">Haz clic en la pestaña <strong>Despachos</strong> en la barra de navegación superior. Verás dos paneles: Lista de pedidos (izquierda) y Resumen (derecha).</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <h4 className="font-bold text-blue-900 mb-2">Paso 2: Seleccionar Pedidos</h4>
              <p className="text-blue-800 mb-2">Tienes dos opciones:</p>
              <p className="text-blue-800"><strong>Opción A - Seleccionar por Zona:</strong></p>
              <ul className="list-disc pl-6 text-blue-800 mb-2">
                <li>Los pedidos están agrupados por zona/ciudad</li>
                <li>Haz clic en el nombre de la zona para expandirla</li>
                <li>Haz clic en el checkbox de la zona para seleccionar TODOS los pedidos</li>
              </ul>
              <p className="text-blue-800"><strong>Opción B - Selección Manual:</strong></p>
              <ul className="list-disc pl-6 text-blue-800">
                <li>Expande cada zona haciendo clic en ella</li>
                <li>Marca individualmente los pedidos que necesites</li>
                <li>Usa el buscador si hay muchos pedidos</li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <h4 className="font-bold text-blue-900 mb-2">Paso 3: Verificar Totales en el Panel de Resumen</h4>
              <p className="text-blue-800">El panel derecho (SIEMPRE visible) muestra en tiempo real:</p>
              <ul className="list-disc pl-6 text-blue-800">
                <li>✅ Cantidad de pedidos seleccionados</li>
                <li>⚖️ Peso total estimado (kg)</li>
                <li>📦 Volumen total estimado (m³)</li>
                <li>🎁 Total de productos</li>
              </ul>
              <div className="bg-yellow-100 border border-yellow-400 rounded p-2 mt-2">
                <p className="text-yellow-800 text-sm"><strong>⚠️ IMPORTANTE:</strong> Verifica que el peso no exceda la capacidad del camión (típicamente 3000kg)</p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <h4 className="font-bold text-blue-900 mb-2">Paso 4: Seleccionar Camión</h4>
              <p className="text-blue-800">En el panel de resumen, despliega el selector "Seleccionar Camión". Verás: ID del camión, placa y capacidad. Selecciona el camión apropiado para la carga.</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <h4 className="font-bold text-blue-900 mb-2">Paso 5: Seleccionar Conductor</h4>
              <p className="text-blue-800">Despliega el selector "Seleccionar Conductor". Solo verás conductores disponibles en ese momento. Selecciona el conductor que manejará el camión.</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <h4 className="font-bold text-green-900 mb-2">Paso 6: Crear Despacho</h4>
              <p className="text-green-800">El botón "Crear Despacho" se habilitará cuando tengas al menos 1 pedido, un camión y un conductor seleccionados. Haz clic en <strong>Crear Despacho</strong>. Los pedidos cambiarán automáticamente a estado "Asignado".</p>
              <p className="text-green-800 mt-2"><strong>✅ ¡Despacho creado exitosamente!</strong></p>
            </div>
          </section>

          <hr className="my-6" />

          {/* Sección 2: Seguimiento */}
          <section id="seguimiento" className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🗺️ 2. Hacer Seguimiento del Despacho</h3>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4">
              <h4 className="font-bold text-purple-900 mb-2">Paso 1: Ir a la Pestaña "Seguimiento"</h4>
              <p className="text-purple-800">Haz clic en <strong>Seguimiento</strong> en la barra de navegación. Verás todos tus despachos activos.</p>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4">
              <h4 className="font-bold text-purple-900 mb-2">Paso 2: Seleccionar el Despacho</h4>
              <p className="text-purple-800 mb-2">Cada tarjeta de despacho muestra:</p>
              <ul className="list-disc pl-6 text-purple-800">
                <li>🚚 Camión asignado (ID y placa)</li>
                <li>👤 Conductor asignado</li>
                <li>📦 Cantidad de pedidos</li>
                <li>📊 Progreso (% completado)</li>
                <li>📅 Fecha de creación</li>
              </ul>
              <p className="text-purple-800 mt-2">Haz clic en el despacho que quieres seguir.</p>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4">
              <h4 className="font-bold text-purple-900 mb-2">Paso 3: Visualizar en el Mapa</h4>
              <p className="text-purple-800 mb-2">El mapa mostrará:</p>
              <ul className="list-disc pl-6 text-purple-800">
                <li>🚚 <strong>Icono de camión</strong> = Ubicación actual del vehículo</li>
                <li>📦 <strong>Iconos de paquete</strong> = Puntos de entrega</li>
                <li>📍 <strong>Líneas conectoras</strong> = Ruta planificada</li>
              </ul>
              <p className="text-purple-800 mt-2"><strong>Acciones:</strong> Haz clic en cualquier marcador para ver detalles. Usa los controles para hacer zoom in/out. Arrastra para mover el mapa.</p>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
              <h4 className="font-bold text-purple-900 mb-2">Paso 4: Ver Lista de Paradas</h4>
              <p className="text-purple-800 mb-2">A la derecha del mapa verás la lista ordenada de entregas:</p>
              <ul className="list-disc pl-6 text-purple-800">
                <li>🟢 Verde = Entrega completada</li>
                <li>🔵 Azul = Próxima parada</li>
                <li>⚪ Gris = Pendiente</li>
              </ul>
              <p className="text-purple-800 mt-2">Para cada parada verás: Cliente, Dirección, Productos, Distancia estimada.</p>
            </div>
          </section>

          <hr className="my-6" />

          {/* Sección 3: Optimizar Rutas */}
          <section id="optimizar" className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 3. Optimizar Rutas</h3>

            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4">
              <h4 className="font-bold text-orange-900 mb-2">Optimización Automática</h4>
              <p className="text-orange-800 mb-2"><strong>Paso 1:</strong> Abrir el Despacho en Seguimiento - Ve a la pestaña "Seguimiento" y selecciona el despacho.</p>
              <p className="text-orange-800 mb-2"><strong>Paso 2:</strong> Haz clic en el botón <strong>"Optimizar Ruta"</strong> 🎯</p>
              <p className="text-orange-800 mb-2">El sistema calculará automáticamente:</p>
              <ul className="list-disc pl-6 text-orange-800 mb-2">
                <li>Distancia total mínima</li>
                <li>Orden óptimo de entregas</li>
                <li>Tiempo estimado</li>
              </ul>
              <p className="text-orange-800">La ruta se reorganiza automáticamente y el mapa se actualiza con el nuevo orden.</p>
              <div className="bg-blue-100 border border-blue-400 rounded p-2 mt-2">
                <p className="text-blue-800 text-sm"><strong>Algoritmo:</strong> Toma la ubicación actual del camión como punto de inicio, calcula la distancia entre todos los puntos, usa el algoritmo del "vecino más cercano" y minimiza distancia total recorrida.</p>
              </div>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
              <h4 className="font-bold text-orange-900 mb-2">Reorganizar Manualmente (Opcional)</h4>
              <p className="text-orange-800 mb-2">Si necesitas cambiar el orden por razones específicas:</p>
              <ol className="list-decimal pl-6 text-orange-800 mb-2">
                <li>Ve a la lista de paradas</li>
                <li><strong>Arrastra</strong> cada parada hacia arriba o abajo</li>
                <li>Suéltala en la posición deseada</li>
                <li>El mapa se actualiza automáticamente</li>
              </ol>
              <p className="text-orange-800"><strong>Casos de uso:</strong> Cliente con horario específico de recepción, Entregas urgentes que deben ir primero, Restricciones de tráfico o zonas.</p>
            </div>
          </section>

          <hr className="my-6" />

          {/* Sección 4: Ver en Mapa */}
          <section id="ver-mapa" className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🗺️ 4. Ver Despachos en el Mapa</h3>

            <div className="bg-teal-50 border-l-4 border-teal-500 p-4 mb-4">
              <h4 className="font-bold text-teal-900 mb-2">Vista General del Sistema</h4>
              <p className="text-teal-800 mb-2"><strong>Paso 1:</strong> Ir a la Pestaña "Mapa" - Haz clic en <strong>Mapa</strong> en la navegación superior. Verás TODOS los elementos del sistema simultáneamente.</p>
              <p className="text-teal-800 mb-2"><strong>Estadísticas en Tiempo Real:</strong> En la parte superior verás:</p>
              <ul className="list-disc pl-6 text-teal-800">
                <li>🚚 Camiones Activos (asignados + en ruta)</li>
                <li>📦 Pedidos Activos (pendientes + asignados + en ruta)</li>
                <li>🛣️ Rutas Activas</li>
                <li>📏 Distancia Promedio por parada</li>
              </ul>
            </div>

            <div className="bg-teal-50 border-l-4 border-teal-500 p-4 mb-4">
              <h4 className="font-bold text-teal-900 mb-2">Paso 2: Usar Filtros</h4>
              <p className="text-teal-800 mb-2">Selector de filtros disponibles:</p>
              <ul className="list-disc pl-6 text-teal-800 space-y-2">
                <li><strong>"Todos en Seguimiento"</strong> (predeterminado) - Muestra: Todos los pedidos NO entregados</li>
                <li><strong>"Solo Camiones"</strong> - Muestra: Solo vehículos</li>
                <li><strong>"Solo Pedidos"</strong> - Muestra: Solo puntos de entrega</li>
                <li><strong>"Solo En Ruta"</strong> - Muestra: Solo elementos activos ahora mismo</li>
                <li><strong>"Solo Pendientes"</strong> - Muestra: Pedidos sin asignar y camiones disponibles</li>
                <li><strong>"Solo Asignados"</strong> - Muestra: Despachos listos para salir</li>
              </ul>
            </div>

            <div className="bg-teal-50 border-l-4 border-teal-500 p-4">
              <h4 className="font-bold text-teal-900 mb-2">Paso 3: Interactuar con el Mapa</h4>
              <p className="text-teal-800 mb-2"><strong>Marcadores de Camiones:</strong></p>
              <ul className="list-disc pl-6 text-teal-800 mb-2">
                <li>🟢 Verde = Disponible</li>
                <li>🟠 Naranja = Asignado</li>
                <li>🔵 Azul = En ruta</li>
                <li>🔴 Rojo = Mantenimiento</li>
              </ul>
              <p className="text-teal-800 mb-2"><strong>Marcadores de Pedidos:</strong></p>
              <ul className="list-disc pl-6 text-teal-800 mb-2">
                <li>🟠 Naranja = Pendiente</li>
                <li>🔵 Azul = Asignado</li>
                <li>🟢 Verde = En ruta</li>
                <li>⚪ Gris = Entregado</li>
              </ul>
              <p className="text-teal-800"><strong>⚠️ Triángulo Amarillo:</strong> Indica coordenadas corregidas automáticamente (cuando las coordenadas originales estaban muy lejas de la ciudad)</p>
            </div>
          </section>

          <hr className="my-6" />

          {/* Sección 5: Modo Conductor */}
          <section id="conductor" className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📍 5. Modo Conductor (GPS)</h3>

            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-4">
              <h4 className="font-bold text-indigo-900 mb-2">Para Conductores con Dispositivo Móvil</h4>
              <p className="text-indigo-800 mb-2"><strong>Paso 1:</strong> Iniciar Sesión como Conductor</p>
              <ul className="list-disc pl-6 text-indigo-800 mb-2">
                <li>Entra con el usuario y la contraseña que te dio el administrador</li>
                <li>Tu cuenta debe tener el rol <strong>Conductor</strong></li>
                <li>Si no puedes entrar, pídele al administrador que revise tu cuenta</li>
              </ul>
              <p className="text-indigo-800 mb-2"><strong>Paso 2:</strong> Ir a la Pestaña "Conductor"</p>
              <p className="text-indigo-800 mb-2"><strong>Paso 3:</strong> Seleccionar tu Camión - Despliega el selector y elige tu camión asignado</p>
            </div>

            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-4">
              <h4 className="font-bold text-indigo-900 mb-2">Paso 4: Iniciar Seguimiento</h4>
              <ol className="list-decimal pl-6 text-indigo-800 mb-2">
                <li>Haz clic en <strong>"Iniciar"</strong> ▶️</li>
                <li>Tu navegador pedirá permisos de ubicación</li>
                <li>Haz clic en <strong>"Permitir"</strong> / <strong>"Allow"</strong></li>
              </ol>
              <div className="bg-yellow-100 border border-yellow-400 rounded p-2 mt-2">
                <p className="text-yellow-800 text-sm"><strong>⚠️ IMPORTANTE:</strong> Debe estar en un dispositivo con GPS (móvil/tablet). Requiere conexión a internet. Consume batería (recomendado tener cargador).</p>
              </div>
            </div>

            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-4">
              <h4 className="font-bold text-indigo-900 mb-2">Paso 5: Monitoreo Automático</h4>
              <p className="text-indigo-800 mb-2">Una vez iniciado, el sistema:</p>
              <ul className="list-disc pl-6 text-indigo-800 mb-2">
                <li>✅ Obtiene tu ubicación cada <strong>15 segundos</strong> o <strong>50 metros</strong></li>
                <li>✅ Envía posición a Firebase (tiempo real)</li>
                <li>✅ Envía posición al backend REST (histórico)</li>
                <li>✅ Actualiza velocidad y heading</li>
                <li>✅ Muestra última posición en pantalla</li>
              </ul>
              <p className="text-indigo-800 mb-2"><strong>Panel de información:</strong> Latitud y Longitud, Hora de última actualización, Velocidad actual (km/h), Dirección (heading)</p>
            </div>

            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4">
              <h4 className="font-bold text-indigo-900 mb-2">Paso 6: Detener Seguimiento</h4>
              <p className="text-indigo-800">Cuando termines la ruta, haz clic en <strong>"Detener"</strong> ⏹️. El GPS se desactiva y el estado del camión vuelve a "Disponible".</p>
            </div>
          </section>

          <hr className="my-6" />

          {/* Sección 6: Importar Excel */}
          <section id="importar" className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📥 6. Importar Pedidos desde Excel</h3>

            <div className="bg-pink-50 border-l-4 border-pink-500 p-4 mb-4">
              <h4 className="font-bold text-pink-900 mb-2">Método 1: Importación Automática (Recomendado)</h4>
              <ol className="list-decimal pl-6 text-pink-800">
                <li>Coloca tu archivo en: <code className="bg-gray-200 px-2 py-1 rounded">public/Pedidos.xlsx</code> o <code className="bg-gray-200 px-2 py-1 rounded">public/pedidos.xlsx</code></li>
                <li>Reinicia la aplicación</li>
                <li>Los pedidos se cargan automáticamente</li>
              </ol>
            </div>

            <div className="bg-pink-50 border-l-4 border-pink-500 p-4 mb-4">
              <h4 className="font-bold text-pink-900 mb-2">Método 2: Importación Manual</h4>
              <ol className="list-decimal pl-6 text-pink-800">
                <li>Ve a la pestaña <strong>Pedidos</strong></li>
                <li>Haz clic en <strong>"Importar Pedidos"</strong> 📥</li>
                <li>Selecciona tu archivo Excel (.xlsx) o CSV (.csv)</li>
                <li>El sistema procesará automáticamente</li>
              </ol>
            </div>

            <div className="bg-pink-50 border-l-4 border-pink-500 p-4 mb-4">
              <h4 className="font-bold text-pink-900 mb-2">Formato del Excel</h4>
              <p className="text-pink-800 mb-2"><strong>Columnas Requeridas:</strong></p>
              <ul className="list-disc pl-6 text-pink-800 mb-2">
                <li><code className="bg-gray-200 px-1 rounded">numero_pedido</code> - ID único del pedido</li>
                <li><code className="bg-gray-200 px-1 rounded">cliente</code> o <code className="bg-gray-200 px-1 rounded">nombre_cliente</code> - Nombre del cliente</li>
                <li><code className="bg-gray-200 px-1 rounded">direccion_cliente</code> o <code className="bg-gray-200 px-1 rounded">direccion</code> - Dirección de entrega</li>
                <li><code className="bg-gray-200 px-1 rounded">ciudad_cliente</code> o <code className="bg-gray-200 px-1 rounded">ciudad</code> - Ciudad (para geocodificar)</li>
              </ul>
              <p className="text-pink-800 mb-2"><strong>Columnas Opcionales:</strong></p>
              <ul className="list-disc pl-6 text-pink-800">
                <li><code className="bg-gray-200 px-1 rounded">lat, lng</code> - Coordenadas exactas (si las tienes)</li>
                <li><code className="bg-gray-200 px-1 rounded">codigo_articulo</code> - SKU del producto</li>
                <li><code className="bg-gray-200 px-1 rounded">descripcion_articulo</code> - Descripción</li>
                <li><code className="bg-gray-200 px-1 rounded">cantidad_pedida</code> - Cantidad</li>
                <li><code className="bg-gray-200 px-1 rounded">prioridad</code> - Alta, Media, Baja</li>
                <li><code className="bg-gray-200 px-1 rounded">estado</code> - Pendiente, Asignado, etc.</li>
              </ul>
            </div>

            <div className="bg-pink-50 border-l-4 border-pink-500 p-4">
              <h4 className="font-bold text-pink-900 mb-2">Procesamiento Inteligente</h4>
              <ul className="list-disc pl-6 text-pink-800">
                <li>✅ Detecta automáticamente las columnas</li>
                <li>✅ Agrupa renglones por <code className="bg-gray-200 px-1 rounded">numero_pedido</code></li>
                <li>✅ Geocodifica ciudades automáticamente (45 ciudades de Venezuela)</li>
                <li>✅ Valida coordenadas vs ciudad (detecta errores)</li>
                <li>✅ Corrige coordenadas incorrectas</li>
                <li>✅ Convierte fechas de Excel a formato ISO</li>
                <li>✅ Normaliza nombres de columnas</li>
              </ul>
            </div>
          </section>

          <hr className="my-6" />

          {/* FAQ */}
          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🆘 Preguntas Frecuentes</h3>

            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="font-bold text-gray-900 mb-2">¿Cómo sé si las coordenadas son correctas?</h4>
                <p className="text-gray-700">En el mapa, si el marcador tiene un <strong>triángulo amarillo ⚠️</strong>, las coordenadas fueron corregidas. Haz clic en el marcador para ver la advertencia con detalles.</p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="font-bold text-gray-900 mb-2">¿Puedo cambiar un despacho después de crearlo?</h4>
                <p className="text-gray-700">Sí, ve a "Seguimiento" y selecciona el despacho. Puedes reorganizar la ruta manualmente y marcar entregas como completadas.</p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="font-bold text-gray-900 mb-2">¿Qué pasa si el conductor no tiene GPS?</h4>
                <p className="text-gray-700">Puedes actualizar la posición manualmente desde "Camiones" o usar simulación (el sistema mueve el camión automáticamente).</p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="font-bold text-gray-900 mb-2">¿Cuántos pedidos puede tener un despacho?</h4>
                <p className="text-gray-700">No hay límite técnico. Recomendado: Verificar capacidad del camión (peso/volumen).</p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="font-bold text-gray-900 mb-2">¿Cómo elimino un pedido?</h4>
                <p className="text-gray-700">Ve a "Pedidos", busca el pedido y haz clic en el botón de eliminar 🗑️.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <strong>Versión:</strong> 1.0 | <strong>Última actualización:</strong> 2025-10-10
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Cerrar Guía
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourGuide;
