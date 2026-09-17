import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DigitalTwinState, Sensor, Camera, Equipment, Incident } from '../../types';
import { LayerVisibility, ViewMode, SelectedObject, CameraFocusTarget } from './types';
import { MineGeometryBuilder } from './MineGeometry';
import { AssetMarkersBuilder, NearbyAssetLink } from './AssetMarkers';

interface MineCanvas3DProps {
  twinData: DigitalTwinState | null;
  layers: LayerVisibility;
  viewMode: ViewMode;
  selectedObject: SelectedObject | null;
  onSelectObject: (obj: SelectedObject | null) => void;
  focusTarget: CameraFocusTarget | null;
  onFocusComplete?: () => void;
  className?: string;
}

export const MineCanvas3D: React.FC<MineCanvas3DProps> = ({
  twinData,
  layers,
  viewMode,
  selectedObject,
  onSelectObject,
  focusTarget,
  onFocusComplete,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Groups for toggleable layers
  const structureGroupRef = useRef<THREE.Group>(new THREE.Group());
  const sensorsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const camerasGroupRef = useRef<THREE.Group>(new THREE.Group());
  const equipmentGroupRef = useRef<THREE.Group>(new THREE.Group());
  const incidentsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const proximityGroupRef = useRef<THREE.Group>(new THREE.Group());

  // Camera Animation Transition state
  const cameraAnimRef = useRef<{
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    startTime: number;
    duration: number;
    active: boolean;
  } | null>(null);

  // Raycasting
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // 1. Scene Initialization
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16); // Dark industrial control room theme
    scene.fog = new THREE.FogExp2(0x090d16, 0.0008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    camera.position.set(220, 260, 380);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.15; // Allow slight look up underground
    controls.minDistance = 15;
    controls.maxDistance = 1500;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffedd5, 1.2);
    dirLight1.position.set(200, 400, 200);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-200, -300, -200);
    scene.add(dirLight2);

    // Add Layer Groups
    scene.add(structureGroupRef.current);
    scene.add(sensorsGroupRef.current);
    scene.add(camerasGroupRef.current);
    scene.add(equipmentGroupRef.current);
    scene.add(incidentsGroupRef.current);
    scene.add(proximityGroupRef.current);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation
      if (cameraAnimRef.current && cameraAnimRef.current.active) {
        const anim = cameraAnimRef.current;
        const now = performance.now();
        const progress = Math.min((now - anim.startTime) / anim.duration, 1.0);
        const ease = 0.5 - Math.cos(progress * Math.PI) / 2; // Smooth cosine ease

        camera.position.lerpVectors(anim.startPos, anim.endPos, ease);
        controls.target.lerpVectors(anim.startTarget, anim.endTarget, ease);

        if (progress >= 1.0) {
          anim.active = false;
          if (onFocusComplete) onFocusComplete();
        }
      }

      controls.update();

      // Animate pulsing rings on sensors
      sensorsGroupRef.current.children.forEach((child) => {
        const pulse = child.getObjectByName('pulse_ring');
        if (pulse) {
          const scale = 1.0 + Math.sin(elapsedTime * 4 + child.id) * 0.25;
          pulse.scale.set(scale, scale, scale);
        }
      });

      // Animate rotating fan impellers on ventilation equipment
      equipmentGroupRef.current.children.forEach((child) => {
        const impeller = child.getObjectByName('fan_impeller');
        if (impeller) {
          impeller.rotation.x += 0.08;
        }
      });

      // Animate hazard diamond beacons
      incidentsGroupRef.current.children.forEach((child) => {
        const diamond = child.getObjectByName('incident_diamond');
        if (diamond) {
          diamond.rotation.y += 0.04;
          diamond.position.y = Math.sin(elapsedTime * 3) * 1.5;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // 2. Build / Update 3D Geometry and Assets when Data Changes
  useEffect(() => {
    if (!twinData || !sceneRef.current) return;

    // A. Rebuild Mine Structure
    const structureGroup = structureGroupRef.current;
    structureGroup.clear();
    const mineStructure = MineGeometryBuilder.buildMineStructure(
      twinData.mine,
      twinData.levels,
      twinData.zones,
      viewMode
    );
    structureGroup.add(mineStructure);

    // B. Rebuild Sensors
    const sensorsGroup = sensorsGroupRef.current;
    sensorsGroup.clear();
    twinData.sensors.forEach((s) => {
      const mesh = AssetMarkersBuilder.createSensorMesh(s, viewMode === 'RISK_HEATMAP');
      sensorsGroup.add(mesh);
    });

    // C. Rebuild Cameras
    const camerasGroup = camerasGroupRef.current;
    camerasGroup.clear();
    twinData.cameras.forEach((c) => {
      const mesh = AssetMarkersBuilder.createCameraMesh(c);
      camerasGroup.add(mesh);
    });

    // D. Rebuild Heavy Machinery
    const equipmentGroup = equipmentGroupRef.current;
    equipmentGroup.clear();
    twinData.equipment.forEach((eq) => {
      const mesh = AssetMarkersBuilder.createEquipmentMesh(eq);
      equipmentGroup.add(mesh);
    });

    // E. Rebuild Active Incidents
    const incidentsGroup = incidentsGroupRef.current;
    incidentsGroup.clear();
    twinData.active_incidents.forEach((inc) => {
      const mesh = AssetMarkersBuilder.createIncidentBeacon(inc);
      incidentsGroup.add(mesh);
    });
  }, [twinData, viewMode]);

  // 3. Update Proximity Lines when Selected Object Changes
  useEffect(() => {
    const proximityGroup = proximityGroupRef.current;
    proximityGroup.clear();

    if (!selectedObject || !twinData) return;

    if (selectedObject.type === 'sensor' || selectedObject.type === 'anomaly') {
      const s = selectedObject.data;
      const sPos = new THREE.Vector3(s.x, s.z, s.y);

      // Find nearby cameras within 100m
      twinData.cameras.forEach((cam: Camera) => {
        const camPos = new THREE.Vector3(cam.x, cam.z, cam.y);
        const dist = sPos.distanceTo(camPos);
        if (dist <= 80) {
          const link: NearbyAssetLink = {
            from: sPos,
            to: camPos,
            distance: dist,
            label: `${cam.camera_code} (${dist.toFixed(1)}m)`,
            type: 'camera'
          };
          proximityGroup.add(AssetMarkersBuilder.createProximityLine(link));
        }
      });

      // Find nearby equipment within 80m
      twinData.equipment.forEach((eq: Equipment) => {
        const eqPos = new THREE.Vector3(eq.x, eq.z, eq.y);
        const dist = sPos.distanceTo(eqPos);
        if (dist <= 80) {
          const link: NearbyAssetLink = {
            from: sPos,
            to: eqPos,
            distance: dist,
            label: `${eq.equipment_code} (${dist.toFixed(1)}m)`,
            type: 'equipment'
          };
          proximityGroup.add(AssetMarkersBuilder.createProximityLine(link));
        }
      });
    }
  }, [selectedObject, twinData]);

  // 4. Update Layer Visibilities
  useEffect(() => {
    sensorsGroupRef.current.visible = layers.sensors;
    camerasGroupRef.current.visible = layers.cameras;
    equipmentGroupRef.current.visible = layers.equipment;
    incidentsGroupRef.current.visible = layers.ventilation; // Incidents/hazards
    structureGroupRef.current.visible = layers.mineStructure;
    proximityGroupRef.current.visible = layers.proximityLines;

    // Handle Camera FOV Cones visibility
    camerasGroupRef.current.children.forEach((camMesh) => {
      const cone = camMesh.getObjectByName('camera_fov_cone');
      const wire = camMesh.getObjectByName('camera_fov_wire');
      if (cone) cone.visible = layers.cameraFov;
      if (wire) wire.visible = layers.cameraFov;
    });
  }, [layers]);

  // 5. Handle Smooth Camera Focus Target
  useEffect(() => {
    if (!focusTarget || !cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    const targetPos = new THREE.Vector3(focusTarget.x, focusTarget.z, focusTarget.y);
    const dist = focusTarget.distance || 65;
    const endCameraPos = new THREE.Vector3(
      targetPos.x + dist * 0.7,
      targetPos.y + dist * 0.6,
      targetPos.z + dist * 0.7
    );

    cameraAnimRef.current = {
      startPos: camera.position.clone(),
      endPos: endCameraPos,
      startTarget: controls.target.clone(),
      endTarget: targetPos,
      startTime: performance.now(),
      duration: focusTarget.durationMs || 1000,
      active: true
    };
  }, [focusTarget]);

  // 6. Handle Mouse Click / Object Selection via Raycasting
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);

    // Interactive target meshes
    const targets: THREE.Object3D[] = [];
    sensorsGroupRef.current.children.forEach((c) => targets.push(c));
    camerasGroupRef.current.children.forEach((c) => targets.push(c));
    equipmentGroupRef.current.children.forEach((c) => targets.push(c));
    incidentsGroupRef.current.children.forEach((c) => targets.push(c));

    const intersects = raycaster.current.intersectObjects(targets, true);

    if (intersects.length > 0) {
      // Find top-level group with userData
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !obj.userData?.type && obj.parent) {
        obj = obj.parent;
      }

      if (obj && obj.userData?.type) {
        onSelectObject({
          type: obj.userData.type,
          id: obj.userData.id,
          data: obj.userData.data,
          coordinates: { x: obj.position.x, y: obj.position.z, z: obj.position.y }
        });
        return;
      }
    }
  };

  return (
    <div
      ref={mountRef}
      onPointerDown={handlePointerDown}
      className={`relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-slate-800 bg-slate-950 select-none ${className}`}
    />
  );
};
