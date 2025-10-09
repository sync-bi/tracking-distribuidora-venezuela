/**
 * Route Optimizer Service
 * Provides algorithms for optimizing delivery routes
 */

// Constants for calculations
const EARTH_RADIUS_KM = 6371;
const AVG_SPEED_KMH = 40; // Average speed in km/h for urban areas
const FUEL_CONSUMPTION_KM_L = 0.12; // Liters per km (8.3 km/l)
const STOP_TIME_MINUTES = 10; // Average time per stop in minutes

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - First coordinate {lat, lng}
 * @param {Object} coord2 - Second coordinate {lat, lng}
 * @returns {number} - Distance in kilometers
 */
export function haversineDistance(coord1, coord2) {
  if (!coord1 || !coord2 ||
      typeof coord1.lat !== 'number' || typeof coord1.lng !== 'number' ||
      typeof coord2.lat !== 'number' || typeof coord2.lng !== 'number') {
    return 0;
  }

  const toRad = (angle) => (angle * Math.PI) / 180;

  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return distance;
}

/**
 * Calculate route metrics for a given sequence of stops
 * @param {Array} stops - Array of stop objects with coordenadas
 * @param {Object} startPoint - Starting point coordinates {lat, lng}
 * @returns {Object} - Metrics including distance, time, and fuel
 */
export function calculateRouteMetrics(stops, startPoint = null) {
  if (!stops || stops.length === 0) {
    return {
      totalDistance: 0,
      totalTime: 0,
      totalFuel: 0,
      stopsCount: 0
    };
  }

  let totalDistance = 0;
  let previousPoint = startPoint || stops[0].coordenadas;

  // Calculate distance between consecutive stops
  for (let i = 0; i < stops.length; i++) {
    const currentStop = stops[i];

    if (currentStop.coordenadas) {
      const distance = haversineDistance(previousPoint, currentStop.coordenadas);
      totalDistance += distance;
      previousPoint = currentStop.coordenadas;
    }
  }

  // If we have a start point, add distance back to start
  if (startPoint && stops.length > 0 && stops[stops.length - 1].coordenadas) {
    totalDistance += haversineDistance(stops[stops.length - 1].coordenadas, startPoint);
  }

  // Calculate time: travel time + stop time
  const travelTimeHours = totalDistance / AVG_SPEED_KMH;
  const stopTimeHours = (stops.length * STOP_TIME_MINUTES) / 60;
  const totalTimeHours = travelTimeHours + stopTimeHours;

  // Calculate fuel consumption
  const totalFuel = totalDistance * FUEL_CONSUMPTION_KM_L;

  return {
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    totalTime: parseFloat(totalTimeHours.toFixed(2)),
    totalTimeMinutes: Math.round(totalTimeHours * 60),
    totalFuel: parseFloat(totalFuel.toFixed(2)),
    stopsCount: stops.length
  };
}

/**
 * Add detailed metrics to each stop in the route
 * @param {Array} stops - Array of stop objects
 * @param {Object} startPoint - Starting point coordinates
 * @returns {Array} - Stops with added metrics
 */
export function addStopMetrics(stops, startPoint = null) {
  if (!stops || stops.length === 0) {
    return [];
  }

  const enrichedStops = [];
  let previousPoint = startPoint || stops[0].coordenadas;
  let cumulativeDistance = 0;
  let cumulativeTime = 0;

  for (let i = 0; i < stops.length; i++) {
    const stop = { ...stops[i] };

    if (stop.coordenadas) {
      // Calculate distance from previous point
      const distance = haversineDistance(previousPoint, stop.coordenadas);
      const travelTime = (distance / AVG_SPEED_KMH) * 60; // in minutes
      const fuel = distance * FUEL_CONSUMPTION_KM_L;

      cumulativeDistance += distance;
      cumulativeTime += travelTime + STOP_TIME_MINUTES;

      stop.distancia = parseFloat(distance.toFixed(2));
      stop.tiempoEstimado = Math.round(travelTime);
      stop.combustibleEstimado = parseFloat(fuel.toFixed(2));
      stop.distanciaAcumulada = parseFloat(cumulativeDistance.toFixed(2));
      stop.tiempoAcumulado = Math.round(cumulativeTime);
      stop.orden = i + 1;

      previousPoint = stop.coordenadas;
    } else {
      stop.distancia = 0;
      stop.tiempoEstimado = 0;
      stop.combustibleEstimado = 0;
      stop.orden = i + 1;
    }

    enrichedStops.push(stop);
  }

  return enrichedStops;
}

