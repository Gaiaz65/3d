import { Directive, ElementRef, inject, OnDestroy, OnInit } from "@angular/core";
import * as THREE from "three";
import { injectStore } from 'angular-three';

@Directive({
  selector: "[wallOpacity]",
  standalone: true
})
export class WallOpacityDirective implements OnInit, OnDestroy {
  // TODO не нужна для plane geometry, однако может понадобиться при реализации drag and drop
  private store = injectStore();
  private host = inject<ElementRef<THREE.Mesh>>(ElementRef);
  private objectNormal = new THREE.Vector3();
  private toCamera = new THREE.Vector3();
  private animationFrame: number | null = null;
  private hiddenOpacity = 0;

  ngOnInit(): void {
    this.startChecking();
  }

  ngOnDestroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  private startChecking(): void {
    const check = () => {
      this.updateOpacity();
      this.animationFrame = requestAnimationFrame(check);
    };
    check();
  }

  private updateOpacity(): void {
    const mesh = this.host.nativeElement;
    const camera = this.store.camera();

    if (!camera || !mesh) return;

    // Получаем мировую нормаль объекта (направление "вперед" от объекта)
    // Для стены это направление ее лицевой стороны
    mesh.getWorldDirection(this.objectNormal);

    // Вектор от объекта к камере
    this.toCamera.copy(camera.position).sub(mesh.position).normalize();

    // Скалярное произведение нормали и направления на камеру
    // > 0: камера смотрит на лицевую сторону
    // < 0: камера смотрит на обратную сторону
    const dotProduct = this.objectNormal.dot(this.toCamera);

    // Если смотрим на лицевую сторону - делаем прозрачным
    // Если на обратную - оставляем видимым
    const opacity = dotProduct > 0 ? 1 : this.hiddenOpacity;

    this.setOpacity(opacity);
  }

  private setOpacity(opacity: number): void {
    const material = this.host.nativeElement.material;

    if (Array.isArray(material)) {
      material.forEach(mat => {
        if (mat.transparent) {
          mat.opacity = opacity;
        }
      });
    } else if (material && material.transparent) {
      material.opacity = opacity;
    }
  }
}
