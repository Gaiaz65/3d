import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { TSurfaceType } from '../interfaces/surface.interface';
import { WallData } from '../interfaces/collision.interface';

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
  surfaceType:TSurfaceType;
  wallId?: string;
  bounds?: THREE.Box2; // Границы для ограничения перемещения
  initialOffset?: THREE.Vector3; // Смещение от точки клика до центра объекта
}

@Injectable({ providedIn: 'root' })
export class SurfaceService {
  // Храним геометрию комнаты
  private floorPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private floorMesh: THREE.Mesh | null = null;

  private walls: Map<string, WallData> = new Map();
  private wallMeshes: THREE.Mesh[] = [];

  private roomBounds: THREE.Box3 = new THREE.Box3();

  // Настройки допусков
  private readonly EPSILON = 0.01;
  private readonly WALL_ANGLE_THRESHOLD = 0.1; // Для определения вертикальности

  constructor() {}

  // ============= МЕТОДЫ РЕГИСТРАЦИИ =============

  /**
   * Регистрируем пол
   */
  registerFloor(mesh: THREE.Mesh) {
    this.floorMesh = mesh;

    // Получаем нормаль и позицию пола
    if (mesh.geometry) {
      // Предполагаем, что пол ориентирован нормалью вверх
      this.floorPlane.set(new THREE.Vector3(0, 1, 0), -mesh.position.y);
    }
  }

  /**
   * Регистрируем стену
   */
  registerWall(id: string, mesh: THREE.Mesh) {
    this.wallMeshes.push(mesh);

    // Вычисляем нормаль стены (предполагаем, что стена - это BoxGeometry с rotation)
    const normal = this.calculateWallNormal(mesh);

    // Создаем плоскость стены
    const plane = new THREE.Plane(normal.clone().normalize(), 0);
    plane.constant = -normal.dot(mesh.position);

    // Вычисляем границы стены в её локальной плоскости
    const bounds = this.calculateWallBounds(mesh, normal);

    this.walls.set(id, {
      id,
      plane,
      bounds,
      normal,
      object: mesh,
      width: bounds.max.x - bounds.min.x,
      height: bounds.max.y - bounds.min.y
    });
  }

  /**
   * Устанавливаем границы комнаты для volume объектов
   */
  setRoomBounds(min: THREE.Vector3, max: THREE.Vector3) {
    this.roomBounds.min.copy(min);
    this.roomBounds.max.copy(max);
  }

  // ============= МЕТОДЫ ОПРЕДЕЛЕНИЯ ПОВЕРХНОСТЕЙ =============

  /**
   * ГЛАВНЫЙ МЕТОД: определяем тип поверхности по пересечению
   */
  getSurfaceType(hit: THREE.Intersection):TSurfaceType {
    if (!hit.face || !hit.object) return 'room';

    const normal = hit.face.normal.clone().applyQuaternion(hit.object.quaternion);
    normal.normalize();

    // Проверяем, является ли поверхность полом (нормаль направлена вверх)
    if (Math.abs(normal.y) > 1 - this.EPSILON && normal.y > 0) {
      // Дополнительная проверка: это действительно пол или потолок?
      const worldPoint = hit.point.clone();
      if (Math.abs(worldPoint.y - this.floorPlane.constant) < this.EPSILON) {
        return 'floor';
      }
    }

    // Проверяем, является ли поверхность стеной (нормаль горизонтальна)
    if (Math.abs(normal.y) < this.WALL_ANGLE_THRESHOLD) {
      // Проверяем, что объект действительно стена (есть в our walls map)
      if (this.isWallObject(hit.object)) {
        return 'wall';
      }
    }

    // Все остальное - объемные объекты
    return 'room';
  }

  /**
   * Получаем детальную информацию о поверхности под курсором
   */
  getSurfaceHit(hit: THREE.Intersection): SurfaceHit | null {
    if (!hit.face || !hit.object) return null;

    const normal = hit.face.normal.clone().applyQuaternion(hit.object.quaternion);
    normal.normalize();

    const surfaceType = this.getSurfaceType(hit);
    const result: SurfaceHit = {
      type: surfaceType,
      point: hit.point.clone(),
      normal,
      object: hit.object,
      distance: hit.distance,
      uv: hit.uv?.clone()
    };

    // Если это стена, добавляем wallId
    if (surfaceType === 'wall') {
      result.wallId = this.findWallIdByObject(hit.object);
    }

    return result;
  }

  // ============= МЕТОДЫ СОЗДАНИЯ ПЛОСКОСТЕЙ ПЕРЕМЕЩЕНИЯ =============

