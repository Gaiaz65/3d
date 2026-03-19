import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {Subject} from 'rxjs';
import {TSurfaceType} from '../interfaces/surface.interface';

export interface SurfaceHit {
  type: TSurfaceType;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  object: THREE.Object3D;
  distance: number;
  uv?: THREE.Vector2;
  wallId?: string; // Для идентификации конкретной стены
}

export interface DragPlaneInfo {
  plane: THREE.Plane;
  surfaceType: TSurfaceType;
  wallId?: string;
  bounds?: THREE.Box2; // Границы для ограничения перемещения
  initialOffset?: THREE.Vector3; // Смещение от точки клика до центра объекта
}

@Injectable({providedIn: 'root'})
export class SurfaceService {
  // Реестр перетаскиваемых объектов для проверки коллизий между ними
  private items: Set<THREE.Object3D> = new Set();

  // Единственный выбранный объект — все директивы подписываются на этот поток
  private focusedItem$ = new Subject<THREE.Object3D | null>();
  readonly focusChanges$ = this.focusedItem$.asObservable();

  /** Сообщаем всем директивам, что фокус переходит к этому объекту */
  setFocus(object: THREE.Object3D): void {
    this.focusedItem$.next(object);
  }

  constructor() {
  }

  /**
   * Добавляем объект-мебель в реестр для проверки взаимных коллизий
   */
  registerItem(object: THREE.Object3D): void {
    this.items.add(object);
  }

  /**
   * Удаляем объект из реестра (при уничтожении компонента)
   */
  unregisterItem(object: THREE.Object3D): void {
    this.items.delete(object);
  }

  /**
   * Разрешает коллизии между перетаскиваемым объектом и остальными зарегистрированными объектами.
   * Использует AABB push-back по оси минимального перекрытия.
   *
   * @param draggingObject — объект, который тащат
   * @param desiredPosition — желаемая новая позиция
   * @returns скорректированная позиция без пересечений
   */
  /**
   * Проверяет, будет ли коллизия с другими объектами в указанной позиции.
   * Не изменяет позицию — только проверяет.
   */

  hasCollisionAt(draggingObject: THREE.Object3D, desiredPosition: THREE.Vector3): boolean {
    const dragBox = this.getGeometryBox(draggingObject);
    const size = new THREE.Vector3();
    dragBox.getSize(size);
    const half = size.clone().multiplyScalar(0.5);

    const selfBox = new THREE.Box3(
      new THREE.Vector3(desiredPosition.x - half.x, desiredPosition.y - half.y, desiredPosition.z - half.z),
      new THREE.Vector3(desiredPosition.x + half.x, desiredPosition.y + half.y, desiredPosition.z + half.z)
    );

    for (const other of this.items) {
      if (other === draggingObject) continue;
      if (selfBox.intersectsBox(this.getGeometryBox(other))) return true;
    }

    return false;
  }

  resolveItemCollision(
    draggingObject: THREE.Object3D,
    desiredPosition: THREE.Vector3
  ): THREE.Vector3 {
    // Размер перетаскиваемого объекта (половина по каждой оси) — только геометрия, без детей
    const dragBox = this.getGeometryBox(draggingObject);
    const size = new THREE.Vector3();
    dragBox.getSize(size);
    const half = size.clone().multiplyScalar(0.5);

    const resolved = desiredPosition.clone();

    // Несколько итераций, чтобы корректно обработать несколько объектов подряд
    const MAX_ITERATIONS = 4;

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      let anyCollision = false;

      for (const other of this.items) {
        if (other === draggingObject) continue;

        const otherBox = this.getGeometryBox(other);
        const selfBox = new THREE.Box3(
          new THREE.Vector3(resolved.x - half.x, resolved.y - half.y, resolved.z - half.z),
          new THREE.Vector3(resolved.x + half.x, resolved.y + half.y, resolved.z + half.z)
        );

        if (!selfBox.intersectsBox(otherBox)) continue;

        anyCollision = true;

        // Глубина перекрытия по каждой оси
        const overlapX = Math.min(selfBox.max.x, otherBox.max.x) - Math.max(selfBox.min.x, otherBox.min.x);
        const overlapZ = Math.min(selfBox.max.z, otherBox.max.z) - Math.max(selfBox.min.z, otherBox.min.z);

        // Выталкиваем по оси с наименьшим перекрытием (SAT-подход)
        if (overlapX <= overlapZ) {
          resolved.x += resolved.x >= other.position.x ? overlapX : -overlapX;
        } else {
          resolved.z += resolved.z >= other.position.z ? overlapZ : -overlapZ;
        }
      }

      if (!anyCollision) break;
    }

    return resolved;
  }

  /**
   * AABB только по геометрии меша, без детей (size-lines, selection box и т.д.).
   * Используем matrixWorld для корректного учёта позиции и масштаба.
   */
  private getGeometryBox(object: THREE.Object3D): THREE.Box3 {
    const mesh = object as THREE.Mesh;
    if (!mesh.geometry) return new THREE.Box3();

    mesh.geometry.computeBoundingBox();
    const geomBox = mesh.geometry.boundingBox;
    if (!geomBox) return new THREE.Box3();

    mesh.updateWorldMatrix(true, false);
    return geomBox.clone().applyMatrix4(mesh.matrixWorld);
  }
}
