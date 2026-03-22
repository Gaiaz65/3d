import * as THREE from 'three';

/** Возвращает размер объекта в мировом пространстве (учитывает rotation через world AABB). */
export function getObjectSize(element: THREE.Mesh): THREE.Vector3 {
  element.geometry.computeBoundingBox();
  const geomBox = element.geometry.boundingBox;
  if (!geomBox) return new THREE.Vector3();
  element.updateWorldMatrix(true, false);
  return geomBox.clone().applyMatrix4(element.matrixWorld).getSize(new THREE.Vector3());
}
