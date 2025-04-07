import * as THREE from 'three';
import { ReactNode } from 'react';

// NavMesh Types
export interface NavMeshProps {
  debug?: boolean;
  handleClick?: (e: any) => void;
}

export interface NavMeshRef {
  findPath: (startPoint: THREE.Vector3, endPoint: THREE.Vector3) => THREE.Vector3[] | null;
  getNavmesh: () => THREE.Mesh | null;
  getNavMeshBounds: () => {
    min: THREE.Vector3;
    max: THREE.Vector3;
    center: THREE.Vector3;
    size: THREE.Vector3;
  } | null;
  isPointInNavMesh: (point: THREE.Vector3) => boolean;
}

// NPC Types
export interface NPCProps {
  id?: number;
  position?: [number, number, number];
  navMeshRef: React.RefObject<NavMeshRef>;
  color?: string;
  speed?: number;
  randomMovement?: boolean;
}

// Player Types
export interface PlayerProps {
  position?: [number, number, number];
  navMeshRef: React.RefObject<NavMeshRef>;
  color?: string;
  speed?: number;
  scale?: number;
}

export interface NPCData {
  id: number;
  position: [number, number, number];
  color: string;
  speed: number;
}

// Scene Types
export interface SceneProps {
  debug?: boolean;
}

// Model Types
export interface ModelProps {
  position?: [number, number, number];
  [key: string]: any;
}

// UI Types
export interface UIProps {
  setDebug: (debug: boolean) => void;
  debug: boolean;
}
