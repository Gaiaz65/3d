import { Injectable } from '@angular/core';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {CollisionResult, WallData} from '../interfaces/collision.interface';
import {TSurfaceType} from '../interfaces/surface.interface';

@Injectable({ providedIn: 'root' })
export class CollisionService {
  private world: CANNON.World;
  private bodies: Map<THREE.Object3D, CANNON.Body> = new Map();
  private tempBody: CANNON.Body;

  // Данные о поверхностях комнаты
  private floorPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private floorBounds: THREE.Box2 = new THREE.Box2(
    new THREE.Vector2(-10, -10),
    new THREE.Vector2(10, 10)
  ); // Границы пола по X и Z

  private walls: Map<string, WallData> = new Map();
  private roomBounds: THREE.Box3 = new THREE.Box3(); // Границы всей комнаты для volume объектов

  constructor() {
    // Инициализируем физический мир
    this.world = new CANNON.World();
    this.world.gravity.set(0, 0, 0); // Отключаем гравитацию для редактора

    // Создаем временное тело для проверок
    this.tempBody = new CANNON.Body({ mass: 0 });
  }

  // ============= МЕТОДЫ РЕГИСТРАЦИИ =============

  /**
   * Регистрируем объект в физическом мире
   */
  registerObject(object: THREE.Object3D, shape: CANNON.Shape) {
    const body = new CANNON.Body({ mass: 0 }); // Статическое тело
    body.addShape(shape);
    body.position.copy(object.position as any);

    this.world.addBody(body);
    this.bodies.set(object, body);
  }

  /**
   * Удаляем объект из физического мира
   */
  unregisterObject(object: THREE.Object3D) {
    const body = this.bodies.get(object);
    if (body) {
      this.world.removeBody(body);
      this.bodies.delete(object);
    }
  }

  /**
   * Устанавливаем границы комнаты
   */
  setRoomBounds(min: THREE.Vector3, max: THREE.Vector3) {
    this.roomBounds.min.copy(min);
    this.roomBounds.max.copy(max);
  }

  /**
   * Добавляем стену в систему
   */
  registerWall(id: string, wallObject: THREE.Object3D, normal: THREE.Vector3) {
    // Создаем плоскость стены
    const plane = new THREE.Plane(normal.clone().normalize(), 0);

    // Вычисляем границы стены (предполагаем, что стена - это BoxGeometry)
    const bbox = new THREE.Box3().setFromObject(wallObject);
    const bounds = new THREE.Box2(
      new THREE.Vector2(bbox.min.x, bbox.min.z), // Используем X и Z для вертикальной плоскости
      new THREE.Vector2(bbox.max.x, bbox.max.z)
    );

    this.walls.set(id, {
      id,
      plane,
      bounds,
      normal,
      object: wallObject,
      width: undefined,
      height: undefined
    });
  }

  /**
   * Обновляем позицию физического тела
   */
  updateBodyPosition(object: THREE.Object3D, position: THREE.Vector3) {
    const body = this.bodies.get(object);
    if (body) {
      body.position.copy(position as any);
    }
  }

  // ============= МЕТОДЫ ПРОВЕРКИ КОЛЛИЗИЙ =============

  /**
   * Проверяем коллизию в предполагаемой позиции
   */
  checkCollision(
    object: THREE.Object3D,
    position: THREE.Vector3,
    surfaceType: TSurfaceType
  ): CollisionResult {
    const originalBody = this.bodies.get(object);
    if (!originalBody) {
      return {
        hasCollision: false,
        surfaceValid: true,
        worldCollisions: [],
        objectCollisions: []
      };
    }

    const originalPosition = originalBody.position.clone();

    // Временно перемещаем тело
    originalBody.position.copy(position as any);

    // Проверяем коллизии через физический движок
    this.world.step(1 / 60);

    // Собираем информацию о коллизиях
    const worldCollisions = this.world.contacts.filter(c =>
      this.isStaticObject(c.bi) || this.isStaticObject(c.bj)
    );

    const objectCollisions = this.world.contacts.filter(c =>
      !this.isStaticObject(c.bi) && !this.isStaticObject(c.bj)
    );

    const hasCollision = this.world.contacts.length > 0;

    // Проверяем границы поверхности
    const surfaceValid = this.checkSurfaceBounds(position, surfaceType, object);

    // Возвращаем на место
    originalBody.position.copy(originalPosition);
    this.world.contacts = [];

    // Находим предложенную позицию если есть коллизия
    let suggestedPosition: THREE.Vector3 | undefined;
    if (hasCollision || !surfaceValid) {
      suggestedPosition = this.findClosestValidPosition(object, position, surfaceType);
    }

    return {
      hasCollision,
      surfaceValid,
      worldCollisions,
      objectCollisions,
      suggestedPosition
    };
  }

  /**
   * Проверяем, является ли тело статичным объектом комнаты
   */
  private isStaticObject(body: CANNON.Body): boolean {
    // Здесь можно проверять по userData или другим признакам
    return body.mass === 0 && (body as any).userData?.type === 'room';
  }

  // ============= МЕТОДЫ ПРОВЕРКИ ГРАНИЦ ПОВЕРХНОСТЕЙ =============

  /**
   * ГЛАВНЫЙ МЕТОД: проверка границ поверхности
   */
  private checkSurfaceBounds(
    position: THREE.Vector3,
    surfaceType: TSurfaceType,
    object: THREE.Object3D
  ): boolean {
    // Получаем размеры объекта для корректных границ
    const objectSize = this.getObjectSize(object);

    switch(surfaceType) {
      case 'floor':
        return this.checkFloorBounds(position, objectSize);
      case 'wall':
        return this.checkWallBounds(position, objectSize);
      case 'room':
        return this.checkVolumeBounds(position, objectSize);
      default:
        return true;
    }
  }

