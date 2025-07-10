import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RotateCcw, Pause, Play, ZoomIn, ZoomOut, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { ViewMode, getSolarSystemConfig, SolarSystemConfig } from '../config/scales';
import ViewModeToggle from './ViewModeToggle';




interface Planet {
  name: string;
  radius: number;
  distance: number;
  color: string;
  speed: number;
  texture?: string;
  moons?: Array<{
    name: string;
    radius: number;
    distance: number;
    color: string;
    speed: number;
  }>;
  startAngle: number;
}

// Abstracted creation functions
const createSun = (config: SolarSystemConfig, textureLoader: THREE.TextureLoader) => {
  const sunGeometry = new THREE.SphereGeometry(config.sunScale, 32, 32);
  const sunTexture = textureLoader.load('/sun.jpg');
  const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  
  sun.userData = { planetName: 'Sun', clickable: true, isSun: true };
  return sun;
};

const createPlanet = (
  planetData: Planet, 
  config: SolarSystemConfig, 
  textureLoader: THREE.TextureLoader
) => {
  const planetGeometry = new THREE.SphereGeometry(planetData.radius, 32, 32);
  let planetMaterial: THREE.Material;
  
  // Apply specific textures for planets that have them
  if (planetData.name === 'Earth') {
    const earthDayTexture = textureLoader.load('/earth_day.jpg');
    const earthNightTexture = textureLoader.load('/earth_night.jpg');
    // Create a custom shader material for day/night cycle
    planetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: earthDayTexture },
        nightTexture: { value: earthNightTexture },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 sunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          float intensity = dot(normalize(vNormal), normalize(sunDirection));
          intensity = clamp(intensity, 0.0, 1.0);
          vec3 dayColor = texture2D(dayTexture, vUv).rgb;
          vec3 nightColor = texture2D(nightTexture, vUv).rgb;
          vec3 color = mix(nightColor, dayColor, intensity);
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
  } else if (planetData.name === 'Mars') {
    const marsTexture = textureLoader.load('/mars.jpg');
    planetMaterial = new THREE.MeshPhongMaterial({ 
      map: marsTexture,
      shininess: 8,
      specular: 0x111111
    });
  } else if (planetData.name === 'Jupiter') {
    const jupiterTexture = textureLoader.load('/jupiter.jpg');
    planetMaterial = new THREE.MeshPhongMaterial({ 
      map: jupiterTexture,
      shininess: 15,
      specular: 0x333333
    });
  } else if (planetData.name === 'Saturn') {
    const saturnTexture = textureLoader.load('/saturn.jpg');
    planetMaterial = new THREE.MeshPhongMaterial({ 
      map: saturnTexture,
      shininess: 12,
      specular: 0x222222
    });
  } else if (planetData.name === 'Uranus') {
    const uranusTexture = textureLoader.load('/uranus.jpg');
    planetMaterial = new THREE.MeshPhongMaterial({ 
      map: uranusTexture,
      shininess: 10,
      specular: 0x222222
    });
  } else if (planetData.name === 'Neptune') {
    const neptuneTexture = textureLoader.load('/neptune.jpg');
    planetMaterial = new THREE.MeshPhongMaterial({ 
      map: neptuneTexture,
      shininess: 10,
      specular: 0x222222
    });
  } else if (planetData.name === 'Venus') {
    const venusTexture = textureLoader.load('/venus.jpg');
    planetMaterial = new THREE.MeshPhongMaterial({ 
      map: venusTexture,
      shininess: 8,
      specular: 0x111111
    });
  } else if (planetData.name === 'Mercury') {
    const mercuryTexture = textureLoader.load('/mercury.jpg');
    planetMaterial = new THREE.MeshPhongMaterial({ 
      map: mercuryTexture,
      shininess: 5,
      specular: 0x0a0a0a
    });
  } else if (planetData.name === 'Pluto') {
    const plutoTexture = textureLoader.load('/pluto.jpg');
    planetMaterial = new THREE.MeshPhongMaterial({ 
      map: plutoTexture,
      shininess: 10,
      specular: 0x222222
    });
  } else {
    planetMaterial = new THREE.MeshPhongMaterial({ 
      color: planetData.color,
      shininess: 10,
      specular: 0x222222
    });
  }
  
  const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
  planetMesh.castShadow = true;
  planetMesh.receiveShadow = true;
  planetMesh.userData = { planetName: planetData.name, clickable: true };
  
  return planetMesh;
};

const createMoon = (
  moonData: { name: string; radius: number; distance: number; color: string; speed: number },
  planetName: string,
  moonIndex: number,
  textureLoader: THREE.TextureLoader
) => {
  const moonGeometry = new THREE.SphereGeometry(moonData.radius, 16, 16);
  let moonMaterial: THREE.Material;
  
  // Apply Moon texture specifically to Earth's moon
  if (planetName === 'Earth') {
    const moonTexture = textureLoader.load('/moon.jpg');
    moonMaterial = new THREE.MeshPhongMaterial({ 
      map: moonTexture,
      shininess: 5,
      specular: 0x111111
    });
  } else if (planetName === 'Mars') {
    if (moonIndex === 0) {
      const phobosTexture = textureLoader.load('/phobos.jpg');
      moonMaterial = new THREE.MeshPhongMaterial({ 
        map: phobosTexture,
        shininess: 2,
        specular: 0x0a0a0a
      });
    } else {
      const deimosTexture = textureLoader.load('/deimos.jpg');
      moonMaterial = new THREE.MeshPhongMaterial({ 
        map: deimosTexture,
        shininess: 2,
        specular: 0x0a0a0a
      });
    }
  } else if (planetName === 'Pluto' && moonData.name === 'Charon') {
    const charonTexture = textureLoader.load('/charon.jpg');
    moonMaterial = new THREE.MeshPhongMaterial({
      map: charonTexture,
      shininess: 5,
      specular: 0x111111
    });
  } else if (planetName === 'Jupiter' && moonData.name === 'Io') {
    const ioTexture = textureLoader.load('/io.jpg');
    moonMaterial = new THREE.MeshPhongMaterial({
      map: ioTexture,
      shininess: 5,
      specular: 0x111111
    });
  } else if (planetName === 'Jupiter' && moonData.name === 'Europa') {
    const europaTexture = textureLoader.load('/europa.jpg');
    moonMaterial = new THREE.MeshPhongMaterial({
      map: europaTexture,
      shininess: 5,
      specular: 0x111111
    });
  } else if (planetName === 'Saturn' && moonData.name === 'Titan') {
    const titanTexture = textureLoader.load('/titan.jpg');
    moonMaterial = new THREE.MeshPhongMaterial({
      map: titanTexture,
      shininess: 5,
      specular: 0x111111
    });
  } else {
    moonMaterial = new THREE.MeshPhongMaterial({ 
      color: moonData.color,
      shininess: 10,
      specular: 0x222222
    });
  }
  
  const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
  moonMesh.castShadow = true;
  moonMesh.receiveShadow = true;
  moonMesh.userData = { planetName: planetName, isMoon: true, clickable: true, moonIndex };
  
  return moonMesh;
};

