import { RefObject } from 'react';
import * as THREE from 'three';

export interface NPC {
  id: number;
  position: [number, number, number];
  color: string;
  speed: number;
}

export interface NavMeshRef {
  findPath: (startPoint: THREE.Vector3, endPoint: THREE.Vector3) => THREE.Vector3[] | null;
  getNavmesh: () => THREE.Mesh | null
}

export interface SceneProps {
  debug: boolean;
}

export interface NPCProps {
  position: [number, number, number];
  navMeshRef: RefObject<NavMeshRef>;
  color: string;
  speed: number;
  randomMovement?: boolean;
  initialPosition?: THREE.Vector3 | null;
}

export interface NavMeshProps {
  debug: boolean;
}

export interface UIProps {
  debug: boolean;
  setDebug: (debug: boolean) => void;
}

export interface ModelProps {
  position?: [number, number, number];
  [key: string]: any;
}

export interface ObstacleProps {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
}
