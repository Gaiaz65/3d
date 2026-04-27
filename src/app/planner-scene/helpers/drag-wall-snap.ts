import * as THREE from 'three';

export interface RoomBounds {
  minX: number; maxX: number;
  minZ: number; maxZ: number;
}

export interface WallSnapResult {
  rotY: number;
}

const SNAP_DISTANCE = 100;

export class DragWallSnap {
  check(
    position: THREE.Vector3,
    aabbOffset: THREE.Vector3,
    halfSize: THREE.Vector3,
    bounds: RoomBounds,
  ): WallSnapResult | null {
    const cx = position.x + aabbOffset.x;
    const cz = position.z + aabbOffset.z;
    const hx = halfSize.x;
    const hz = halfSize.z;

    const candidates = [
      {dist: (cz - hz) - bounds.minZ, rotY: 0},              // задняя стена (-Z)
      {dist: bounds.maxZ - (cz + hz), rotY: Math.PI},         // передняя стена (+Z)
      {dist: (cx - hx) - bounds.minX, rotY:  Math.PI / 2},   // левая стена  (-X)
      {dist: bounds.maxX - (cx + hx), rotY: -Math.PI / 2},   // правая стена (+X)
    ];

    const nearest = candidates.reduce((a, b) => a.dist < b.dist ? a : b);
    return nearest.dist <= SNAP_DISTANCE ? {rotY: nearest.rotY} : null;
  }
}
