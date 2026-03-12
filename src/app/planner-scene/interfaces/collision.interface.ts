import * as THREE from 'three';
import CANNON from 'cannon-es';

export interface WallData {
  id: string;
  plane: THREE.Plane;
  bounds: THREE.Box2; // Границы стены в её локальной плоскости
  normal: THREE.Vector3;
  object: THREE.Object3D;
  width: any,
  height: any,
}

export interface CollisionResult {
  hasCollision: boolean;
  surfaceValid: boolean;
  worldCollisions: CANNON.ContactEquation[];
  objectCollisions: CANNON.ContactEquation[];
  suggestedPosition?: THREE.Vector3;
}
