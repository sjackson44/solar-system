import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls';

// CameraControlsManager manages switching between OrbitControls and FlyControls
export class CameraControlsManager {
  controls: OrbitControls | FlyControls | null = null;
  mode: 'orbit' | 'fly' = 'orbit';
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  config: any;
  viewMode: string;
  planets: Array<{ mesh: THREE.Mesh; planet: any }> = [];

  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, config: any, viewMode: string, planets: Array<{ mesh: THREE.Mesh; planet: any }>) {
    this.camera = camera;
    this.renderer = renderer;
    this.config = config;
    this.viewMode = viewMode;
    this.planets = planets;
    this.initOrbitControls();
  }

  // Initialize OrbitControls
  initOrbitControls() {
    if (this.controls) this.dispose();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.minDistance = this.config.zoomLimits.globalMinDistance;
    this.controls.maxDistance = this.config.zoomLimits.globalMaxDistance;
    this.mode = 'orbit';
  }

  // Initialize FlyControls
  initFlyControls(cruiseConfig: any) {
    if (this.controls) this.dispose();
    this.controls = new FlyControls(this.camera, this.renderer.domElement);
    this.controls.movementSpeed = cruiseConfig.movementSpeed;
    this.controls.rollSpeed = cruiseConfig.rollSpeed;
    this.controls.dragToLook = cruiseConfig.dragToLook;
    this.controls.autoForward = cruiseConfig.autoForward;
    this.mode = 'fly';
  }

  // Switch controls based on cruiseMode
  switchControls(cruiseMode: boolean, cruiseConfig: any) {
    // Preserve camera state
    const pos = this.camera.position.clone();
    const quat = this.camera.quaternion.clone();
    if (cruiseMode) {
      this.initFlyControls(cruiseConfig);
    } else {
      this.initOrbitControls();
    }
    // Restore camera state
    this.camera.position.copy(pos);
    this.camera.quaternion.copy(quat);
  }

  // Dispose current controls
  dispose() {
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
  }

  // Update controls in animation loop
  update(delta: number, cruiseConfig?: any) {
    if (!this.controls) return;
    if (this.mode === 'orbit') {
      (this.controls as OrbitControls).update();
    } else if (this.mode === 'fly') {
      // Dynamically adjust speed based on proximity to planets
      let minDist = Infinity;
      if (this.planets.length && cruiseConfig) {
        this.planets.forEach(({ mesh }) => {
          minDist = Math.min(minDist, mesh.position.distanceTo(this.camera.position));
        });
        // Slow down if close to a planet (within 30 units)
        const baseSpeed = cruiseConfig.movementSpeed * (cruiseConfig.warpSpeedMultiplier || 1);
        (this.controls as FlyControls).movementSpeed = minDist < 30 ? baseSpeed * 0.2 : baseSpeed;
      }
      (this.controls as FlyControls).update(delta);
    }
  }

  // For external access
  getActiveControls() {
    return this.controls;
  }
} 