import {Directive, ElementRef, inject} from '@angular/core';
import * as THREE from 'three';
import {beforeRender, injectStore} from 'angular-three';

@Directive({
  selector: '[wallOpacity]',
  standalone: true,
})
export class WallOpacityDirective {
  private readonly store = injectStore();
  private readonly host = inject<ElementRef<THREE.Mesh>>(ElementRef);

  private readonly objectNormal = new THREE.Vector3();
  private readonly toCamera = new THREE.Vector3();

  constructor() {
    beforeRender(() => {
      const mesh = this.host.nativeElement;
      const camera = this.store.camera();
      if (!camera || !mesh) return;

      mesh.getWorldDirection(this.objectNormal);
      this.toCamera.copy(camera.position).sub(mesh.position).normalize();

      const opacity = this.objectNormal.dot(this.toCamera) > 0 ? 1 : 0;
      this.setOpacity(opacity);
    });
  }

  private setOpacity(opacity: number): void {
    const material = this.host.nativeElement.material;
    if (Array.isArray(material)) {
      material.forEach(mat => { if (mat.transparent) mat.opacity = opacity; });
    } else if (material?.transparent) {
      material.opacity = opacity;
    }
  }
}
