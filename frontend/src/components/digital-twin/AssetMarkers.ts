import * as THREE from 'three';
import { Sensor, Camera, Equipment, Incident, AnomalyEvent } from '../../types';

export interface NearbyAssetLink {
  from: THREE.Vector3;
  to: THREE.Vector3;
  distance: number;
  label: string;
  type: 'camera' | 'equipment';
}

export class AssetMarkersBuilder {
  /**
   * Color lookup based on status and viewMode
   */
  static getSensorColor(sensor: Sensor, isHeatmap: boolean = false): number {
    const status = (sensor.status || 'ACTIVE').toUpperCase();
    if (status === 'CRITICAL') return 0xef4444; // Red
    if (status === 'WARNING') return 0xf59e0b;  // Amber
    if (status === 'OFFLINE') return 0x64748b;  // Grey
    if (status === 'RECOVERING') return 0x06b6d4; // Cyan
    return 0x10b981; // Normal/Active Emerald
  }

  /**
   * Builds 3D Sensor Marker with status color, dynamic pulsing ring, and label anchor.
   */
  static createSensorMesh(sensor: Sensor, isHeatmap: boolean = false): THREE.Group {
    const group = new THREE.Group();
    // Map spatial coordinates: x -> x, z -> y (depth/elevation), y -> z (northing)
    group.position.set(sensor.x, sensor.z, sensor.y);
    group.userData = { type: 'sensor', data: sensor, id: sensor.id };

    const color = this.getSensorColor(sensor, isHeatmap);

    // Core Sphere
    const sphereGeo = new THREE.SphereGeometry(3.2, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: sensor.status === 'CRITICAL' ? 0.8 : 0.35,
      roughness: 0.2,
      metalness: 0.8
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.name = 'core_sphere';
    group.add(sphereMesh);

    // Outer Glow / Pulse Ring
    const ringGeo = new THREE.RingGeometry(3.6, 5.2, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: sensor.status === 'CRITICAL' ? 0.85 : 0.4
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.name = 'pulse_ring';
    ringMesh.rotation.x = -Math.PI / 2;
    group.add(ringMesh);

    // Support Mast / Pin
    const pinGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.y = -3;
    group.add(pinMesh);

    return group;
  }

  /**
   * Builds 3D Camera Marker with directional lens, body, and translucent Field of View (FOV) cone.
   */
  static createCameraMesh(camera: Camera): THREE.Group {
    const group = new THREE.Group();
    group.position.set(camera.x, camera.z, camera.y);
    group.userData = { type: 'camera', data: camera, id: camera.id };

    // Camera Housing Body
    const bodyGeo = new THREE.BoxGeometry(3.5, 2.5, 5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(bodyMesh);

    // Lens Cylinder
    const lensGeo = new THREE.CylinderGeometry(1.2, 1.2, 2, 16);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.rotation.x = Math.PI / 2;
    lensMesh.position.z = 3;
    group.add(lensMesh);

    // Field of View (FOV) Cone
    const fovAngle = (camera.fov || 90) * (Math.PI / 180);
    const coneLength = 35;
    const coneRadius = Math.tan(fovAngle / 2) * coneLength;

    const coneGeo = new THREE.ConeGeometry(coneRadius, coneLength, 16, 1, true);
    coneGeo.translate(0, -coneLength / 2, 0); // Origin at apex
    coneGeo.rotateX(-Math.PI / 2); // Point forward along +Z

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.name = 'camera_fov_cone';
    group.add(coneMesh);

    // FOV Cone Wireframe Outline
    const wireGeo = new THREE.EdgesGeometry(coneGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    wireMesh.name = 'camera_fov_wire';
    group.add(wireMesh);

    // Apply Yaw (Y-rotation) and Pitch (X-rotation)
    const yawRad = ((camera.yaw || 0) * Math.PI) / 180;
    const pitchRad = ((camera.pitch || 0) * Math.PI) / 180;
    group.rotation.y = yawRad;
    group.rotation.x = pitchRad;

    return group;
  }

  /**
   * Builds Heavy Machinery / Ventilation 3D Equipment Glyphs
   */
  static createEquipmentMesh(eq: Equipment): THREE.Group {
    const group = new THREE.Group();
    group.position.set(eq.x, eq.z, eq.y);
    group.userData = { type: 'equipment', data: eq, id: eq.id };

    const cat = (eq.category || '').toUpperCase();

    if (cat === 'VENTILATION_FAN') {
      // Centrifugal Fan Housing
      const housingGeo = new THREE.CylinderGeometry(7, 7, 6, 24);
      const housingMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7, roughness: 0.3 });
      const housing = new THREE.Mesh(housingGeo, housingMat);
      housing.rotation.z = Math.PI / 2;
      group.add(housing);

      // Rotating Impeller Blades
      const impellerGroup = new THREE.Group();
      impellerGroup.name = 'fan_impeller';
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });
      for (let b = 0; b < 6; b++) {
        const bladeGeo = new THREE.BoxGeometry(0.4, 5.5, 1.5);
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.rotation.x = (b * Math.PI) / 3;
        impellerGroup.add(blade);
      }
      group.add(impellerGroup);
    } else if (cat === 'SHEARER') {
      // Longwall Double-Drum Shearer
      const bodyGeo = new THREE.BoxGeometry(16, 4.5, 6);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8, roughness: 0.2 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(body);

      // Left Cutting Drum
      const drumGeo = new THREE.CylinderGeometry(3.5, 3.5, 4, 16);
      const drumMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.1 });
      const drum1 = new THREE.Mesh(drumGeo, drumMat);
      drum1.position.set(-10, 0, 0);
      drum1.name = 'shearer_drum_left';
      group.add(drum1);