/**
 * Nearest Neighbor algorithm for route optimization
 * Starts from the first stop and always goes to the nearest unvisited stop
 * @param {Array} stops - Array of stop objects with coordenadas
 * @param {Object} startPoint - Optional starting point
 * @returns {Array} - Optimized route
 */
export function nearestNeighborOptimization(stops, startPoint = null) {
  if (!stops || stops.length <= 1) {
    return stops || [];
  }

  const unvisited = [...stops];
  const route = [];
  let currentPoint = startPoint;

  // If no start point, use first stop
  if (!currentPoint && unvisited.length > 0) {
    const firstStop = unvisited.shift();
    route.push(firstStop);
    currentPoint = firstStop.coordenadas;
  }

  // Build route by always selecting nearest neighbor
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      if (unvisited[i].coordenadas) {
        const distance = haversineDistance(currentPoint, unvisited[i].coordenadas);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
    }

    const nearestStop = unvisited.splice(nearestIndex, 1)[0];
    route.push(nearestStop);
    currentPoint = nearestStop.coordenadas;
  }

  return route;
}

/**
 * 2-Opt algorithm for route improvement
 * Iteratively removes crossing paths to optimize the route
 * @param {Array} stops - Array of stop objects with coordenadas
 * @param {Object} startPoint - Optional starting point
 * @param {number} maxIterations - Maximum iterations to prevent infinite loops
 * @returns {Array} - Optimized route
 */
export function twoOptOptimization(stops, startPoint = null, maxIterations = 100) {
  if (!stops || stops.length <= 2) {
    return stops || [];
  }

  let route = [...stops];
  let improved = true;
  let iterations = 0;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 2; j < route.length; j++) {
        // Skip if we don't have valid coordinates
        if (!route[i].coordenadas || !route[i + 1].coordenadas ||
            !route[j].coordenadas || (j + 1 < route.length && !route[j + 1].coordenadas)) {
          continue;
        }

        // Calculate current distance
        const currentDist = haversineDistance(route[i].coordenadas, route[i + 1].coordenadas) +
                           (j + 1 < route.length ? haversineDistance(route[j].coordenadas, route[j + 1].coordenadas) : 0);

        // Calculate distance after swap
        const newDist = haversineDistance(route[i].coordenadas, route[j].coordenadas) +
                       (j + 1 < route.length ? haversineDistance(route[i + 1].coordenadas, route[j + 1].coordenadas) : 0);

        // If improvement found, reverse the segment
        if (newDist < currentDist) {
          const segment = route.slice(i + 1, j + 1).reverse();
          route = [...route.slice(0, i + 1), ...segment, ...route.slice(j + 1)];
          improved = true;
        }
      }
    }
  }

  return route;
}

/**
 * Zone-based optimization
 * Groups stops by zones and optimizes within each zone
 * @param {Array} stops - Array of stop objects
 * @param {string} zoneField - Field name for zone identification (default: 'zona')
 * @returns {Array} - Optimized route
 */
