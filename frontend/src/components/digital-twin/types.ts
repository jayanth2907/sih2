import { Mine, MineLevel, MineZone, Sensor, Camera, Equipment, Incident, AnomalyEvent } from '../../types';

export type ViewMode = 'OPERATIONAL' | 'RISK_HEATMAP';

export interface LayerVisibility {
  sensors: boolean;
  cameras: boolean;
  cameraFov: boolean;
  equipment: boolean;
  ventilation: boolean;
  mineStructure: boolean;
  shaftsAndTunnels: boolean;
  zones: boolean;
  labels: boolean;
  proximityLines: boolean;
  surfaceYard: boolean;
}

export type SelectedObjectType = 'sensor' | 'camera' | 'equipment' | 'zone' | 'incident' | 'anomaly';

export interface SelectedObject {
  type: SelectedObjectType;
  id: number;
  data: any;
  coordinates?: { x: number; y: number; z: number };
}

export interface CameraFocusTarget {
  x: number;
  y: number;
  z: number;
  targetLookAt?: { x: number; y: number; z: number };
  distance?: number;
  title?: string;
  durationMs?: number;
}

export interface ReplayKeyframe {
  timestamp: string;
  timeOffsetSeconds: number;
  label: string;
  stage: 'NORMAL' | 'TRENDING_UP' | 'WARNING' | 'CRITICAL' | 'ALERT_CREATED' | 'INCIDENT_CREATED' | 'RECOVERING' | 'RESOLVED';
  sensorValues: Record<string, number>;
  activeIncident?: boolean;
  riskScore: number;
  zoneRisks: Record<string, string>;
  description: string;
}

export interface ReplayState {
  isPlaying: boolean;
  currentSecond: number;
  totalSeconds: number;
  playbackSpeed: number; // 1, 2, 5
  activeKeyframeIndex: number;
}