  /**
   * ГЛАВНЫЙ МЕТОД: создаем плоскость для перетаскивания
   */
  getDragPlane(
    surfaceType:TSurfaceType,
    hit: SurfaceHit,
    object?: THREE.Object3D
  ): DragPlaneInfo {
    switch(surfaceType) {
      case 'floor':
        return this.createFloorDragPlane(hit);
      case 'wall':
        return this.createWallDragPlane(hit);
      case 'room':
        return this.createVolumeDragPlane(hit, object);
      default:
        return this.createVolumeDragPlane(hit, object);
    }
  }

  /**
   * Создаем плоскость для перемещения по полу
   */
  private createFloorDragPlane(hit: SurfaceHit): DragPlaneInfo {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    return {
      plane,
      surfaceType: 'floor',
      bounds: new THREE.Box2(
        new THREE.Vector2(this.roomBounds.min.x, this.roomBounds.min.z),
        new THREE.Vector2(this.roomBounds.max.x, this.roomBounds.max.z)
      )
    };
  }

  /**
   * Создаем плоскость для перемещения по стене
   */
  private createWallDragPlane(hit: SurfaceHit): DragPlaneInfo {
    if (!hit.wallId) {
      throw new Error('Wall hit must have wallId');
    }

    const wall = this.walls.get(hit.wallId);
    if (!wall) {
      throw new Error(`Wall with id ${hit.wallId} not found`);
    }

    // Используем плоскость стены
    const plane = wall.plane.clone();

    // Создаем bounds в формате, удобном для перемещения
    const bounds = new THREE.Box2(
      new THREE.Vector2(wall.bounds.min.x, wall.bounds.min.y),
      new THREE.Vector2(wall.bounds.max.x, wall.bounds.max.y)
    );

    return {
      plane,
      surfaceType: 'wall',
      wallId: hit.wallId,
      bounds
    };
  }

  /**
   * Создаем плоскость для перемещения в объеме
   */
  private createVolumeDragPlane(
    hit: SurfaceHit,
    object?: THREE.Object3D
  ): DragPlaneInfo {
    // Для объема используем плоскость, перпендикулярную лучу камеры
    // или плоскость на фиксированном расстоянии

    // Создаем плоскость, параллельную экрану
    const cameraDir = new THREE.Vector3(0, 0, -1); // Будет обновляться в рантайме

    // Плоскость, перпендикулярная направлению камеры
    const plane = new THREE.Plane(cameraDir, -hit.point.dot(cameraDir));

    return {
      plane,
      surfaceType: 'room',
      bounds: new THREE.Box2(
        new THREE.Vector2(this.roomBounds.min.x, this.roomBounds.min.z),
        new THREE.Vector2(this.roomBounds.max.x, this.roomBounds.max.z)
      )
    };
  }

  // ============= МЕТОДЫ ПРОВЕРКИ И ОГРАНИЧЕНИЙ =============

  /**
   * Проверяем, находится ли точка в пределах поверхности
   */
  isPointInSurface(
    point: THREE.Vector3,
    surfaceType:TSurfaceType,
    wallId?: string
  ): boolean {
    switch(surfaceType) {
      case 'floor':
        return this.isPointOnFloor(point);
      case 'wall':
        return wallId ? this.isPointOnWall(point, wallId) : false;
      case 'room':
        return this.isPointInVolume(point);
      default:
        return false;
    }
  }

  /**
   * Проверяем точку на полу
   */
  private isPointOnFloor(point: THREE.Vector3): boolean {
    // Проверяем Y-координату
    if (Math.abs(point.y - this.floorPlane.constant) > this.EPSILON) {
      return false;
    }

    // Проверяем границы комнаты
    return (
      point.x >= this.roomBounds.min.x &&
      point.x <= this.roomBounds.max.x &&
      point.z >= this.roomBounds.min.z &&
      point.z <= this.roomBounds.max.z
    );
  }

  /**
   * Проверяем точку на стене
   */
  private isPointOnWall(point: THREE.Vector3, wallId: string): boolean {
    const wall = this.walls.get(wallId);
    if (!wall) return false;

    // Проверяем расстояние до плоскости стены
    const distance = wall.plane.distanceToPoint(point);
    if (Math.abs(distance) > this.EPSILON) return false;

    // Проецируем точку на плоскость стены
    const localPoint = this.worldToWallLocal(point, wall);

    // Проверяем границы
    return (
      localPoint.x >= wall.bounds.min.x &&
      localPoint.x <= wall.bounds.max.x &&
      localPoint.y >= wall.bounds.min.y &&
      localPoint.y <= wall.bounds.max.y
    );
  }