export function zoneBasedOptimization(stops, zoneField = 'zona') {
  if (!stops || stops.length <= 1) {
    return stops || [];
  }

  // Group stops by zone
  const zones = {};
  stops.forEach(stop => {
    const zone = stop[zoneField] || 'SIN_ZONA';
    if (!zones[zone]) {
      zones[zone] = [];
    }
    zones[zone].push(stop);
  });

  // Calculate centroid for each zone
  const zoneCentroids = {};
  Object.keys(zones).forEach(zoneName => {
    const zoneStops = zones[zoneName];
    const validStops = zoneStops.filter(s => s.coordenadas);

    if (validStops.length > 0) {
      const avgLat = validStops.reduce((sum, s) => sum + s.coordenadas.lat, 0) / validStops.length;
      const avgLng = validStops.reduce((sum, s) => sum + s.coordenadas.lng, 0) / validStops.length;
      zoneCentroids[zoneName] = { lat: avgLat, lng: avgLng };
    }
  });

  // Order zones by proximity (nearest neighbor between zone centroids)
  const zoneOrder = [];
  const unvisitedZones = Object.keys(zoneCentroids);

  if (unvisitedZones.length > 0) {
    // Start with first zone
    let currentZone = unvisitedZones.shift();
    zoneOrder.push(currentZone);

    while (unvisitedZones.length > 0) {
      let nearestZone = unvisitedZones[0];
      let nearestDist = Infinity;

      for (const zone of unvisitedZones) {
        const dist = haversineDistance(zoneCentroids[currentZone], zoneCentroids[zone]);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestZone = zone;
        }
      }

      zoneOrder.push(nearestZone);
      unvisitedZones.splice(unvisitedZones.indexOf(nearestZone), 1);
      currentZone = nearestZone;
    }
  }

  // Add zones without coordinates
  Object.keys(zones).forEach(zone => {
    if (!zoneOrder.includes(zone)) {
      zoneOrder.push(zone);
    }
  });

  // Optimize within each zone and combine
  let optimizedRoute = [];
  zoneOrder.forEach(zoneName => {
    const zoneStops = zones[zoneName];
    if (zoneStops.length > 0) {
      // Use nearest neighbor within each zone
      const optimizedZone = nearestNeighborOptimization(zoneStops);
      optimizedRoute = [...optimizedRoute, ...optimizedZone];
    }
  });

  return optimizedRoute;
}

/**
 * Intelligent optimizer that runs multiple algorithms and picks the best
 * @param {Array} stops - Array of stop objects
 * @param {Object} options - Optimization options
 * @returns {Object} - Best route with metrics and algorithm used
 */
