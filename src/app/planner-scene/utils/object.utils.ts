import * as THREE from 'three';

export  function getObjectSize(element: any): THREE.Vector3 {
  element.geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  return  element.geometry.boundingBox.getSize(size);
}
