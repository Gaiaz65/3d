import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {injectStore} from 'angular-three';

@Injectable()
export class DragGhostService {
  private store = injectStore();
  private ghost: THREE.Mesh | null = null;

  create(worldSize: THREE.Vector3): void {
    if (this.ghost) return;

    const pad = 8;
    const geometry = new THREE.BoxGeometry(
      worldSize.x + pad,
      worldSize.y + pad,
      worldSize.z + pad,
    );

    const fillMat = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      depthTest: false,
      side: THREE.FrontSide,
    });

    const edgesGeo = new THREE.EdgesGeometry(geometry);
    const edgesMat = new THREE.LineBasicMaterial({color: 0xff3333, depthTest: false});
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);
    edges.renderOrder = 999;

    this.ghost = new THREE.Mesh(geometry, fillMat);
    this.ghost.renderOrder = 998;
    this.ghost.add(edges);
    this.ghost.userData['isGhost'] = true;
    this.ghost.visible = false;

    this.store().scene.add(this.ghost);
  }

  show(position: THREE.Vector3, aabbOffset: THREE.Vector3): void {
    if (!this.ghost) return;
    this.ghost.position.copy(position).add(aabbOffset);
    this.ghost.visible = true;
  }

  hide(): void {
    if (this.ghost) this.ghost.visible = false;
  }

  remove(): void {
    if (!this.ghost) return;
    this.ghost.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
    this.store().scene?.remove(this.ghost);
    this.ghost = null;
  }
}