const createOrbitRing = (planetData: Planet, config: SolarSystemConfig) => {
  const ringGeometry = new THREE.RingGeometry(
    planetData.distance - 1, 
    planetData.distance + 1, 
    64
  );
  const ringMaterial = new THREE.MeshBasicMaterial({ 
    color: planetData.color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
    visible: true
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.userData = { planetName: planetData.name, originalOpacity: 0.6 };
  
  return ring;
};

const createAsteroidBelt = (config: SolarSystemConfig) => {
  const asteroidBelt = new THREE.Group();
  const asteroidCount = 3000;
  const asteroidGeometries = [
    new THREE.DodecahedronGeometry(0.3),
    new THREE.IcosahedronGeometry(0.3),
    new THREE.OctahedronGeometry(0.3),
    new THREE.TetrahedronGeometry(0.3),
  ];

  for (let i = 0; i < asteroidCount; i++) {
    const geometry = asteroidGeometries[Math.floor(Math.random() * asteroidGeometries.length)].clone();
    const scale = 1.0 + Math.random() * 2.5;
    geometry.scale(scale, scale, scale);
    
    const positions = geometry.attributes.position.array as Float32Array;
    for (let j = 0; j < positions.length; j += 3) {
      const deformation = 0.15 + Math.random() * 0.25;
      positions[j] *= deformation;
      positions[j + 1] *= deformation;
      positions[j + 2] *= deformation;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    const baseColors = [0x8b7355, 0x9d8b6f, 0x7a6b4f, 0xa59580, 0x6f5f43];
    const baseColor = baseColors[Math.floor(Math.random() * baseColors.length)];
    const colorVariation = Math.random() * 0.4 - 0.2;
    const material = new THREE.MeshPhongMaterial({ 
      color: new THREE.Color(baseColor).offsetHSL(0, 0, colorVariation),
      shininess: 8,
      specular: 0x333333,
      emissive: new THREE.Color(baseColor).multiplyScalar(0.02)
    });
    
    const asteroid = new THREE.Mesh(geometry, material);
    
    const distance = config.asteroidBeltScale.innerRadius + Math.random() * (config.asteroidBeltScale.outerRadius - config.asteroidBeltScale.innerRadius);
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * config.asteroidBeltScale.height;
    
    asteroid.position.set(
      Math.cos(angle) * distance,
      height,
      Math.sin(angle) * distance
    );
    
    asteroid.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    
    asteroid.userData = {
      distance: distance,
      angle: angle,
      height: height,
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.025,
        y: (Math.random() - 0.5) * 0.025,
        z: (Math.random() - 0.5) * 0.025
      },
      orbitalSpeed: 0.00015 + Math.random() * 0.0003
    };
    
    asteroid.castShadow = true;
    asteroid.receiveShadow = true;
    asteroidBelt.add(asteroid);
  }
  
  return asteroidBelt;
};

const createOortCloud = (config: SolarSystemConfig) => {
  const oortCloud = new THREE.Group();
  const oortObjectCount = 8000;
  const oortGeometries = [
    new THREE.IcosahedronGeometry(0.15),
    new THREE.OctahedronGeometry(0.15),
    new THREE.TetrahedronGeometry(0.2),
  ];

  for (let i = 0; i < oortObjectCount; i++) {
    const geometry = oortGeometries[Math.floor(Math.random() * oortGeometries.length)].clone();
    const scale = 0.3 + Math.random() * 1.2;
    geometry.scale(scale, scale, scale);
    
    const positions = geometry.attributes.position.array as Float32Array;
    for (let j = 0; j < positions.length; j += 3) {
      const deformation = 0.8 + Math.random() * 0.4;
      positions[j] *= deformation;
      positions[j + 1] *= deformation;
      positions[j + 2] *= deformation;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    const iceColors = [0xb8d4f0, 0xc8e0f5, 0xa8c8e8, 0xd0e8ff, 0x9bb8d3];
    const baseColor = iceColors[Math.floor(Math.random() * iceColors.length)];
    const colorVariation = Math.random() * 0.3 - 0.15;
    const material = new THREE.MeshPhongMaterial({ 
      color: new THREE.Color(baseColor).offsetHSL(0, 0, colorVariation),
      shininess: 60,
      specular: 0x888888,
      emissive: new THREE.Color(baseColor).multiplyScalar(0.05),
      transparent: true,
      opacity: 0.7 + Math.random() * 0.3
    });
    
    const oortObject = new THREE.Mesh(geometry, material);
    
    const distance = config.oortCloudScale.innerRadius + Math.random() * (config.oortCloudScale.outerRadius - config.oortCloudScale.innerRadius);
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(2 * Math.random() - 1);
    
    oortObject.position.set(
      distance * Math.sin(theta) * Math.cos(phi),
      distance * Math.cos(theta),
      distance * Math.sin(theta) * Math.sin(phi)
    );
    
    oortObject.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    
    oortObject.userData = {
      distance: distance,
      phi: phi,
      theta: theta,
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.005,
        y: (Math.random() - 0.5) * 0.005,
        z: (Math.random() - 0.5) * 0.005
      },
      orbitalSpeed: 0.000001 + Math.random() * 0.000002,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.01 + Math.random() * 0.02
    };
    
    oortCloud.add(oortObject);
  }
  
  return oortCloud;
};

const createStarfield = (config: SolarSystemConfig) => {
  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 8000;
  const starsPositions = new Float32Array(starsCount * 3);

  for (let i = 0; i < starsCount * 3; i += 3) {
    const distance = config.starfieldSize * 0.5 + Math.random() * config.starfieldSize * 0.5;
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(2 * Math.random() - 1);
    
    starsPositions[i] = distance * Math.sin(theta) * Math.cos(phi);
    starsPositions[i + 1] = distance * Math.cos(theta);
    starsPositions[i + 2] = distance * Math.sin(theta) * Math.sin(phi);
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
  const starsMaterial = new THREE.PointsMaterial({ 
    color: 0xffffff,
    size: 0.8,
    transparent: true,
    opacity: 0.6
  });
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  
  return stars;
};

const SolarSystem: React.FC = () => {
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('circular');
  
  // Get the current configuration based on view mode
  const config = useMemo(() => getSolarSystemConfig(viewMode), [viewMode]);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const planetsRef = useRef<Array<{ mesh: THREE.Mesh; orbit: THREE.Group; planet: Planet; moons?: THREE.Mesh[] }>>([]);
  const frameRef = useRef<number>();
  const [autoRotate, setAutoRotate] = React.useState(false);
  const autoRotateRef = useRef(autoRotate);
  const [orbitsActive, setOrbitsActive] = React.useState(true);
  const orbitsActiveRef = useRef(orbitsActive);
  const [hoveredPlanet, setHoveredPlanet] = React.useState<string | null>(null);
  const [hoveredObjectType, setHoveredObjectType] = React.useState<'planet' | 'moon' | 'sun' | 'orbit' | null>(null);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [focusedPlanet, setFocusedPlanet] = React.useState<string | null>(null);
  const focusedPlanetRef = useRef<string | null>(null);

  const [showOrbitLines, setShowOrbitLines] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showFullscreenMessage, setShowFullscreenMessage] = React.useState(false);
  const [orbitLinesBeforeFullscreen, setOrbitLinesBeforeFullscreen] = React.useState(true);
  const cameraAngleRef = useRef(0);
  const cameraDistanceRef = useRef(160);
  const focusedCameraAngleRef = useRef(0);
  const focusedCameraDistanceRef = useRef(20);
  const focusedCameraVerticalAngleRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraVerticalAngleRef = useRef(0.5);
  const oortCloudRef = useRef<THREE.Group>();
  
  // Update camera distance ref when viewMode changes
  useEffect(() => {
    const newDistance = viewMode === 'scientific' ? 400 : 160;
    cameraDistanceRef.current = newDistance;
  }, [viewMode]);
  
  // Camera distance limits from config
  const focusedMinDistance = config.zoomLimits.focusedMinDistance;
  
  const focusedPlanetMinDistanceRef = useRef(focusedMinDistance);
  const asteroidBeltRef = useRef<THREE.Group>();
  const orbitRingsRef = useRef<Array<{ ring: THREE.Mesh; planetName: string }>>([]);
  const [focusedMoon, setFocusedMoon] = React.useState<{ planet: string; moonIndex: number } | null>(null);
  const focusedMoonRef = useRef<{ planet: string; moonIndex: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [accordionOpen, setAccordionOpen] = React.useState<'control' | 'info' | null>('info');
  const [planetAccordion, setPlanetAccordion] = React.useState<string | null>(null);

  // Handle view mode change
  const handleViewModeChange = useCallback((newMode: ViewMode) => {
    setViewMode(newMode);
  }, []);

  const planets: Planet[] = useMemo(() => [
    {
      name: 'Mercury',
      radius: config.planetScales.Mercury,
      distance: config.planetOrbitRadii.Mercury,
      color: '#8c7853',
      speed: 0.01,
      startAngle: Math.random() * Math.PI * 2,
    },
    {
      name: 'Venus',
      radius: config.planetScales.Venus,
      distance: config.planetOrbitRadii.Venus,
      color: '#ffc649',
      speed: 0.0075,
      startAngle: Math.random() * Math.PI * 2,
    },
    {
      name: 'Earth',
      radius: config.planetScales.Earth,
      distance: config.planetOrbitRadii.Earth,
      color: '#6b93d6',
      speed: 0.005,
      startAngle: Math.random() * Math.PI * 2,
      moons: [
        {
          name: 'Moon',
          radius: config.moonScales.Earth.Moon,
          distance: config.moonOrbitRadii.Earth.Moon,
          color: '#c8c8c8',
          speed: 0.025,
        },
      ],
    },
    {
      name: 'Mars',
      radius: config.planetScales.Mars,
      distance: config.planetOrbitRadii.Mars,
      color: '#c1440e',
      speed: 0.00375,
      startAngle: Math.random() * Math.PI * 2,
      moons: [
        {
          name: 'Phobos',
          radius: config.moonScales.Mars.Phobos,
          distance: config.moonOrbitRadii.Mars.Phobos,
          color: '#8c7853',
          speed: 0.02,
        },
        {
          name: 'Deimos',
          radius: config.moonScales.Mars.Deimos,
          distance: config.moonOrbitRadii.Mars.Deimos,
          color: '#8c7853',
          speed: 0.015,
        },
      ],
    },
    {
      name: 'Jupiter',
      radius: config.planetScales.Jupiter,
      distance: config.planetOrbitRadii.Jupiter,
      color: '#d8ca9d',
      speed: 0.002,
      startAngle: Math.random() * Math.PI * 2,
      moons: [
        {
          name: 'Io',
          radius: config.moonScales.Jupiter.Io,
          distance: config.moonOrbitRadii.Jupiter.Io,
          color: '#c8c8c8',
          speed: 0.0125,
        },
        {
          name: 'Europa',
          radius: config.moonScales.Jupiter.Europa,
          distance: config.moonOrbitRadii.Jupiter.Europa,
          color: '#ffc649',
          speed: 0.01,
        },
      ],
    },
    {
      name: 'Saturn',
      radius: config.planetScales.Saturn,
      distance: config.planetOrbitRadii.Saturn,
      color: '#fad5a5',
      speed: 0.0015,
      startAngle: Math.random() * Math.PI * 2,
      moons: [
        {
          name: 'Titan',
          radius: config.moonScales.Saturn.Titan,
          distance: config.moonOrbitRadii.Saturn.Titan,
          color: '#c8c8c8',
          speed: 0.0075,
        },
      ],
    },
    {
      name: 'Uranus',
      radius: config.planetScales.Uranus,
      distance: config.planetOrbitRadii.Uranus,
      color: '#4fd0e3',
      speed: 0.001,
      startAngle: Math.random() * Math.PI * 2,
    },
    {
      name: 'Neptune',
      radius: config.planetScales.Neptune,
      distance: config.planetOrbitRadii.Neptune,
      color: '#4b70dd',
      speed: 0.00075,
      startAngle: Math.random() * Math.PI * 2,
    },
    {
      name: 'Pluto',
      radius: config.planetScales.Pluto,
      distance: config.planetOrbitRadii.Pluto,
      color: '#8c7853',
      speed: 0.0005,
      startAngle: Math.random() * Math.PI * 2,
      moons: [
        {
          name: 'Charon',
          radius: config.moonScales.Pluto.Charon,
          distance: config.moonOrbitRadii.Pluto.Charon,
          color: '#a0a0a0',
          speed: 0.015,
        },
      ],
    },
  ], [config]);

  // Update the ref when autoRotate state changes
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // Update the ref when orbitsActive state changes
  useEffect(() => {
    orbitsActiveRef.current = orbitsActive;
  }, [orbitsActive]);

  // Rebuild scene when viewMode changes
  useEffect(() => {
    setShowOrbitLines(false); // Always turn off orbit lines on view mode change
  }, [viewMode, config]);

  // Update the ref when focusedPlanet state changes
  useEffect(() => {
    focusedPlanetRef.current = focusedPlanet;
  }, [focusedPlanet]);

  // Update the ref when focusedMoon state changes
  useEffect(() => { focusedMoonRef.current = focusedMoon; }, [focusedMoon]);

  useEffect(() => {
    if (!mountRef.current) return;
    
    // Clear existing scene if rebuilding
    if (sceneRef.current) {
      while (sceneRef.current.children.length > 0) {
        sceneRef.current.remove(sceneRef.current.children[0]);
      }
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      config.boxSize // Far clipping plane from configuration
    );
    // Adjust initial camera position based on configuration
    const initialDistance = viewMode === 'scientific' ? 400 : 160;
    camera.position.set(0, 80, initialDistance);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Sun
    const sun = createSun(config, new THREE.TextureLoader());
    scene.add(sun);

    // Sun light
    const sunLight = new THREE.PointLight(0xffffff, 2, 500);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 600;
    scene.add(sunLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Additional directional light to ensure planets are visible
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);

    // Create asteroid belt
    const asteroidBelt = createAsteroidBelt(config);
    asteroidBeltRef.current = asteroidBelt;
    scene.add(asteroidBelt);

    // Create Oort Cloud
    const oortCloud = createOortCloud(config);
    oortCloudRef.current = oortCloud;
    scene.add(oortCloud);

    // Create planets
    const planetObjects: Array<{ mesh: THREE.Mesh; orbit: THREE.Group; planet: Planet; moons?: THREE.Mesh[] }> = [];

    // Mouse interaction setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    orbitRingsRef.current = []; // Clear and reset the orbit rings ref
    const clickableObjects: Array<{ mesh: THREE.Mesh; planetName: string; isMoon?: boolean; parentPlanet?: string; moonIndex?: number; isSun?: boolean }> = [];
    
    // Add sun to clickable objects
    clickableObjects.push({ mesh: sun, planetName: 'Sun', isSun: true });

    planets.forEach((planetData) => {
      // Create orbit group
      const orbitGroup = new THREE.Group();
      scene.add(orbitGroup);

      // Create planet with texture
      const planetMesh = createPlanet(planetData, config, new THREE.TextureLoader());
      planetMesh.position.x = planetData.distance;
      orbitGroup.add(planetMesh);
      
      // Add planet to clickable objects
      clickableObjects.push({ mesh: planetMesh, planetName: planetData.name });

      // Create orbit ring using configuration
      const ring = createOrbitRing(planetData, config);
      scene.add(ring);
      orbitRingsRef.current.push({ ring, planetName: planetData.name });

              // Add Saturn's rings
        if (planetData.name === 'Saturn') {
          const saturnRingGeometry = new THREE.RingGeometry(planetData.radius + 1, planetData.radius + 3, 64);
          const saturnRingTexture = new THREE.TextureLoader().load('/saturns_rings.png');
          const saturnRingMaterial = new THREE.MeshPhongMaterial({ 
            map: saturnRingTexture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0,
            alphaTest: 0.1 // Discard fully transparent pixels for crisp edges
          });
          const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
          saturnRing.rotation.x = -Math.PI / 2;
          saturnRing.position.set(0, 0, 0); // Position relative to planet, not orbit
          planetMesh.add(saturnRing); // Attach directly to planet mesh
        }

        // Add Uranus's rings (thin, white, vertical, no texture)
        if (planetData.name === 'Uranus') {
          // Create a separate group for Uranus rings to prevent them from spinning with the planet
          const uranusRingsGroup = new THREE.Group();
          uranusRingsGroup.position.copy(planetMesh.position);
          orbitGroup.add(uranusRingsGroup);
          
          const ringCount = 7;
          const baseInner = planetData.radius + 0.7;
          const ringGap = 0.18;
          for (let i = 0; i < ringCount; i++) {
            const innerRadius = baseInner + i * ringGap;
            const ringWidth = i < 4 ? 0.005 : 0.02;
            const outerRadius = innerRadius + ringWidth;
            const uranusRingGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
            const uranusRingMaterial = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.85
            });
            const uranusRing = new THREE.Mesh(uranusRingGeometry, uranusRingMaterial);
            uranusRing.rotation.x = -Math.PI / 2;
            uranusRing.rotation.z = Math.PI / 2; // Steep tilt for Uranus
            uranusRing.position.set(0, 0, 0);
            uranusRingsGroup.add(uranusRing);
          }
        }

        const moonMeshes: THREE.Mesh[] = [];
        // Add moons
        if (planetData.moons) {
          planetData.moons.forEach((moonData, moonIndex) => {
            const moonMesh = createMoon(moonData, planetData.name, moonIndex, new THREE.TextureLoader());
            moonMesh.position.set(
              planetData.distance + moonData.distance,
              0,
              0
            );
            orbitGroup.add(moonMesh);
            moonMeshes.push(moonMesh);
            // Add moon to clickable objects
            clickableObjects.push({ 
              mesh: moonMesh, 
              planetName: planetData.name, 
              isMoon: true, 
              parentPlanet: planetData.name,
              moonIndex: moonIndex
            });
          });
        }
        planetObjects.push({ mesh: planetMesh, orbit: orbitGroup, planet: planetData, moons: moonMeshes });
      });

    planetsRef.current = planetObjects;



    // Stars background
    const stars = createStarfield(config);
    scene.add(stars);

    // Ensure orbit lines visibility is properly set after scene rebuild
    if (orbitRingsRef.current.length > 0) {
      orbitRingsRef.current.forEach(({ ring }) => {
        ring.visible = showOrbitLines;
      });
    }

    // Mouse event handlers
    const handleMouseMove = (event: MouseEvent) => {
      if (!mountRef.current) return;
      
      // Handle camera dragging
      if (isDraggingRef.current) {
        const deltaX = event.clientX - lastMousePositionRef.current.x;
        const deltaY = event.clientY - lastMousePositionRef.current.y;
        
        if (focusedPlanetRef.current) {
          // Focused planet camera controls
          focusedCameraAngleRef.current -= deltaX * 0.01;
          focusedCameraVerticalAngleRef.current = Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 2, focusedCameraVerticalAngleRef.current + deltaY * 0.01)
          );
        } else {
          // Global camera controls
          cameraAngleRef.current -= deltaX * 0.005;
          cameraVerticalAngleRef.current = Math.max(
            -Math.PI / 3,
            Math.min(Math.PI / 3, cameraVerticalAngleRef.current + deltaY * 0.005)
          );
        }
        
        lastMousePositionRef.current = { x: event.clientX, y: event.clientY };
        return; // Skip hover detection while dragging
      }
      
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update mouse position for tooltip
      setMousePosition({ x: event.clientX, y: event.clientY });
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(orbitRingsRef.current.map(or => or.ring));
      const planetIntersects = raycaster.intersectObjects(clickableObjects.map(obj => obj.mesh));
      
      // Reset all rings to normal state
      orbitRingsRef.current.forEach(({ ring }) => {
        const material = ring.material as THREE.MeshBasicMaterial;
        material.opacity = ring.userData.originalOpacity;
      });
      
      // Check for planet/moon hover first (higher priority)
      if (planetIntersects.length > 0) {
        const intersectedObject = planetIntersects[0].object as THREE.Mesh;
        const objectData = clickableObjects.find(obj => obj.mesh === intersectedObject);
                  if (objectData) {
            if (objectData.isSun) {
              setHoveredPlanet('Sun');
              setHoveredObjectType('sun');
            } else if (objectData.isMoon) {
              // Find the moon name
              const planet = planets.find(p => p.name === objectData.parentPlanet);
              let moonName = `${objectData.parentPlanet}'s Moon`;
              if (planet && planet.moons && typeof objectData.moonIndex === 'number') {
                const moon = planet.moons[objectData.moonIndex];
                if (moon && moon.name) moonName = moon.name;
              }
              setHoveredPlanet(moonName);
              setHoveredObjectType('moon');
            } else {
              setHoveredPlanet(objectData.planetName);
              setHoveredObjectType('planet');
            }
          // Also highlight the corresponding orbit ring
          const correspondingRing = orbitRingsRef.current.find(or => or.planetName === objectData.planetName);
          if (correspondingRing) {
            const material = correspondingRing.ring.material as THREE.MeshBasicMaterial;
            material.opacity = 0.8;
          }
        }
      } else if (intersects.length > 0) {
        const intersectedRing = intersects[0].object as THREE.Mesh;
        const material = intersectedRing.material as THREE.MeshBasicMaterial;
        material.opacity = 0.8;
        setHoveredPlanet(intersectedRing.userData.planetName);
        setHoveredObjectType('orbit');
      } else {
        setHoveredPlanet(null);
        setHoveredObjectType(null);
      }
    };
    
    const handleMouseLeave = () => {
      // Reset all rings when mouse leaves the canvas
      orbitRingsRef.current.forEach(({ ring }) => {
        const material = ring.material as THREE.MeshBasicMaterial;
        material.opacity = ring.userData.originalOpacity;
      });
      setHoveredPlanet(null);
      setHoveredObjectType(null);
    };
    
    const handleClick = (event: MouseEvent) => {
      if (!mountRef.current || isDraggingRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(orbitRingsRef.current.map(or => or.ring));
      const planetIntersects = raycaster.intersectObjects(clickableObjects.map(obj => obj.mesh));
      
      // In the click handler, use the moons array for robust moon detection
      if (focusedPlanetRef.current && !focusedMoonRef.current) {
        const planetObj = planetsRef.current.find(p => p.planet.name === focusedPlanetRef.current);
        if (planetObj && focusedCameraDistanceRef.current < planetObj.planet.radius * 3 && planetObj.moons && planetObj.moons.length > 0) {
          const moonIntersects = raycaster.intersectObjects(planetObj.moons);
          if (moonIntersects.length > 0) {
            const moonMesh = moonIntersects[0].object as THREE.Mesh;
            const moonIndex = planetObj.moons.indexOf(moonMesh);
            if (moonIndex !== -1) {
              focusOnMoon(focusedPlanetRef.current, moonIndex);
              return;
            }
          }
        }
      }
      // Check for planet/moon clicks first (higher priority)
      if (planetIntersects.length > 0) {
        const intersectedObject = planetIntersects[0].object as THREE.Mesh;
        const objectData = clickableObjects.find(obj => obj.mesh === intersectedObject);
        if (objectData) {
          if (objectData.isSun) {
            focusOnPlanet('Sun');
          } else if (objectData.isMoon && focusedPlanetRef.current && !focusedMoonRef.current) {
            // This block is now redundant and can be removed
            // (handled above with planetObj.moons)
            return;
          } else {
            focusOnPlanet(objectData.planetName);
          }
        }
      } else if (intersects.length > 0) {
        const intersectedRing = intersects[0].object as THREE.Mesh;
        const planetName = intersectedRing.userData.planetName;
        focusOnPlanet(planetName);
      }
    };
    
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) { // Left mouse button
        isDraggingRef.current = true;
        lastMousePositionRef.current = { x: event.clientX, y: event.clientY };
        renderer.domElement.style.cursor = 'grabbing';
      }
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      renderer.domElement.style.cursor = 'grab';
    };
    
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseleave', handleMouseLeave);
    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseup', handleMouseUp); // Handle mouse up outside canvas

    // Set initial cursor style
    renderer.domElement.style.cursor = 'grab';

    // Mouse wheel zoom handler
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      
      if (focusedPlanetRef.current) {
        // Focused planet zoom
        const focusedZoomSpeed = 1; // Finer control for close inspection
        const focusedDelta = event.deltaY > 0 ? focusedZoomSpeed : -focusedZoomSpeed;
        const minDist = focusedPlanetMinDistanceRef.current;
        focusedCameraDistanceRef.current = Math.max(
          minDist,
          Math.min(config.zoomLimits.focusedMaxDistance, focusedCameraDistanceRef.current + focusedDelta)
        );
      } else {
        // Global zoom
        const currentDistance = cameraDistanceRef.current;
        const adaptiveZoomSpeed = Math.max(5, currentDistance * 0.05); // Faster zoom when far out
        const adaptiveDelta = event.deltaY > 0 ? adaptiveZoomSpeed : -adaptiveZoomSpeed;
        cameraDistanceRef.current = Math.max(
          config.zoomLimits.globalMinDistance,
          Math.min(config.zoomLimits.globalMaxDistance, cameraDistanceRef.current + adaptiveDelta)
        );
      }
    };
    
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Animation loop

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Rotate sun
      sun.rotation.y += 0.005;

      // Animate planets
      planetsRef.current.forEach(({ orbit, planet, mesh }) => {
        // Handle orbital motion around the sun
        const shouldOrbitSun = orbitsActiveRef.current && !focusedPlanetRef.current;
        if (shouldOrbitSun) {
          if (orbit.userData.initialized !== true) {
            orbit.rotation.y = planet.startAngle;
            orbit.userData.initialized = true;
          } else {
            orbit.rotation.y += planet.speed;
          }
        }
        
        // Always keep planet spinning on its axis
        mesh.rotation.y += 0.02;
        
        // Handle special planet rotations
        if (planet.name === 'Uranus') {
          // Uranus has a ~98 degree axial tilt - preserve it during orbit
          mesh.rotation.z = Math.PI * 98 / 180;
          
          // Handle Uranus rings group - maintain axial tilt but don't inherit Y-axis rotation
          orbit.children.forEach((child) => {
            if (child.type === 'Group' && child.children.length > 0) {
              const firstChild = child.children[0] as THREE.Mesh;
              if (firstChild.material && 
                  (Array.isArray(firstChild.material) ? 
                    false : 
                    (firstChild.material as THREE.Material).transparent)) {
                // This is the Uranus rings group
                child.rotation.z = Math.PI * 98 / 180; // Maintain axial tilt
                child.rotation.y = 0; // Don't inherit planet's Y-axis rotation
              }
            }
          });
        } else if (planet.name === 'Venus') {
          // Venus has retrograde rotation (rotates backwards)
          mesh.rotation.y -= 0.02; // Reverse the rotation direction
        }
        
        // Update Earth's day/night cycle
        if (planet.name === 'Earth' && mesh.material instanceof THREE.ShaderMaterial) {
          // Calculate sun direction relative to Earth
          const earthWorldPosition = new THREE.Vector3();
          mesh.getWorldPosition(earthWorldPosition);
          const sunDirection = new THREE.Vector3(0, 0, 0).sub(earthWorldPosition).normalize();
          mesh.material.uniforms.sunDirection.value = sunDirection;
        }
        
        // Handle moon orbits - seamless transitions based on focus state
        const shouldAnimateMoons = orbitsActiveRef.current || focusedPlanetRef.current === planet.name;
        const isMoonFocused = focusedMoonRef.current && focusedMoonRef.current.planet === planet.name;
        
        if (shouldAnimateMoons && planet.moons) {
          // Use consistent speed multiplier for focused planets regardless of zoom level
          const speedMultiplier = focusedPlanetRef.current === planet.name ? 3.0 : 1.0;
          
          // Find and animate moons within this planet's orbit group
          let moonIndex = 0;
          orbit.children.forEach((child) => {
            // Skip the planet mesh itself and Saturn's rings
            if (
              child !== mesh &&
              child.type === 'Mesh' &&
              (child as THREE.Mesh).material &&
              !(
                Array.isArray((child as THREE.Mesh).material) ?
                  false :
                  ((child as THREE.Mesh).material as THREE.Material & { transparent?: boolean }).transparent
              )
            ) {
              if (planet.moons && planet.moons[moonIndex]) {
                // Only animate if not focused on this specific moon
                if (!isMoonFocused || focusedMoonRef.current!.moonIndex !== moonIndex) {
                  const moonData = planet.moons[moonIndex];
                  const angle = Date.now() * moonData.speed * 0.001 * speedMultiplier;
                  child.position.x = planet.distance + Math.cos(angle) * moonData.distance;
                  child.position.z = Math.sin(angle) * moonData.distance;
                }
                moonIndex++;
              }
            }
          });
        }
      });

      // Animate stars
      stars.rotation.y += 0.0002;

      // Animate asteroid belt
      const shouldAnimateAsteroids = orbitsActiveRef.current && !focusedPlanetRef.current;
      if (asteroidBeltRef.current && shouldAnimateAsteroids) {
        asteroidBeltRef.current.children.forEach((asteroid) => {
          const mesh = asteroid as THREE.Mesh;
          const userData = mesh.userData;
          
          // Update orbital position
          userData.angle += userData.orbitalSpeed;
          mesh.position.x = Math.cos(userData.angle) * userData.distance;
          mesh.position.z = Math.sin(userData.angle) * userData.distance;
          
          // Update rotation
          mesh.rotation.x += userData.rotationSpeed.x;
          mesh.rotation.y += userData.rotationSpeed.y;
          mesh.rotation.z += userData.rotationSpeed.z;
        });
      }

      // Animate Oort Cloud
      if (oortCloudRef.current) {
        oortCloudRef.current.children.forEach((oortObject) => {
          const mesh = oortObject as THREE.Mesh;
          const userData = mesh.userData;
          
          // Very slow orbital motion (barely perceptible)
          if (orbitsActiveRef.current && !focusedPlanetRef.current) {
            userData.phi += userData.orbitalSpeed;
            mesh.position.x = userData.distance * Math.sin(userData.theta) * Math.cos(userData.phi);
            mesh.position.z = userData.distance * Math.sin(userData.theta) * Math.sin(userData.phi);
          }
          
          // Slow rotation
          mesh.rotation.x += userData.rotationSpeed.x;
          mesh.rotation.y += userData.rotationSpeed.y;
          mesh.rotation.z += userData.rotationSpeed.z;
          
          // Subtle twinkling effect
          userData.twinklePhase += userData.twinkleSpeed;
          const material = mesh.material as THREE.MeshPhongMaterial;
          const baseOpacity = 0.7 + Math.random() * 0.3;
          material.opacity = baseOpacity + Math.sin(userData.twinklePhase) * 0.2;
        });
      }

      // Camera movement (only if auto-rotate is enabled)
      if (autoRotateRef.current && !focusedPlanetRef.current) {
        cameraAngleRef.current += 0.001;
      }
      
      // Handle camera positioning based on focus
      if (focusedMoonRef.current) {
        // Find the focused planet and moon
        const planetObj = planetsRef.current.find(p => p.planet.name === focusedMoonRef.current!.planet);
        if (planetObj && planetObj.planet.moons && planetObj.moons?.length) {
          const moonData = planetObj.planet.moons[focusedMoonRef.current.moonIndex];
          const moonMesh = planetObj.moons[focusedMoonRef.current.moonIndex];
          // Camera orbits the moon
          const moonPosition = new THREE.Vector3();
          moonMesh.getWorldPosition(moonPosition);
          const distance = Math.max(moonData.radius * 2, 1.5); // Stay just outside moon
          const horizontalAngle = focusedCameraAngleRef.current;
          const verticalAngle = focusedCameraVerticalAngleRef.current;
          const horizontalDistance = Math.cos(verticalAngle) * distance;
          camera.position.x = moonPosition.x + Math.cos(horizontalAngle) * horizontalDistance;
          camera.position.y = moonPosition.y + Math.sin(verticalAngle) * distance;
          camera.position.z = moonPosition.z + Math.sin(horizontalAngle) * horizontalDistance;
          camera.lookAt(moonPosition);
          // Stop this moon's orbit by not updating its position
        }
      } else if (focusedPlanetRef.current === 'Sun') {
        // Special case: focus on the sun at the origin
        const distance = focusedCameraDistanceRef.current;
        const horizontalAngle = focusedCameraAngleRef.current;
        const verticalAngle = focusedCameraVerticalAngleRef.current;
        const horizontalDistance = Math.cos(verticalAngle) * distance;
        camera.position.x = Math.cos(horizontalAngle) * horizontalDistance;
        camera.position.y = Math.sin(verticalAngle) * distance;
        camera.position.z = Math.sin(horizontalAngle) * horizontalDistance;
        camera.lookAt(0, 0, 0);
      } else if (focusedPlanetRef.current) {
        // Find the focused planet
        const focusedPlanetObj = planetsRef.current.find(p => p.planet.name === focusedPlanetRef.current);
        if (focusedPlanetObj) {
          const planetPosition = new THREE.Vector3();
          focusedPlanetObj.mesh.getWorldPosition(planetPosition);
          
          // Position camera relative to the focused planet
          const distance = focusedCameraDistanceRef.current;
          const horizontalAngle = focusedCameraAngleRef.current;
          const verticalAngle = focusedCameraVerticalAngleRef.current;
          
          // Calculate camera position around the planet
          const horizontalDistance = Math.cos(verticalAngle) * distance;
          camera.position.x = planetPosition.x + Math.cos(horizontalAngle) * horizontalDistance;
          camera.position.y = planetPosition.y + Math.sin(verticalAngle) * distance;
          camera.position.z = planetPosition.z + Math.sin(horizontalAngle) * horizontalDistance;
          camera.lookAt(planetPosition);
        }
      } else {
        // Normal camera behavior
        const radius = cameraDistanceRef.current;
        camera.position.x = Math.cos(cameraAngleRef.current) * radius;
        camera.position.y = Math.sin(cameraVerticalAngleRef.current) * radius;
        camera.position.z = Math.sin(cameraAngleRef.current) * radius;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    const currentMountRef = mountRef.current;
    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseleave', handleMouseLeave);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      if (currentMountRef && renderer.domElement) {
        currentMountRef.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [planets, config, viewMode]); // Rebuild when config or viewMode changes

  // Effect to handle orbit line visibility
  useEffect(() => {
    // Apply orbit line visibility directly to the current orbit rings
    if (orbitRingsRef.current.length > 0) {
      orbitRingsRef.current.forEach(({ ring }) => {
        ring.visible = showOrbitLines;
      });
    }
  }, [showOrbitLines]);

  // Effect to sync orbit lines visibility after scene rebuilds
  useEffect(() => {
    // Small delay to ensure scene is fully rebuilt
    const timer = setTimeout(() => {
      if (orbitRingsRef.current.length > 0) {
        orbitRingsRef.current.forEach(({ ring }) => {
          ring.visible = showOrbitLines;
        });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [viewMode, config, showOrbitLines]);

  // Handle manual camera reset
  const resetCamera = () => {
    returnToSolarSystemView();
  };

  // Handle zoom controls
  const zoomIn = () => {
    if (focusedPlanetRef.current) {
      const minDist = focusedPlanetMinDistanceRef.current;
      focusedCameraDistanceRef.current = Math.max(minDist, focusedCameraDistanceRef.current - 2);
    } else {
      // Use adaptive zoom for button controls too
      const currentDistance = cameraDistanceRef.current;
      const adaptiveZoomStep = Math.max(10, currentDistance * 0.1);
      cameraDistanceRef.current = Math.max(config.zoomLimits.globalMinDistance, cameraDistanceRef.current - adaptiveZoomStep);
    }
  };

  const zoomOut = () => {
    if (focusedPlanetRef.current) {
      focusedCameraDistanceRef.current = Math.min(config.zoomLimits.focusedMaxDistance, focusedCameraDistanceRef.current + 2);
    } else {
      // Use adaptive zoom for button controls too
      const currentDistance = cameraDistanceRef.current;
      const adaptiveZoomStep = Math.max(10, currentDistance * 0.1);
      cameraDistanceRef.current = Math.min(config.zoomLimits.globalMaxDistance, cameraDistanceRef.current + adaptiveZoomStep);
    }
  };

  // Handle planet focus
  const focusOnPlanet = (planetName: string) => {
    setFocusedPlanet(planetName);
    setFocusedMoon(null); // Clear any moon focus
    setOrbitsActive(false); // Stop solar system orbits
    setAutoRotate(false); // Stop auto rotation
    
    // Special handling for the sun
    if (planetName === 'Sun') {
      focusedPlanetMinDistanceRef.current = 10; // Minimum distance for sun view
      focusedCameraDistanceRef.current = 60; // Good distance for sun
      focusedCameraAngleRef.current = 0;
      focusedCameraVerticalAngleRef.current = 0.3;
      return;
    }
    // Reset focused camera position for smooth transition
    const focusedPlanetObj = planetsRef.current.find(p => p.planet.name === planetName);
    if (focusedPlanetObj) {
      // Set initial distance based on planet size - close enough for moon clicking
      const minDist = focusedPlanetObj.planet.radius * 1.2;
      focusedPlanetMinDistanceRef.current = minDist;
      focusedCameraDistanceRef.current = Math.max(minDist, focusedPlanetObj.planet.radius * 2.5);
      focusedCameraAngleRef.current = 0;
      focusedCameraVerticalAngleRef.current = 0.3; // Slightly above the planet
    }
  };

  // Handle moon focus
  const focusOnMoon = (planetName: string, moonIndex: number) => {
    setFocusedMoon({ planet: planetName, moonIndex });
    // Keep planet focused but stop moon orbits
    setAutoRotate(false); // Stop auto rotation

    // Reset focused camera position for smooth transition
    const focusedPlanetObj = planetsRef.current.find(p => p.planet.name === planetName);
    if (focusedPlanetObj && focusedPlanetObj.planet.moons) {
      const moonData = focusedPlanetObj.planet.moons[moonIndex];
      const minDist = moonData.radius * 1.2;
      focusedCameraDistanceRef.current = Math.max(minDist, moonData.radius * 6);
      focusedCameraAngleRef.current = 0;
      focusedCameraVerticalAngleRef.current = 0.3; // Slightly above the moon
    }
  };

  // Handle return to planet view from moon
  const returnToPlanetView = () => {
    setFocusedMoon(null);
    // Planet focus is already set, so we just need to reset camera to planet view
    const focusedPlanetObj = planetsRef.current.find(p => p.planet.name === focusedPlanetRef.current);
    if (focusedPlanetObj) {
      const minDist = focusedPlanetObj.planet.radius * 1.2;
      focusedPlanetMinDistanceRef.current = minDist;
      focusedCameraDistanceRef.current = Math.max(minDist, focusedPlanetObj.planet.radius * 2.5);
      focusedCameraAngleRef.current = 0;
      focusedCameraVerticalAngleRef.current = 0.3;
    }
  };

  // Handle return to solar system view
  const returnToSolarSystemView = () => {
    setFocusedPlanet(null);
    setFocusedMoon(null);
    setOrbitsActive(true); // Restart solar system orbits
    setAutoRotate(false); // Keep auto-rotate off by default
    if (cameraRef.current) {
      cameraAngleRef.current = 0;
      cameraVerticalAngleRef.current = 0.5;
      cameraDistanceRef.current = viewMode === 'scientific' ? 400 : 160;
      focusedCameraAngleRef.current = 0;
      focusedCameraDistanceRef.current = 20;
      focusedCameraVerticalAngleRef.current = 0;
    }
  };

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    
    if (newFullscreenState) {
      // Save current orbit lines state and hide them
      setOrbitLinesBeforeFullscreen(showOrbitLines);
      setShowOrbitLines(false);
      
      // Show message briefly when entering fullscreen
      setShowFullscreenMessage(true);
      setTimeout(() => {
        setShowFullscreenMessage(false);
      }, 3000); // Hide after 3 seconds
    } else {
      // Restore previous orbit lines state when exiting fullscreen
      setShowOrbitLines(orbitLinesBeforeFullscreen);
    }
  }, [isFullscreen, showOrbitLines, orbitLinesBeforeFullscreen]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if (event.key === 'f' || event.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, toggleFullscreen]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />

      {/* Sidebar */}
      {sidebarOpen && !isFullscreen && (
        <div className="fixed top-0 left-0 h-full w-80 bg-black bg-opacity-40 text-white z-40 flex flex-col shadow-lg">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h1 className="text-2xl font-bold">Interactive Solar System</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-2 text-white hover:text-blue-300"
              title="Hide Sidebar"
            >
              <ChevronLeft size={24} />
            </button>
          </div>

          {/* Return to view buttons */}
          {(focusedMoon || focusedPlanet) && (
            <div className="p-4 border-b border-gray-700 bg-blue-900 bg-opacity-40">
              {focusedMoon ? (
                <>
                  <p className="text-sm font-medium mb-1">
                    Focused on: {(() => {
                      const planet = planets.find(p => p.name === focusedMoon.planet);
                      if (planet && planet.moons && planet.moons[focusedMoon.moonIndex] && planet.moons[focusedMoon.moonIndex].name) {
                        return planet.moons[focusedMoon.moonIndex].name;
                      }
                      return `${focusedMoon.planet}'s Moon`;
                    })()}
                  </p>
                  <button
                    onClick={returnToPlanetView}
                    className="text-xs text-blue-200 hover:text-white underline"
                  >
                    Return to planet view
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium mb-1">Focused on: {focusedPlanet}</p>
                  <button
                    onClick={returnToSolarSystemView}
                    className="text-xs text-blue-200 hover:text-white underline"
                  >
                    Return to solar system view
                  </button>
                </>
              )}
            </div>
          )}

          {/* Info Panel: Show when focused on a planet, moon, or sun */}
          {(focusedPlanet || focusedMoon) && (
            <div className="p-4 border-b border-gray-700 bg-black bg-opacity-60 rounded-b-lg mb-2 mt-0">
              {focusedMoon ? (() => {
                // Find moon data
                const planet = planets.find(p => p.name === focusedMoon.planet);
                const moon = planet && planet.moons ? planet.moons[focusedMoon.moonIndex] : null;
                if (!planet || !moon) return null;
                // Example moon data (add more as needed)
                const moonData: Record<string, { diameter: string; orbitalPeriod: string; distance: string }> = {
                  'Moon': { diameter: '3,474 km', orbitalPeriod: '27.3 days', distance: '384,400 km' },
                  'Phobos': { diameter: '22.4 km', orbitalPeriod: '0.3 days', distance: '9,378 km' },
                  'Deimos': { diameter: '12.4 km', orbitalPeriod: '1.3 days', distance: '23,460 km' },
                  'Io': { diameter: '3,643 km', orbitalPeriod: '1.8 days', distance: '421,700 km' },
                  'Europa': { diameter: '3,122 km', orbitalPeriod: '3.5 days', distance: '671,100 km' },
                  'Titan': { diameter: '5,151 km', orbitalPeriod: '15.9 days', distance: '1,221,870 km' },
                  'Charon': { diameter: '1,212 km', orbitalPeriod: '6.4 days', distance: '19,600 km' },
                };
                const data = moonData[moon.name] || {};
                return (
                  <div>
                    <div className="text-lg font-bold mb-1">{moon.name}</div>
                    <div className="text-sm text-gray-300 mb-1">Moon of {planet.name}</div>
                    <div className="text-xs text-gray-400">Diameter: {data.diameter || '—'}</div>
                    <div className="text-xs text-gray-400">Orbital Period: {data.orbitalPeriod || '—'}</div>
                    <div className="text-xs text-gray-400">Distance from {planet.name}: {data.distance || '—'}</div>
                  </div>
                );
              })() : focusedPlanet === 'Sun' ? (() => {
                // Sun data
                const sunData = {
                  name: 'Sun',
                  type: 'G-type Main-Sequence Star',
                  diameter: '1,391,016 km',
                  mass: '1.989 × 10^30 kg',
                  temperature: '5,778 K',
                };
                return (
                  <div>
                    <div className="text-lg font-bold mb-1">{sunData.name}</div>
                    <div className="text-sm text-gray-300 mb-1">{sunData.type}</div>
                    <div className="text-xs text-gray-400">Diameter: {sunData.diameter}</div>
                    <div className="text-xs text-gray-400">Mass: {sunData.mass}</div>
                    <div className="text-xs text-gray-400">Surface Temp: {sunData.temperature}</div>
                  </div>
                );
              })() : (() => {
                // Planet data
                const planet = planets.find(p => p.name === focusedPlanet);
                if (!planet) return null;
                // Example planet data (add more as needed)
                const planetData: Record<string, { type: string; diameter: string; mass: string; orbitalPeriod: string; distance: string; moons: number }> = {
                  'Mercury': { type: 'Terrestrial', diameter: '4,880 km', mass: '3.30 × 10^23 kg', orbitalPeriod: '88 days', distance: '57.9 million km', moons: 0 },
                  'Venus': { type: 'Terrestrial', diameter: '12,104 km', mass: '4.87 × 10^24 kg', orbitalPeriod: '225 days', distance: '108.2 million km', moons: 0 },
                  'Earth': { type: 'Terrestrial', diameter: '12,742 km', mass: '5.97 × 10^24 kg', orbitalPeriod: '365.25 days', distance: '149.6 million km', moons: 1 },
                  'Mars': { type: 'Terrestrial', diameter: '6,779 km', mass: '6.42 × 10^23 kg', orbitalPeriod: '687 days', distance: '227.9 million km', moons: 2 },
                  'Jupiter': { type: 'Gas Giant', diameter: '139,820 km', mass: '1.90 × 10^27 kg', orbitalPeriod: '11.9 years', distance: '778.5 million km', moons: 79 },
                  'Saturn': { type: 'Gas Giant', diameter: '116,460 km', mass: '5.68 × 10^26 kg', orbitalPeriod: '29.5 years', distance: '1.43 billion km', moons: 83 },
                  'Uranus': { type: 'Ice Giant', diameter: '50,724 km', mass: '8.68 × 10^25 kg', orbitalPeriod: '84 years', distance: '2.87 billion km', moons: 27 },
                  'Neptune': { type: 'Ice Giant', diameter: '49,244 km', mass: '1.02 × 10^26 kg', orbitalPeriod: '165 years', distance: '4.50 billion km', moons: 14 },
                  'Pluto': { type: 'Dwarf Planet', diameter: '2,377 km', mass: '1.31 × 10^22 kg', orbitalPeriod: '248 years', distance: '5.91 billion km', moons: 5 },
                };
                const data = planetData[planet.name] || {};
                return (
                  <div>
                    <div className="text-lg font-bold mb-1">{planet.name}</div>
                    <div className="text-sm text-gray-300 mb-1">{data.type || '—'}</div>
                    <div className="text-xs text-gray-400">Diameter: {data.diameter || '—'}</div>
                    <div className="text-xs text-gray-400">Mass: {data.mass || '—'}</div>
                    <div className="text-xs text-gray-400">Orbital Period: {data.orbitalPeriod || '—'}</div>
                    <div className="text-xs text-gray-400">Distance from Sun: {data.distance || '—'}</div>
                    <div className="text-xs text-gray-400">Number of Moons: {data.moons !== undefined ? data.moons : (planet.moons ? planet.moons.length : 0)}</div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Accordion: Control Panel */}
          <div>
            <button
              className="w-full flex justify-between items-center px-4 py-3 text-lg font-semibold border-b border-gray-700 hover:bg-gray-800"
              onClick={() => setAccordionOpen(accordionOpen === 'control' ? null : 'control')}
            >
              <span>Control Panel</span>
              {accordionOpen === 'control' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {accordionOpen === 'control' && (
              <div className="px-4 py-2 space-y-2">
                {/* View Mode Toggle */}
                <ViewModeToggle 
                  viewMode={viewMode} 
                  onViewModeChange={handleViewModeChange}
                />
                
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  disabled={!!focusedPlanet || !!focusedMoon}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50 w-full"
                >
                  {autoRotate ? <Pause size={16} /> : <Play size={16} />}
                  <span className="text-sm">
                    {autoRotate ? 'Pause Rotation' : 'Start Rotation'}
                  </span>
                </button>
                <button
                  onClick={() => setOrbitsActive(!orbitsActive)}
                  disabled={!!focusedPlanet || !!focusedMoon}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200 disabled:opacity-50 w-full"
                >
                  {orbitsActive ? <Pause size={16} /> : <Play size={16} />}
                  <span className="text-sm">
                    {orbitsActive ? 'Stop Orbits' : 'Start Orbits'}
                  </span>
                </button>
                <button
                  onClick={() => setShowOrbitLines(!showOrbitLines)}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors duration-200 w-full"
                >
                  {showOrbitLines ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span className="text-sm">
                    {showOrbitLines ? 'Hide Orbit Lines' : 'Show Orbit Lines'}
                  </span>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={zoomIn}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200 flex-1"
                  >
                    <ZoomIn size={16} />
                    <span className="text-sm">Zoom In</span>
                  </button>
                  <button
                    onClick={zoomOut}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200 flex-1"
                  >
                    <ZoomOut size={16} />
                    <span className="text-sm">Zoom Out</span>
                  </button>
                </div>
                <button
                  onClick={resetCamera}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors duration-200 w-full"
                >
                  <RotateCcw size={16} />
                  <span className="text-sm">Reset View</span>
                </button>
              </div>
            )}
          </div>

          {/* Accordion: Planet Information */}
          <div>
            <button
              className="w-full flex justify-between items-center px-4 py-3 text-lg font-semibold border-b border-gray-700 hover:bg-gray-800"
              onClick={() => setAccordionOpen(accordionOpen === 'info' ? null : 'info')}
            >
              <span>Planet Information</span>
              {accordionOpen === 'info' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {accordionOpen === 'info' && (
              <div className="px-4 py-2">
                <div className="flex items-center w-full text-left py-1">
                  <button
                    className="flex items-center flex-1"
                    onClick={() => focusOnPlanet('Sun')}
                  >
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#fff700' }} />
                    <span className="font-medium">Sun</span>
                  </button>
                </div>
                {planets.map((planet) => (
                  <div key={planet.name}>
                    <div className="flex items-center w-full text-left py-1">
                      <button
                        className="flex items-center flex-1"
                        onClick={() => focusOnPlanet(planet.name)}
                      >
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: planet.color }} />
                        <span className="font-medium">{planet.name}</span>
                      </button>
                      {planet.moons && planet.moons.length > 0 && (
                        <button
                          className="ml-2"
                          onClick={() => setPlanetAccordion(planetAccordion === planet.name ? null : planet.name)}
                          aria-label={planetAccordion === planet.name ? "Collapse moons" : "Expand moons"}
                        >
                          {planetAccordion === planet.name ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                    {planetAccordion === planet.name && planet.moons && (
                      <div className="ml-6">
                        {planet.moons.map((moon, idx) => (
                          <button
                            key={moon.name}
                            className="block text-left py-1 text-sm hover:text-blue-300"
                            onClick={() => focusOnMoon(planet.name, idx)}
                          >
                            {moon.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar collapsed button */}
      {!sidebarOpen && !isFullscreen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 text-white bg-black bg-opacity-70 hover:bg-opacity-90 rounded-lg p-3 border border-gray-600"
          title="Show Sidebar"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Fullscreen Toggle Button - Always visible */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-50 text-white bg-black bg-opacity-70 hover:bg-opacity-90 rounded-lg p-3 backdrop-blur-sm transition-all duration-200 border border-gray-600"
        title={isFullscreen ? "Exit Fullscreen (ESC or F)" : "Enter Fullscreen (F)"}
      >
        {isFullscreen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7V3h4M21 7V3h-4M21 17v4h-4M3 17v4h4"/>
          </svg>
        )}
      </button>



      {/* Fullscreen Mode Instructions - Only shown briefly when entering fullscreen */}
      {isFullscreen && showFullscreenMessage && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white bg-black bg-opacity-80 rounded-lg p-6 backdrop-blur-sm animate-pulse pointer-events-none">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Fullscreen Mode</h2>
            <p className="text-sm opacity-75 mb-2">Pure solar system experience</p>
            <p className="text-xs opacity-50">Press ESC or F to exit • All interactions still work</p>
          </div>
        </div>
      )}
      
      {/* Hover Tooltip */}
      {hoveredPlanet && !isFullscreen && (
        <div 
          className="absolute pointer-events-none z-50 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm border border-gray-600"
          style={{
            left: mousePosition.x + 15,
            top: mousePosition.y - 10,
            transform: 'translate(0, -100%)'
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: hoveredObjectType === 'orbit' 
                  ? planets.find(p => p.name === hoveredPlanet)?.color || '#ffffff'
                  : hoveredObjectType === 'sun' 
                    ? '#fff700' 
                    : '#ffffff'
              }}
            />
            <span>
              {hoveredObjectType === 'orbit' 
                ? `${hoveredPlanet}'s Orbit`
                : hoveredPlanet
              }
            </span>
          </div>
        </div>
      )}
      {focusedMoon && (
        <div className="absolute bottom-24 left-4 text-white bg-blue-700 bg-opacity-70 rounded-lg p-2 backdrop-blur-sm border border-blue-400">
          <button
            onClick={returnToPlanetView}
            className="text-xs text-blue-200 hover:text-white underline"
          >
            Return to planet view
          </button>
        </div>
      )}
    </div>
  );
};

export default SolarSystem;