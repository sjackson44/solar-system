import * as THREE from 'three';
import gsap from 'gsap';

export class AutoCruiseManager {
  camera: THREE.PerspectiveCamera;
  controls: any;
  tour: any[];
  config: any;
  onPOIChange: (poi: any) => void;
  onEnd: () => void;
  running = false;
  idx = 0;
  orbiting = false;
  stopFlag = false;
  isPaused = false;
  eta = 0;
  scale = '';
  _curve: THREE.CatmullRomCurve3 | null = null;
  _travelTime = 0;
  _t = 0;
  _onArrive: (() => void) | null = null;
  _orbitStart: number = 0;

  constructor(camera: THREE.PerspectiveCamera, controls: any, tour: any[], config: any, onPOIChange: (poi: any) => void, onEnd: () => void) {
    this.camera = camera;
    this.controls = controls;
    this.tour = tour;
    this.config = config;
    this.onPOIChange = onPOIChange;
    this.onEnd = onEnd;
  }

  // Start the auto-cruise tour
  start() {
    this.running = true;
    this.idx = 0;
    this.stopFlag = false;
    this.isPaused = false;
    this.nextPOI();
  }

  // Stop the tour
  stop() {
    this.running = false;
    this.stopFlag = true;
    this.isPaused = false;
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.camera);
  }

  // Move to the next POI in the tour
  nextPOI() {
    if (this.stopFlag || this.idx >= this.tour.length) {
      this.onEnd();
      return;
    }
    const poi = this.tour[this.idx];
    this.onPOIChange(poi);
    this.flyToPOI(poi, () => this.orbitPOI(poi, () => {
      this.idx++;
      this.nextPOI();
    }));
  }

  setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  getETA() {
    // If flying, return remaining travel time; if orbiting, return remaining orbit time
    if (this._curve && !this.orbiting) {
      return Math.ceil((1 - this._t) * this._travelTime);
    }
    if (this.orbiting) {
      // Orbit duration minus elapsed
      return Math.ceil(this.config.orbitDuration - ((Date.now() - this._orbitStart) / 1000));
    }
    return 0;
  }

  getScaleString() {
    // Enhanced spaceship cockpit view strings
    if (this.camera.fov < 50) return 'COCKPIT VIEW: CLOSE APPROACH';
    if (this.camera.fov < 65) return 'COCKPIT VIEW: STANDARD RANGE';
    if (this.camera.fov < 80) return 'COCKPIT VIEW: WIDE ANGLE';
    return 'COCKPIT VIEW: NAVIGATION MODE';
  }

  // Generate a smooth CatmullRomCurve3 path to the POI
  flyToPOI(poi: any, onArrive: () => void) {
    // Closer flyby: approach at 1.03 × radius (minimum 2 units)
    const fov = (this.camera.fov || 75) * Math.PI / 180;
    const closeApproach = Math.max(poi.radius * 1.03, 2);
    // Approach from -Z axis in world space
    const approachDir = new THREE.Vector3(0, 0, -1);
    const end = poi.position.clone().add(approachDir.multiplyScalar(closeApproach));
    end.y += poi.radius * 0.15; // Cockpit feel
    const start = this.camera.position.clone();
    // Add 1-3 random intermediate points for a natural curve
    const points = [start];
    for (let i = 0; i < 2; i++) {
      const lerp = start.clone().lerp(end, (i + 1) / 3);
      lerp.x += (Math.random() - 0.5) * poi.radius * 2;
      lerp.y += (Math.random() - 0.5) * poi.radius * 2;
      lerp.z += (Math.random() - 0.5) * poi.radius * 2;
      points.push(lerp);
    }
    points.push(end);
    const curve = new THREE.CatmullRomCurve3(points);
    const dist = start.distanceTo(end);
    const travelTime = Math.max(2, dist / this.config.travelSpeed);
    this._curve = curve;
    this._travelTime = travelTime;
    this._t = 0;
    this._onArrive = onArrive;
    let fovSet = false;
    // Animate along the curve
    const animate = () => {
      if (this.stopFlag) return;
      if (this.isPaused) {
        requestAnimationFrame(animate);
        return;
      }
      this._t += 1 / 60 / this._travelTime;
      if (this._t > 1) this._t = 1;
      const pos = this._curve!.getPointAt(this._t);
      this.camera.position.copy(pos);
      this.camera.lookAt(poi.position);
      // Set FOV wide only once at start of approach
      if (!fovSet) {
        gsap.to(this.camera, { fov: 110, duration: 0.7, onUpdate: () => this.camera.updateProjectionMatrix() });
        fovSet = true;
      }
      if (this._t < 1) {
        requestAnimationFrame(animate);
      } else {
        this._curve = null;
        this._t = 0;
        if (this._onArrive) this._onArrive();
      }
    };
    animate();
  }

  // Orbit the POI for 2 full revolutions, keep FOV wide
  orbitPOI(poi: any, onDone: () => void) {
    this.orbiting = true;
    const cam = this.camera;
    const r = Math.max(poi.radius * 1.03, 2) * 1.1;
    const startAngle = Math.random() * Math.PI * 2;
    const startY = cam.position.y;
    this._orbitStart = Date.now();
    const totalDuration = this.config.orbitDuration * 2; // 2 full orbits
    let fovSet = false;
    const animate = () => {
      if (this.stopFlag) return;
      if (this.isPaused) {
        requestAnimationFrame(animate);
        return;
      }
      const elapsed = (Date.now() - this._orbitStart) / 1000;
      const angle = startAngle + (elapsed / totalDuration) * Math.PI * 4; // 2 full orbits
      cam.position.x = poi.position.x + Math.cos(angle) * r;
      cam.position.z = poi.position.z + Math.sin(angle) * r;
      cam.position.y = poi.position.y + Math.sin(angle * 0.5) * r * 0.2 + poi.radius * 0.15;
      cam.lookAt(poi.position);
      // Set FOV wide only once at start of orbit
      if (!fovSet) {
        gsap.to(cam, { fov: 110, duration: 0.7, onUpdate: () => cam.updateProjectionMatrix() });
        fovSet = true;
      }
      if (elapsed < totalDuration) {
        requestAnimationFrame(animate);
      } else {
        // Restore FOV to normal after orbit
        gsap.to(cam, { fov: 75, duration: 0.7, onUpdate: () => cam.updateProjectionMatrix() });
        this.orbiting = false;
        onDone();
      }
    };
    animate();
  }
} 