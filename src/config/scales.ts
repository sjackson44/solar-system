export type ViewMode = 'circular' | 'scientific';

export interface SolarSystemConfig {
  sunScale: number;
  planetScales: Record<string, number>;
  planetOrbitRadii: Record<string, number>;
  moonScales: Record<string, Record<string, number>>;
  moonOrbitRadii: Record<string, Record<string, number>>;
  orbitLineThickness: number;
  asteroidBeltScale: {
    innerRadius: number;
    outerRadius: number;
    height: number;
  };
  oortCloudScale: {
    innerRadius: number;
    outerRadius: number;
    density: number;
  };
  zoomLimits: {
    globalMinDistance: number;
    globalMaxDistance: number;
    focusedMinDistance: number;
    focusedMaxDistance: number;
  };
  starfieldSize: number;
  boxSize: number;
}

// Circular mode: Aesthetically pleasing, not to scale
export const circularConfig: SolarSystemConfig = {
  sunScale: 30,
  planetScales: {
    Mercury: 0.8,
    Venus: 1.2,
    Earth: 1.3,
    Mars: 1.0,
    Jupiter: 4.0,
    Saturn: 3.5,
    Uranus: 2.5,
    Neptune: 2.4,
    Pluto: 0.6,
  },
  planetOrbitRadii: {
    Mercury: 35,
    Venus: 45,
    Earth: 55,
    Mars: 70,
    Jupiter: 130,
    Saturn: 170,
    Uranus: 220,
    Neptune: 270,
    Pluto: 320,
  },
  moonScales: {
    Earth: { Moon: 0.3 },
    Mars: { Phobos: 0.15, Deimos: 0.1 },
    Jupiter: { Io: 0.4, Europa: 0.3 },
    Saturn: { Titan: 0.5 },
    Pluto: { Charon: 0.3 },
  },
  moonOrbitRadii: {
    Earth: { Moon: 3 },
    Mars: { Phobos: 2.5, Deimos: 3.2 },
    Jupiter: { Io: 8, Europa: 10 },
    Saturn: { Titan: 12 },
    Pluto: { Charon: 2 },
  },
  orbitLineThickness: 0.3,
  asteroidBeltScale: {
    innerRadius: 75,
    outerRadius: 93,
    height: 6,
  },
  oortCloudScale: {
    innerRadius: 400,
    outerRadius: 600,
    density: 0.8,
  },
  zoomLimits: {
    globalMinDistance: 20,
    globalMaxDistance: 1000,
    focusedMinDistance: 1,
    focusedMaxDistance: 100,
  },
  starfieldSize: 8000,
  boxSize: 3000,
};

// Scientific mode: Realistic ratios based on actual astronomy data
export const scientificConfig: SolarSystemConfig = {
  sunScale: 15, // Scaled up for visibility while maintaining relative proportions
  planetScales: {
    // Scaled up from realistic ratios for visibility
    Mercury: 0.5,   // Scaled from 0.0033
    Venus: 1.3,     // Scaled from 0.0087
    Earth: 1.4,     // Scaled from 0.0092
    Mars: 0.7,      // Scaled from 0.0049
    Jupiter: 15.0,  // Scaled from 0.1005
    Saturn: 12.5,   // Scaled from 0.0837
    Uranus: 5.5,    // Scaled from 0.0365
    Neptune: 5.3,   // Scaled from 0.0354
    Pluto: 0.25,    // Scaled from 0.0017
  },
  planetOrbitRadii: {
    // Scaled up from realistic AU distances for visibility
    Mercury: 58,    // Scaled from 0.387
    Venus: 108,     // Scaled from 0.723
    Earth: 150,     // Scaled from 1.000
    Mars: 228,      // Scaled from 1.524
    Jupiter: 780,   // Scaled from 5.203
    Saturn: 1430,   // Scaled from 9.537
    Uranus: 2880,   // Scaled from 19.191
    Neptune: 4510,  // Scaled from 30.069
    Pluto: 5920,    // Scaled from 39.482
  },
  moonScales: {
    // Scaled up for visibility while maintaining relative proportions
    Earth: { Moon: 0.4 },      // Scaled from 0.27
    Mars: { Phobos: 0.05, Deimos: 0.03 }, // Scaled from 0.003, 0.002
    Jupiter: { Io: 0.4, Europa: 0.3 },     // Scaled from 0.026, 0.022
    Saturn: { Titan: 0.6 },    // Scaled from 0.044
    Pluto: { Charon: 0.8 },    // Scaled from 0.51
  },
  moonOrbitRadii: {
    // Scaled up for visibility
    Earth: { Moon: 4.5 },      // Scaled from 30.3
    Mars: { Phobos: 2.1, Deimos: 5.3 },    // Scaled from 1.4, 3.5
    Jupiter: { Io: 4.5, Europa: 7.2 },     // Scaled from 3.0, 4.8
    Saturn: { Titan: 15.8 },   // Scaled from 10.5
    Pluto: { Charon: 12.3 },   // Scaled from 8.2
  },
  orbitLineThickness: 0.2,
  asteroidBeltScale: {
    innerRadius: 330,  // Between Mars and Jupiter
    outerRadius: 495,
    height: 7.5,
  },
  oortCloudScale: {
    innerRadius: 3000, // Scaled down for visibility
    outerRadius: 7500,
    density: 0.4,
  },
  zoomLimits: {
    globalMinDistance: 50,
    globalMaxDistance: 8000, // Adjusted for scientific view
    focusedMinDistance: 5,
    focusedMaxDistance: 500,
  },
  starfieldSize: 12000,
  boxSize: 15000,
};

// Export the configuration getter function
export const getSolarSystemConfig = (mode: ViewMode): SolarSystemConfig => {
  return mode === 'scientific' ? scientificConfig : circularConfig;
}; 