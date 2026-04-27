import * as THREE from 'three';
import {computeVisibleWorldBox} from '../utils/object.utils';

export class DragSelectionBox {
  private selectionBox: THREE.Mesh | null = null;
  private selectionEdges: THREE.LineSegments | null = null;

  constructor(private readonly object: THREE.Group) {}

  create(countInvisible: boolean): void {
    if (this.selectionBox) return;

    const worldBox = computeVisibleWorldBox(this.object, countInvisible);
    const worldSize = new THREE.Vector3();
    const worldCenter = new THREE.Vector3();
    worldBox.getSize(worldSize);
    worldBox.getCenter(worldCenter);

    const localSize   = worldSize.clone().divide(this.object.scale);
    const localCenter = this.object.worldToLocal(worldCenter.clone());

    const boxGeo  = new THREE.BoxGeometry(localSize.x, localSize.y, localSize.z);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const edgesMat = new THREE.LineBasicMaterial({color: 0x00ff55, depthTest: false});

    this.selectionEdges = new THREE.LineSegments(edgesGeo, edgesMat);
    this.selectionEdges.renderOrder = 999;

    this.selectionBox = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({visible: false}));
    this.selectionBox.position.copy(localCenter);
    this.selectionBox.userData['isSelectionBox'] = true;
    this.selectionBox.add(this.selectionEdges);

    this.object.add(this.selectionBox);
  }

  remove(): void {
    if (!this.selectionBox) return;

    if (this.selectionEdges) {
      this.selectionEdges.geometry.dispose();
      (this.selectionEdges.material as THREE.Material).dispose();
      this.selectionEdges = null;
    }
    this.selectionBox.parent?.remove(this.selectionBox);
    this.selectionBox.geometry.dispose();
    (this.selectionBox.material as THREE.Material).dispose();
    this.selectionBox = null;
  }
}
