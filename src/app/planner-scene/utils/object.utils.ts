import * as THREE from 'three';

/** Возвращает размер объекта в мировом пространстве (учитывает rotation через world AABB). */
export function getObjectSize(element: THREE.Mesh): THREE.Vector3 {
  element.geometry.computeBoundingBox();
  const geomBox = element.geometry.boundingBox;
  if (!geomBox) return new THREE.Vector3();
  element.updateWorldMatrix(true, false);
  return geomBox.clone().applyMatrix4(element.matrixWorld).getSize(new THREE.Vector3());
}

/**
 * Строит AABB в мировых координатах по мешам поддерева root.
 * Всегда пропускает: isSelectionBox / isGhost / isSizeLine.
 * @param countInvisible false (по умолчанию) — учитывать только видимые объекты;
 *                       true — включать и невидимые меши.
 */
export function computeVisibleWorldBox(root: THREE.Object3D, countInvisible = false): THREE.Box3 {
  const box = new THREE.Box3();
  root.updateWorldMatrix(true, true);
  collectVisible(root, box, countInvisible);
  return box;
}

function collectVisible(object: THREE.Object3D, box: THREE.Box3, countInvisible: boolean): void {
  if (!countInvisible && !object.visible) return;
  const ud = object.userData;
  if (ud['isSelectionBox'] || ud['isGhost'] || ud['isSizeLine']) return;
  const mesh = object as THREE.Mesh;
  if (mesh.isMesh && mesh.geometry) {
    mesh.geometry.computeBoundingBox();
    if (mesh.geometry.boundingBox) {
      box.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
    }
  }
  for (const child of object.children) collectVisible(child, box, countInvisible);
}