  /**
   * Проверяем точку в объеме комнаты
   */
  private isPointInVolume(point: THREE.Vector3): boolean {
    return this.roomBounds.containsPoint(point);
  }

  /**
   * Ограничиваем позицию границами поверхности
   */
  clampToSurface(
    position: THREE.Vector3,
    surfaceType:TSurfaceType,
    objectSize: THREE.Vector3,
    wallId?: string
  ): THREE.Vector3 {
    const clamped = position.clone();

    switch(surfaceType) {
      case 'floor':
        return this.clampToFloor(clamped, objectSize);
      case 'wall':
        return wallId ? this.clampToWall(clamped, objectSize, wallId) : clamped;
      case 'room':
        return this.clampToVolume(clamped, objectSize);
      default:
        return clamped;
    }
  }

  /**
   * Ограничиваем позицию на полу
   */
  private clampToFloor(position: THREE.Vector3, size: THREE.Vector3): THREE.Vector3 {
    const halfX = size.x / 2;
    const halfZ = size.z / 2;

    position.x = Math.max(
      this.roomBounds.min.x + halfX,
      Math.min(this.roomBounds.max.x - halfX, position.x)
    );

    position.y = this.floorPlane.constant + size.y / 2;

    position.z = Math.max(
      this.roomBounds.min.z + halfZ,
      Math.min(this.roomBounds.max.z - halfZ, position.z)
    );

    return position;
  }

  /**
   * Ограничиваем позицию на стене
   */
  private clampToWall(
    position: THREE.Vector3,
    size: THREE.Vector3,
    wallId: string
  ): THREE.Vector3 {
    const wall = this.walls.get(wallId);
    if (!wall) return position;

    // Проецируем позицию на плоскость стены
    const projected = this.projectToWallPlane(position, wall.plane);

    // Конвертируем в локальные координаты стены
    const localPos = this.worldToWallLocal(projected, wall);

    const halfWidth = size.x / 2;
    const halfHeight = size.y / 2;

    // Ограничиваем локальные координаты
    localPos.x = Math.max(
      wall.bounds.min.x + halfWidth,
      Math.min(wall.bounds.max.x - halfWidth, localPos.x)
    );

    localPos.y = Math.max(
      wall.bounds.min.y + halfHeight,
      Math.min(wall.bounds.max.y - halfHeight, localPos.y)
    );

    // Конвертируем обратно в мировые координаты
    return this.wallLocalToWorld(localPos, wall);
  }

  /**
   * Ограничиваем позицию в объеме комнаты
   */
  private clampToVolume(position: THREE.Vector3, size: THREE.Vector3): THREE.Vector3 {
    const halfX = size.x / 2;
    const halfY = size.y / 2;
    const halfZ = size.z / 2;

    position.x = Math.max(
      this.roomBounds.min.x + halfX,
      Math.min(this.roomBounds.max.x - halfX, position.x)
    );

    position.y = Math.max(
      this.roomBounds.min.y + halfY,
      Math.min(this.roomBounds.max.y - halfY, position.y)
    );

    position.z = Math.max(
      this.roomBounds.min.z + halfZ,
      Math.min(this.roomBounds.max.z - halfZ, position.z)
    );

    return position;
  }

  // ============= ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =============

  /**
   * Вычисляем нормаль стены
   */
  private calculateWallNormal(mesh: THREE.Mesh): THREE.Vector3 {
    // По умолчанию предполагаем, что стена ориентирована по одной из осей
    const quaternion = mesh.quaternion.clone();
    const defaultNormal = new THREE.Vector3(0, 0, 1); // Предполагаем, что стена смотрит по Z
    return defaultNormal.applyQuaternion(quaternion).normalize();
  }