export function intelligentOptimizer(stops, options = {}) {
  const {
    startPoint = null,
    zoneField = 'zona',
    enableZoneOptimization = true,
    enableNearestNeighbor = true,
    enableTwoOpt = true
  } = options;

  if (!stops || stops.length === 0) {
    return {
      route: [],
      metrics: calculateRouteMetrics([]),
      algorithm: 'none',
      improvements: []
    };
  }

  if (stops.length === 1) {
    const enrichedRoute = addStopMetrics(stops, startPoint);
    return {
      route: enrichedRoute,
      metrics: calculateRouteMetrics(stops, startPoint),
      algorithm: 'single-stop',
      improvements: []
    };
  }

  const results = [];
  const originalMetrics = calculateRouteMetrics(stops, startPoint);

  // Store original route
  results.push({
    algorithm: 'original',
    route: stops,
    metrics: originalMetrics
  });

  // Run Nearest Neighbor
  if (enableNearestNeighbor) {
    const nnRoute = nearestNeighborOptimization(stops, startPoint);
    const nnMetrics = calculateRouteMetrics(nnRoute, startPoint);
    results.push({
      algorithm: 'nearest-neighbor',
      route: nnRoute,
      metrics: nnMetrics
    });
  }

  // Run 2-Opt on original route
  if (enableTwoOpt) {
    const twoOptRoute = twoOptOptimization(stops, startPoint);
    const twoOptMetrics = calculateRouteMetrics(twoOptRoute, startPoint);
    results.push({
      algorithm: '2-opt',
      route: twoOptRoute,
      metrics: twoOptMetrics
    });
  }

  // Run 2-Opt on Nearest Neighbor result (hybrid approach)
  if (enableNearestNeighbor && enableTwoOpt) {
    const nnRoute = nearestNeighborOptimization(stops, startPoint);
    const hybridRoute = twoOptOptimization(nnRoute, startPoint);
    const hybridMetrics = calculateRouteMetrics(hybridRoute, startPoint);
    results.push({
      algorithm: 'nearest-neighbor-2opt',
      route: hybridRoute,
      metrics: hybridMetrics
    });
  }

  // Run Zone-based optimization
  if (enableZoneOptimization) {
    const zoneRoute = zoneBasedOptimization(stops, zoneField);
    const zoneMetrics = calculateRouteMetrics(zoneRoute, startPoint);
    results.push({
      algorithm: 'zone-based',
      route: zoneRoute,
      metrics: zoneMetrics
    });

    // Run 2-Opt on zone-based result
    if (enableTwoOpt) {
      const zoneOptRoute = twoOptOptimization(zoneRoute, startPoint);
      const zoneOptMetrics = calculateRouteMetrics(zoneOptRoute, startPoint);
      results.push({
        algorithm: 'zone-based-2opt',
        route: zoneOptRoute,
        metrics: zoneOptMetrics
      });
    }
  }

  // Find best result (minimize total distance)
  let bestResult = results[0];
  for (const result of results) {
    if (result.metrics.totalDistance < bestResult.metrics.totalDistance) {
      bestResult = result;
    }
  }

  // Calculate improvements
  const improvements = results.map(result => ({
    algorithm: result.algorithm,
    distance: result.metrics.totalDistance,
    time: result.metrics.totalTime,
    fuel: result.metrics.totalFuel,
    distanceSaved: parseFloat((originalMetrics.totalDistance - result.metrics.totalDistance).toFixed(2)),
    distanceSavedPercent: parseFloat((((originalMetrics.totalDistance - result.metrics.totalDistance) / originalMetrics.totalDistance) * 100).toFixed(2)),
    timeSaved: parseFloat((originalMetrics.totalTime - result.metrics.totalTime).toFixed(2)),
    fuelSaved: parseFloat((originalMetrics.totalFuel - result.metrics.totalFuel).toFixed(2))
  })).sort((a, b) => a.distance - b.distance);

  // Add detailed metrics to each stop in the best route
  const enrichedRoute = addStopMetrics(bestResult.route, startPoint);

  return {
    route: enrichedRoute,
    metrics: bestResult.metrics,
    algorithm: bestResult.algorithm,
    improvements,
    originalMetrics
  };
}

/**
 * Optimize route with constraints (time windows, vehicle capacity, etc.)
 * @param {Array} stops - Array of stop objects
 * @param {Object} constraints - Constraints object
 * @returns {Object} - Optimized route considering constraints
 */
export function optimizeWithConstraints(stops, constraints = {}) {
  const {
    maxDistance = Infinity,
    maxTime = Infinity,
    maxStops = Infinity,
    vehicleCapacity = Infinity,
    startPoint = null,
    timeWindows = false
  } = constraints;

  // Filter stops that fit within constraints
  let validStops = stops.filter((stop, index) => index < maxStops);

  // If capacity constraint exists, sort by priority/size and select
  if (vehicleCapacity < Infinity && validStops.some(s => s.carga)) {
    validStops.sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0));
    let totalLoad = 0;
    validStops = validStops.filter(stop => {
      if (totalLoad + (stop.carga || 0) <= vehicleCapacity) {
        totalLoad += stop.carga || 0;
        return true;
      }
      return false;
    });
  }

  // Run intelligent optimizer
  const result = intelligentOptimizer(validStops, { startPoint });

  // Check if constraints are violated
  const constraintViolations = [];
  if (result.metrics.totalDistance > maxDistance) {
    constraintViolations.push(`Distance ${result.metrics.totalDistance}km exceeds maximum ${maxDistance}km`);
  }
  if (result.metrics.totalTime > maxTime) {
    constraintViolations.push(`Time ${result.metrics.totalTime}h exceeds maximum ${maxTime}h`);
  }

  return {
    ...result,
    constraintViolations,
    constraintsMet: constraintViolations.length === 0
  };
}

// Default export with all functions
const routeOptimizer = {
  haversineDistance,
  calculateRouteMetrics,
  addStopMetrics,
  nearestNeighborOptimization,
  twoOptOptimization,
  zoneBasedOptimization,
  intelligentOptimizer,
  optimizeWithConstraints
};

export default routeOptimizer;