      // Right Cutting Drum
      const drum2 = new THREE.Mesh(drumGeo, drumMat);
      drum2.position.set(10, 0, 0);
      drum2.name = 'shearer_drum_right';
      group.add(drum2);
    } else if (cat === 'CONVEYOR') {
      // Armoured Conveyor Bed
      const convGeo = new THREE.BoxGeometry(30, 1.8, 4);
      const convMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });
      const conv = new THREE.Mesh(convGeo, convMat);
      group.add(conv);

      // Conveyor Rollers
      const rollerGeo = new THREE.CylinderGeometry(0.8, 0.8, 4.2, 12);
      const rollerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
      for (let r = -12; r <= 12; r += 6) {
        const roller = new THREE.Mesh(rollerGeo, rollerMat);
        roller.position.set(r, 1, 0);
        roller.rotation.x = Math.PI / 2;
        group.add(roller);
      }
    } else {
      // Generic Heavy Machinery / Excavator
      const baseGeo = new THREE.BoxGeometry(10, 5, 8);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.7 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      group.add(base);

      const boomGeo = new THREE.CylinderGeometry(0.8, 1.2, 15, 8);
      const boomMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
      const boom = new THREE.Mesh(boomGeo, boomMat);
      boom.position.set(4, 7, 0);
      boom.rotation.z = -Math.PI / 4;
      group.add(boom);
    }

    return group;
  }

  /**
   * Builds 3D Hazard Beacon Pyramid for Active Incidents
   */
  static createIncidentBeacon(incident: Incident): THREE.Group {
    const group = new THREE.Group();
    group.position.set(incident.x, incident.z + 8, incident.y);
    group.userData = { type: 'incident', data: incident, id: incident.id };

    // Floating Hazard Octahedron/Diamond
    const geo = new THREE.OctahedronGeometry(4, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.9,
      metalness: 0.8,
      roughness: 0.1
    });
    const diamond = new THREE.Mesh(geo, mat);
    diamond.name = 'incident_diamond';
    group.add(diamond);

    // Glowing Vertical Beacon Beam Pillar
    const beamGeo = new THREE.CylinderGeometry(0.2, 2.5, 30, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = -15;
    group.add(beam);

    return group;
  }

  /**
   * Builds Dashed 3D Proximity Link Lines connecting a selected sensor to nearby cameras/equipment.
   */
  static createProximityLine(link: NearbyAssetLink): THREE.Group {
    const group = new THREE.Group();
    group.name = 'proximity_link';

    const points = [link.from, link.to];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const color = link.type === 'camera' ? 0x38bdf8 : 0x10b981;
    const material = new THREE.LineDashedMaterial({
      color: color,
      dashSize: 2.5,
      gapSize: 1.5,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    group.add(line);

    // Midpoint distance marker beacon
    const mid = new THREE.Vector3().addVectors(link.from, link.to).multiplyScalar(0.5);
    const markerGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const markerMat = new THREE.MeshBasicMaterial({ color: color });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.copy(mid);
    group.add(marker);

    return group;
  }
}
