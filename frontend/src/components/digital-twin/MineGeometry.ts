import * as THREE from 'three';
import { Mine, MineLevel, MineZone } from '../../types';

export class MineGeometryBuilder {
  /**
   * Builds the procedural 3D structural mesh of the mine based on mine type and spatial levels/zones.
   */
  static buildMineStructure(
    mine: Mine,
    levels: MineLevel[],
    zones: MineZone[],
    viewMode: 'OPERATIONAL' | 'RISK_HEATMAP' = 'OPERATIONAL'
  ): THREE.Group {
    const rootGroup = new THREE.Group();
    rootGroup.name = `MINE_STRUCTURE_${mine.code}`;

    const mineType = mine.mine_type?.toUpperCase() || 'UNDERGROUND';

    if (mineType === 'OPENCAST') {
      this.buildOpencastMine(rootGroup, mine, levels, zones);
    } else if (mine.code === 'MINE-RS-07') {
      this.buildInclineMine(rootGroup, mine, levels, zones);
    } else {
      this.buildUndergroundMine(rootGroup, mine, levels, zones);
    }

    // Add Zone Volume Bounds & Ribbons
    this.buildZoneVolumes(rootGroup, zones, viewMode);

    return rootGroup;
  }

  /**
   * Underground Mechanized Shaft Mine (e.g. Bharat Deep Shaft 4)
   */
  private static buildUndergroundMine(
    group: THREE.Group,
    mine: Mine,
    levels: MineLevel[],
    zones: MineZone[]
  ) {
    // 1. Surface Headframe & Yard
    const surfaceY = 210;
    const surfaceYardGeo = new THREE.PlaneGeometry(600, 600, 32, 32);
    const surfaceMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1,
      wireframe: false,
      side: THREE.DoubleSide
    });
    const surfaceMesh = new THREE.Mesh(surfaceYardGeo, surfaceMat);
    surfaceMesh.rotation.x = -Math.PI / 2;
    surfaceMesh.position.set(0, surfaceY, 0);
    surfaceMesh.receiveShadow = true;
    group.add(surfaceMesh);

    // Surface Grid
    const surfaceGrid = new THREE.GridHelper(600, 30, 0xf59e0b, 0x334155);
    surfaceGrid.position.set(0, surfaceY + 0.2, 0);
    group.add(surfaceGrid);

    // Surface Headframe / Winding Tower at (-50, -30)
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const towerGeo = new THREE.CylinderGeometry(8, 14, 45, 8);
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.set(-50, surfaceY + 22.5, -30);
    group.add(towerMesh);

    // Headframe Sheave Wheels
    const wheelGeo = new THREE.TorusGeometry(5, 0.6, 8, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });
    const wheel1 = new THREE.Mesh(wheelGeo, wheelMat);
    wheel1.position.set(-50, surfaceY + 42, -30);
    wheel1.rotation.y = Math.PI / 2;
    group.add(wheel1);

    // 2. Vertical Shafts connecting surface to underground seams
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });

    const shaftHeight = surfaceY - (-325);
    const shaftGeo = new THREE.CylinderGeometry(10, 10, shaftHeight, 16, 1, true);
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.position.set(-50, surfaceY - shaftHeight / 2, -30);
    group.add(shaftMesh);

    // Shaft Cage Guide Wireframe Rings
    const cageRingMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 });
    for (let h = -320; h <= surfaceY; h += 20) {
      const ringGeo = new THREE.BufferGeometry();
      const points = [];
      for (let a = 0; a <= Math.PI * 2; a += Math.PI / 12) {
        points.push(new THREE.Vector3(-50 + Math.cos(a) * 10, h, -30 + Math.sin(a) * 10));
      }
      ringGeo.setFromPoints(points);
      const ring = new THREE.Line(ringGeo, cageRingMat);
      group.add(ring);
    }

    // 3. Seam 1 Haulage Level (z = -220) Drifts & Galleries
    this.buildTunnelGallery(group, new THREE.Vector3(-50, -220, -30), new THREE.Vector3(0, -220, 100), 12, 6, 0x334155);
    this.buildTunnelGallery(group, new THREE.Vector3(0, -220, 100), new THREE.Vector3(30, -220, 800), 14, 6.5, 0x1e293b, true);

    // 4. Seam 2 Longwall Workings (z = -320)
    this.buildTunnelGallery(group, new THREE.Vector3(-50, -320, -30), new THREE.Vector3(120, -320, 450), 12, 6, 0x334155);
    // East Longwall Production Face Gallery
    this.buildTunnelGallery(group, new THREE.Vector3(120, -320, 450), new THREE.Vector3(260, -320, 520), 16, 5.5, 0x0f172a);
    // West Heading Development Drift
    this.buildTunnelGallery(group, new THREE.Vector3(-50, -320, -30), new THREE.Vector3(-150, -320, 350), 10, 5, 0x1e293b);
  }

  /**
   * Opencast Basin Mine (e.g. Singrauli OpenCast Basin)
   */
  private static buildOpencastMine(
    group: THREE.Group,
    mine: Mine,
    levels: MineLevel[],
    zones: MineZone[]
  ) {
    // Terraced Pit Bench Cuts
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.95,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Top Rim (Elevation 280)
    const rimGeo = new THREE.RingGeometry(150, 450, 24, 4);
    const rimMesh = new THREE.Mesh(rimGeo, benchMat);
    rimMesh.rotation.x = -Math.PI / 2;
    rimMesh.position.set(200, 280, 150);
    group.add(rimMesh);

    // Bench 1 (Elevation 250)
    const b1Geo = new THREE.RingGeometry(100, 320, 24, 4);
    const b1Mesh = new THREE.Mesh(b1Geo, benchMat);
    b1Mesh.rotation.x = -Math.PI / 2;
    b1Mesh.position.set(200, 250, 150);
    group.add(b1Mesh);

    // Bench 2 (Elevation 235)
    const b2Geo = new THREE.RingGeometry(60, 220, 24, 4);
    const b2Mesh = new THREE.Mesh(b2Geo, benchMat);
    b2Mesh.rotation.x = -Math.PI / 2;
    b2Mesh.position.set(200, 235, 150);
    group.add(b2Mesh);

    // Pit Floor Basin (Elevation 190)
    const floorGeo = new THREE.CircleGeometry(100, 24);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(200, 190, 150);
    group.add(floorMesh);

    // Haul Road Spiral Ribbon
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(420, 280, 100),
      new THREE.Vector3(350, 265, 280),
      new THREE.Vector3(180, 250, 320),
      new THREE.Vector3(80, 235, 180),
      new THREE.Vector3(150, 210, 80),
      new THREE.Vector3(260, 190, 150)
    ]);
    const roadGeo = new THREE.TubeGeometry(curve, 32, 10, 8, false);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    group.add(roadMesh);
  }

  /**
   * Underground Incline Seam Mine (e.g. Raniganj Seam 7 Incline)
   */
  private static buildInclineMine(
    group: THREE.Group,
    mine: Mine,
    levels: MineLevel[],
    zones: MineZone[]
  ) {
    // Surface Portal Entry
    const surfaceY = 120;
    const surfaceGrid = new THREE.GridHelper(400, 20, 0x06b6d4, 0x1e293b);
    surfaceGrid.position.set(0, surfaceY, 0);
    group.add(surfaceGrid);

    // Incline Slope Drift from (0, 120, 0) down to (90, -180, 310)
    const inclineStart = new THREE.Vector3(0, surfaceY, 0);
    const inclineEnd = new THREE.Vector3(90, -180, 310);
    this.buildTunnelGallery(group, inclineStart, inclineEnd, 14, 7, 0x1e293b, true);

    // North Development Heading at (-180m)
    this.buildTunnelGallery(group, inclineEnd, new THREE.Vector3(180, -180, 480), 12, 5.5, 0x0f172a);
  }

  /**
   * Helper to construct a realistic arched mining gallery tunnel with structural support steel ribs.
   */
  private static buildTunnelGallery(
    group: THREE.Group,
    start: THREE.Vector3,
    end: THREE.Vector3,
    width: number,
    height: number,
    colorHex: number,
    hasRailTrack: boolean = false
  ) {
    const dir = new THREE.Vector3().subVectors(end, start);
    const length = dir.length();
    if (length < 0.1) return;

    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    // Main Gallery Volume
    const tunnelGeo = new THREE.BoxGeometry(width, height, length);
    const tunnelMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.85,
      metalness: 0.15,
      side: THREE.BackSide, // Visible from inside the tunnel
      transparent: true,
      opacity: 0.55
    });
    const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnelMesh.position.copy(mid);
    tunnelMesh.lookAt(end);
    group.add(tunnelMesh);

    // Wireframe Structural Outer Envelope
    const wireGeo = new THREE.EdgesGeometry(tunnelGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.4 });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    wireMesh.position.copy(mid);
    wireMesh.lookAt(end);
    group.add(wireMesh);

    // Structural Arch Ribs every 25m
    const numRibs = Math.floor(length / 25);
    const ribMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.4 });
    for (let i = 1; i <= numRibs; i++) {
      const ribPos = new THREE.Vector3().lerpVectors(start, end, i / (numRibs + 1));
      const ribGeo = new THREE.TorusGeometry(width * 0.48, 0.4, 6, 12, Math.PI);
      const ribMesh = new THREE.Mesh(ribGeo, ribMat);
      ribMesh.position.copy(ribPos);
      ribMesh.lookAt(end);
      ribMesh.rotation.z = 0;
      group.add(ribMesh);
    }
  }

  /**
   * Zone Bounding Volumes with Risk/Operational Coloring
   */
  private static buildZoneVolumes(
    group: THREE.Group,
    zones: MineZone[],
    viewMode: 'OPERATIONAL' | 'RISK_HEATMAP'
  ) {
    zones.forEach((zone) => {
      const w = zone.width || 100;
      const l = zone.length || 150;
      const h = zone.height || 10;
      const ox = zone.origin_x || 0;
      const oy = zone.origin_y || 0;
      const oz = zone.origin_z || 0;

      let color = 0x06b6d4; // Default cyan
      let opacity = 0.15;

      if (viewMode === 'RISK_HEATMAP') {
        const risk = (zone.risk_category || 'LOW').toUpperCase();
        if (risk === 'CRITICAL') {
          color = 0xef4444; // Red
          opacity = 0.4;
        } else if (risk === 'HIGH') {
          color = 0xf97316; // Orange
          opacity = 0.3;
        } else if (risk === 'MEDIUM') {
          color = 0xf59e0b; // Amber
          opacity = 0.22;
        } else {
          color = 0x10b981; // Green
          opacity = 0.12;
        }
      } else {
        if (zone.zone_type === 'PRODUCTION') color = 0x3b82f6; // Blue
        else if (zone.zone_type === 'HAULAGE') color = 0x8b5cf6; // Purple
        else if (zone.zone_type === 'VENTILATION') color = 0x10b981; // Green
        else color = 0x64748b;
      }

      const zoneGeo = new THREE.BoxGeometry(w, h, l);
      const zoneMat = new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        roughness: 0.5,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
      zoneMesh.position.set(ox + w / 2, oz + h / 2, oy + l / 2); // Map spatial coords
      zoneMesh.userData = { type: 'zone', data: zone, id: zone.id };
      group.add(zoneMesh);

      // Zone Boundary Edges
      const edges = new THREE.EdgesGeometry(zoneGeo);
      const edgeMat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity * 2.5 });
      const edgeMesh = new THREE.LineSegments(edges, edgeMat);
      edgeMesh.position.copy(zoneMesh.position);
      group.add(edgeMesh);
    });
  }
}