  /**
   * Вычисляем границы стены в её локальной плоскости
   */
  private calculateWallBounds(mesh: THREE.Mesh, normal: THREE.Vector3): THREE.Box2 {
    const bbox = new THREE.Box3().setFromObject(mesh);

    // Создаем систему координат стены
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(normal, up).normalize();
    const localUp = new THREE.Vector3().crossVectors(right, normal).normalize();

    // Проецируем углы bbox на плоскость стены
    const corners = [
      new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.min.z),
      new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.min.z),
      new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.min.z),
      new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.min.z),
      new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.max.z),
      new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.max.z),
      new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.max.z),
      new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.max.z)
    ];

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    corners.forEach(corner => {
      const toCorner = new THREE.Vector3().subVectors(corner, mesh.position);
      const x = toCorner.dot(right);
      const y = toCorner.dot(localUp);

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });

    return new THREE.Box2(
      new THREE.Vector2(minX, minY),
      new THREE.Vector2(maxX, maxY)
    );
  }

  /**
   * Проверяем, является ли объект стеной
   */
  private isWallObject(object: THREE.Object3D): boolean {
    return this.wallMeshes.includes(object as THREE.Mesh);
  }

  /**
   * Находим wallId по объекту стены
   */
  private findWallIdByObject(object: THREE.Object3D): string | undefined {
    for (const [id, wall] of this.walls.entries()) {
      if (wall.object === object) {
        return id;
      }
    }
    return undefined;
  }

  /**
   * Проецируем точку на плоскость стены
   */
  private projectToWallPlane(point: THREE.Vector3, plane: THREE.Plane): THREE.Vector3 {
    const projected = point.clone();
    const distance = plane.distanceToPoint(point);
    plane.normal.multiplyScalar(-distance).add(point);
    return projected;
  }

  /**
   * Конвертируем мировые координаты в локальные координаты стены
   */
  private worldToWallLocal(point: THREE.Vector3, wall: WallData): THREE.Vector2 {
    // Создаем систему координат стены
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(wall.normal, up).normalize();
    const localUp = new THREE.Vector3().crossVectors(right, wall.normal).normalize();

    // Вычисляем локальные координаты
    const toPoint = new THREE.Vector3().subVectors(point, wall.object.position);

    const x = toPoint.dot(right);
    const y = toPoint.dot(localUp);

    return new THREE.Vector2(x, y);
  }

  /**
   * Конвертируем локальные координаты стены в мировые
   */
  private wallLocalToWorld(localPos: THREE.Vector2, wall: WallData): THREE.Vector3 {
    // Создаем систему координат стены
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(wall.normal, up).normalize();
    const localUp = new THREE.Vector3().crossVectors(right, wall.normal).normalize();

    // Конвертируем
    return wall.object.position.clone()
      .add(right.clone().multiplyScalar(localPos.x))
      .add(localUp.clone().multiplyScalar(localPos.y));
  }

  /**
   * Находим стену по ID
   */
  getWallById(id: string): WallData | undefined {
    return this.walls.get(id);
  }

  /**
   * Получаем все стены
   */
  getAllWalls(): WallData[] {
    return Array.from(this.walls.values());
  }

  /**
   * Получаем границы пола
   */
  getFloorBounds(): THREE.Box2 {
    return new THREE.Box2(
      new THREE.Vector2(this.roomBounds.min.x, this.roomBounds.min.z),
      new THREE.Vector2(this.roomBounds.max.x, this.roomBounds.max.z)
    );
  }

  /**
   * Получаем нормаль пола
   */
  getFloorNormal(): THREE.Vector3 {
    return this.floorPlane.normal.clone();
  }

  // ============= МЕТОДЫ ДЛЯ ОТЛАДКИ =============

  /**
   * Визуализация поверхностей (опционально)
   */
  debugDrawSurfaces(scene: THREE.Scene) {
    // Рисуем нормали стен
    this.walls.forEach((wall, id) => {
      const arrowHelper = new THREE.ArrowHelper(
        wall.normal,
        wall.object.position,
        1,
        0x0000ff
      );
      scene.add(arrowHelper);

      // Рисуем границы стены
      const corners = [
        this.wallLocalToWorld(new THREE.Vector2(wall.bounds.min.x, wall.bounds.min.y), wall),
        this.wallLocalToWorld(new THREE.Vector2(wall.bounds.max.x, wall.bounds.min.y), wall),
        this.wallLocalToWorld(new THREE.Vector2(wall.bounds.max.x, wall.bounds.max.y), wall),
        this.wallLocalToWorld(new THREE.Vector2(wall.bounds.min.x, wall.bounds.max.y), wall)
      ];

      const points = corners.concat(corners[0]); // Замыкаем контур
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
      scene.add(line);
    });

    // Рисуем нормаль пола
    const floorCenter = new THREE.Vector3(
      (this.roomBounds.min.x + this.roomBounds.max.x) / 2,
      this.floorPlane.constant,
      (this.roomBounds.min.z + this.roomBounds.max.z) / 2
    );

    const floorArrow = new THREE.ArrowHelper(
      this.floorPlane.normal,
      floorCenter,
      1,
      0xff0000
    );
    scene.add(floorArrow);
  }
}