  /**
   * Проверка границ пола
   */
  private checkFloorBounds(position: THREE.Vector3, objectSize: THREE.Vector3): boolean {
    // Проверяем Y-координату (объект должен стоять на полу)
    if (Math.abs(position.y - objectSize.y / 2) > 0.1) {
      return false;
    }

    // Проверяем X и Z границы с учетом размера объекта
    const halfX = objectSize.x / 2;
    const halfZ = objectSize.z / 2;

    return (
      position.x - halfX >= this.floorBounds.min.x &&
      position.x + halfX <= this.floorBounds.max.x &&
      position.z - halfZ >= this.floorBounds.min.y && // В Box2: min.y это Z min
      position.z + halfZ <= this.floorBounds.max.y    // max.y это Z max
    );
  }

  /**
   * Проверка границ стены
   */
  private checkWallBounds(position: THREE.Vector3, objectSize: THREE.Vector3): boolean {
    // Находим ближайшую стену
    const wall = this.findClosestWall(position);
    if (!wall) return false;

    // Проецируем позицию на плоскость стены
    const projectedPos = this.projectToWallPlane(position, wall.plane);

    // Проверяем, что объект не выходит за границы стены
    // Для стены важны координаты в её плоскости (обычно X и Y, или Y и Z)
    const halfWidth = objectSize.x / 2; // Предполагаем, что ширина объекта по X
    const halfHeight = objectSize.y / 2; // Высота объекта по Y

    // Конвертируем позицию в локальные координаты стены
    const localPos = this.worldToWallLocal(projectedPos, wall);

    return (
      localPos.x - halfWidth >= wall.bounds.min.x &&
      localPos.x + halfWidth <= wall.bounds.max.x &&
      localPos.y - halfHeight >= wall.bounds.min.y && // В Box2: min.y это высота min
      localPos.y + halfHeight <= wall.bounds.max.y    // max.y это высота max
    );
  }

  /**
   * Проверка границ объема (вся комната)
   */
  private checkVolumeBounds(position: THREE.Vector3, objectSize: THREE.Vector3): boolean {
    const halfX = objectSize.x / 2;
    const halfY = objectSize.y / 2;
    const halfZ = objectSize.z / 2;

    return (
      position.x - halfX >= this.roomBounds.min.x &&
      position.x + halfX <= this.roomBounds.max.x &&
      position.y - halfY >= this.roomBounds.min.y &&
      position.y + halfY <= this.roomBounds.max.y &&
      position.z - halfZ >= this.roomBounds.min.z &&
      position.z + halfZ <= this.roomBounds.max.z
    );
  }

  // ============= ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =============

  /**
   * Получаем размеры объекта
   */
  private getObjectSize(object: THREE.Object3D): THREE.Vector3 {
    const bbox = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    return size;
  }

  /**
   * Находим ближайшую стену к позиции
   */
  private findClosestWall(position: THREE.Vector3): WallData | null {
    let closestWall: WallData | null = null;
    let minDistance = Infinity;

    this.walls.forEach((wall) => {
      const distance = Math.abs(wall.plane.distanceToPoint(position));
      if (distance < minDistance) {
        minDistance = distance;
        closestWall = wall;
      }
    });

    return closestWall;
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
   * Поиск ближайшей валидной позиции
   */
  private findClosestValidPosition(
    object: THREE.Object3D,
    targetPosition: THREE.Vector3,
    surfaceType: TSurfaceType
  ): THREE.Vector3 {
    const step = 0.1; // шаг поиска
    const maxAttempts = 50;

    // Пробуем найти позицию в радиусе
    for (let radius = step; radius <= step * maxAttempts; radius += step) {
      // Пробуем разные направления
      const directions = [
        new THREE.Vector3(radius, 0, 0),
        new THREE.Vector3(-radius, 0, 0),
        new THREE.Vector3(0, radius, 0),
        new THREE.Vector3(0, -radius, 0),
        new THREE.Vector3(0, 0, radius),
        new THREE.Vector3(0, 0, -radius)
      ];

      for (const dir of directions) {
        const candidate = targetPosition.clone().add(dir);

        // Проверяем эту позицию
        const result = this.checkCollision(object, candidate, surfaceType);

        if (!result.hasCollision && result.surfaceValid) {
          return candidate;
        }
      }
    }

    // Если не нашли, возвращаем исходную позицию объекта
    return object.position.clone();
  }

  // ============= МЕТОДЫ ДЛЯ ОТЛАДКИ =============

  /**
   * Визуализация границ (опционально)
   */
  debugDrawBounds(scene: THREE.Scene) {
    // Пол: рисуем прямоугольник
    const floorWireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(
        this.floorBounds.max.x - this.floorBounds.min.x,
        0.1,
        this.floorBounds.max.y - this.floorBounds.min.y
      )),
      new THREE.LineBasicMaterial({ color: 0x00ff00 })
    );
    floorWireframe.position.set(
      (this.floorBounds.min.x + this.floorBounds.max.x) / 2,
      0.01,
      (this.floorBounds.min.y + this.floorBounds.max.y) / 2
    );
    scene.add(floorWireframe);

    // Стены: рисуем их границы
    this.walls.forEach((wall) => {
      // Создаем wireframe для визуализации границ стены
      const wallWireframe = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(
          wall.bounds.max.x - wall.bounds.min.x,
          wall.bounds.max.y - wall.bounds.min.y,
          0.1
        )),
        new THREE.LineBasicMaterial({ color: 0x0000ff })
      );
      wallWireframe.position.copy(wall.object.position);
      scene.add(wallWireframe);
    });
  }
}
