import * as THREE from 'three';

export interface POI {
  name: string;
  position: THREE.Vector3;
  radius: number;
  type: 'sun' | 'planet' | 'moon' | 'asteroidBelt' | 'oortCloud';
  moons?: POI[];
}

export const autoCruiseConfig = {
  autoCruiseEnabled: false,
  travelSpeed: 200, // Increased for faster travel, especially in spaceship mode
  approachDistance: 0.05, // Closer approach for more dramatic effect
  orbitDuration: 8, // Shorter orbit duration for more dynamic experience
  fovNarrow: 45, // More zoomed-in cockpit view
};

// Example POI list structure (to be filled in at runtime)
export const poiList: POI[] = [
  // { name: 'Sun', position: new THREE.Vector3(0,0,0), radius: 30, type: 'sun' },
  // { name: 'Earth', position: new THREE.Vector3(55,0,0), radius: 1.3, type: 'planet', moons: [...] },
  // ...
];

// Utility: Shuffle array
function shuffle<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate a random tour of POIs (no repeats)
export function getRandomTour(pois: POI[], count: number = 7): POI[] {
  return shuffle(pois).slice(0, count);
} 