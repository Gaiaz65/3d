import {
  Directive,
  OnInit,
  OnDestroy,
  inject,
  NgZone,
  ElementRef,
  EventEmitter,
  Output,
  signal,
  Input
} from '@angular/core';
import * as THREE from 'three';
import {injectStore} from 'angular-three';
import {fromEvent, Subject, takeUntil} from 'rxjs';
import {ConfigurationStore} from '../../store/store';
import {SurfaceService} from '../services/surface.service';
import {computeVisibleWorldBox} from '../utils/object.utils';

@Directive({
  selector: '[draggableGroup]',
  standalone: true,
})
export class DraggableGroupDirective implements OnInit, OnDestroy {
  @Input() public dragLevel: string = 'bottom';
  @Input() public countInvisibleUnits: boolean = false;
  @Output() public dragging = new EventEmitter<void>();
  @Output() public dragEndEvent = new EventEmitter<void>();
  @Output() public focusChange = new EventEmitter<boolean>();
  @Output() public rotationChange = new EventEmitter<number>();

  public focused = signal(false);

  private host = inject<ElementRef<THREE.Group>>(ElementRef);
  private store = injectStore();
  private configStore = inject(ConfigurationStore);
  private ngZone = inject(NgZone);
  private surfaceService = inject(SurfaceService);

  private destroy$ = new Subject<void>();
  private dragDestroy$ = new Subject<void>();

  private draggableObject: THREE.Group;
  private isDragging = false;
  private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private dragOffset = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private selectionBox: THREE.Mesh | null = null;
  private selectionEdges: THREE.LineSegments | null = null;
  private ghost: THREE.Mesh | null = null;

  private lastValidPosition = new THREE.Vector3();
  private size = {x: 0, y: 0, z: 0};
  private minY = 0;
  private roomBounds = {minX: 0, maxX: 0, minZ: 0, maxZ: 0};
  private objectHalfSize = new THREE.Vector3();

  // Offset from group.position to AABB center (precomputed on drag start)
  private aabbOffset = new THREE.Vector3();

  constructor() {
    this.draggableObject = this.host.nativeElement;
  }

  ngOnInit(): void {
    if (!this.draggableObject) return;

    this.surfaceService.registerItem(this.draggableObject);

    this.surfaceService.focusChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe((focusedObject) => {
        if (focusedObject !== this.draggableObject && this.focused()) {
          this.unfocusSilently();
        }
      });

    this.ngZone.runOutsideAngular(() => {
      const canvas = this.store().gl?.domElement;
      if (!canvas) return;

      fromEvent(canvas, 'mousedown')
        .pipe(takeUntil(this.destroy$))
        .subscribe((e) => this.handleMouseDown(e as MouseEvent));
    });
  }

  ngOnDestroy(): void {
    this.removeGhost();
    this.removeSelectionBox();
    this.surfaceService.unregisterItem(this.draggableObject);
    this.destroy$.next();
    this.destroy$.complete();
    this.dragDestroy$.next();
    this.dragDestroy$.complete();
  }

  // ── Mouse handling ─────────────────────────────────────────────────────────

  private handleMouseDown(event: MouseEvent): void {
    const camera = this.store().camera;
    if (!camera) return;

    this.normalizeMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, camera);

    // Recursive intersect — group has no own geometry, children do
    const hits = this.raycaster.intersectObject(this.draggableObject, true)
      .filter(h => !h.object.userData['isSelectionBox'] && !h.object.userData['isGhost']);

    if (hits.length > 0) {
      event.stopPropagation();
      if (!this.focused()) {
        this.setFocused(true);
        this.toggleControls(false);
      } else {
        this.startDrag(event, hits[0]);
      }
    } else if (this.focused()) {
      this.setFocused(false);
    }
    this.store().invalidate();
  }

  private setFocused(value: boolean): void {
    if (value) {
      this.surfaceService.setFocus(this.draggableObject);
      this.createSelectionBox();
      this.ngZone.run(() => {
        this.focused.set(true);
        this.focusChange.emit(true);
      });
    } else {
      this.unfocusSilently();
    }
  }

  private unfocusSilently(): void {
    this.removeSelectionBox();
    this.toggleControls(true);
    this.ngZone.run(() => {
      this.focused.set(false);
      this.focusChange.emit(false);
    });
  }

  // ── Selection box ──────────────────────────────────────────────────────────

  private createSelectionBox(): void {
    if (this.selectionBox) return;

    const worldBox = this.getVisibleWorldBox();
    const worldSize = new THREE.Vector3();
    const worldCenter = new THREE.Vector3();
    worldBox.getSize(worldSize);
    worldBox.getCenter(worldCenter);

    // Convert to group's local space (undo scale)
    const localSize = worldSize.clone().divide(this.draggableObject.scale);
    const localCenter = this.draggableObject.worldToLocal(worldCenter.clone());

    const boxGeo = new THREE.BoxGeometry(localSize.x, localSize.y, localSize.z);

    // Только контур — никакого fill, чтобы не перекрывать геометрию юнита
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const edgesMat = new THREE.LineBasicMaterial({color: 0x00ff55, depthTest: false});
    this.selectionEdges = new THREE.LineSegments(edgesGeo, edgesMat);
    this.selectionEdges.renderOrder = 999;

    // selectionBox используем как контейнер (invisible Mesh для dispose)
    this.selectionBox = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({visible: false}));
    this.selectionBox.position.copy(localCenter);
    this.selectionBox.userData['isSelectionBox'] = true;
    this.selectionBox.add(this.selectionEdges);

    this.draggableObject.add(this.selectionBox);
  }

  private removeSelectionBox(): void {
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

  // ── Drag ──────────────────────────────────────────────────────────────────

  private startDrag(_event: MouseEvent, firstIntersect: THREE.Intersection): void {
    this.isDragging = true;
    this.toggleControls(false);
    this.lastValidPosition.copy(this.draggableObject.position);
    this.dragOffset.copy(this.draggableObject.position).sub(firstIntersect.point);
    this.updateDragPlane();
    this.computeAabbOffset();
    this.calculateSize();
    this.createGhost();
    const {x, z} = this.configStore.roomParameters().size;
    this.roomBounds = {minX: -x / 2, maxX: x / 2, minZ: -z / 2, maxZ: z / 2};
    this.objectHalfSize.copy(this.getWorldSize()).multiplyScalar(0.5);

    this.dragDestroy$.next();
    const canvas = this.store().gl?.domElement;
    if (!canvas) return;

    fromEvent(canvas, 'mousemove')
      .pipe(takeUntil(this.dragDestroy$))
      .subscribe((e) => this.onMouseMove(e as MouseEvent));

    fromEvent(canvas, 'mouseup')
      .pipe(takeUntil(this.dragDestroy$))
      .subscribe(() => this.onMouseUp());
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const camera = this.store().camera;
    if (!camera) return;

    this.normalizeMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, camera);
    const intersection = new THREE.Vector3();

    const rayPlaneDot = Math.abs(this.raycaster.ray.direction.dot(this.dragPlane.normal));
    if (rayPlaneDot < 0.05) this.updateDragPlane();

    if (this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) {
      const positionClone = intersection.clone().add(this.dragOffset);
      const wallPoint = this.findWallIntersection();

      let x = wallPoint ? wallPoint.x : positionClone.x;
      let y = wallPoint ? wallPoint.y : this.draggableObject.position.y;
      let z = wallPoint ? wallPoint.z : positionClone.z;

      const maxX = this.size.x - this.aabbOffset.x;
      const minX = -this.size.x - this.aabbOffset.x;
      const maxZ = this.size.z - this.aabbOffset.z;
      const minZ = -this.size.z - this.aabbOffset.z;
      if (x > maxX) x = maxX; else if (x < minX) x = minX;
      if (z > maxZ) z = maxZ; else if (z < minZ) z = minZ;

      if (this.dragLevel === 'bottom') {
        y = 0;
      } else {
        if (y > this.size.y) y = this.size.y;
        else if (y < this.minY) y = this.minY;
      }

      const clamped = new THREE.Vector3(x, y, z);

      if (this.surfaceService.hasCollisionAt(this.draggableObject, clamped)) {
        this.showGhost(clamped);
      } else {
        this.draggableObject.position.copy(clamped);
        this.lastValidPosition.copy(clamped);
        this.hideGhost();
      }

      this.checkWallProximity(clamped);

      this.store().invalidate();
      this.dragging.emit();
    }
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.removeGhost();
    this.toggleControls(true);
    this.store().invalidate();
    this.dragEndEvent.emit();
    this.dragDestroy$.next();
  }

  // ── Ghost ─────────────────────────────────────────────────────────────────

  private createGhost(): void {
    if (this.ghost) return;

    const worldSize = this.getWorldSize();
    // +8 world units (≈8 мм при scale=1000) — поверхности ghost не совпадают
    // с поверхностями юнита → z-fighting исключён
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

  private showGhost(position: THREE.Vector3): void {
    if (!this.ghost) return;
    this.ghost.position.copy(position).add(this.aabbOffset);
    this.ghost.visible = true;
  }

  private hideGhost(): void {
    if (this.ghost) this.ghost.visible = false;
  }

  private removeGhost(): void {
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

  // ── Utilities ─────────────────────────────────────────────────────────────

  private toggleControls(enabled: boolean): void {
    const controls = this.store().controls;
    if (controls) (controls as any).enabled = enabled;
  }

  private updateDragPlane(): void {
    const camera = this.store().camera;
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);

    if (Math.abs(cameraDir.y) < 0.1) {
      const normal = new THREE.Vector3(cameraDir.x, 0, cameraDir.z).normalize().negate();
      this.dragPlane.setFromNormalAndCoplanarPoint(normal, this.draggableObject.position);
    } else {
      this.dragPlane.set(new THREE.Vector3(0, 1, 0), -this.draggableObject.position.y);
    }
  }

  /**
   * AABB только видимых мешей группы (пропускает invisible hit-box и спец-объекты).
   */
  private getVisibleWorldBox(): THREE.Box3 {
    return computeVisibleWorldBox(this.draggableObject, this.countInvisibleUnits);
  }

  private getWorldSize(): THREE.Vector3 {
    return this.getVisibleWorldBox().getSize(new THREE.Vector3());
  }

  /** Precompute offset from group.position to AABB center (stable during drag). */
  private computeAabbOffset(): void {
    const worldCenter = new THREE.Vector3();
    this.getVisibleWorldBox().getCenter(worldCenter);
    this.aabbOffset.copy(worldCenter).sub(this.draggableObject.position);
  }

  private calculateSize(): void {
    const objectSize = this.getWorldSize();
    const roomSize = this.configStore.roomParameters().size;
    // aabbOffset.y = distance from group.position.y to AABB center y.
    // minY keeps AABB bottom at y=0 (floor); maxY keeps AABB top at roomSize.y (ceiling).
    this.minY = objectSize.y / 2 - this.aabbOffset.y;
    this.size = {
      x: roomSize.x / 2 - objectSize.x / 2,
      y: roomSize.y - this.aabbOffset.y - objectSize.y / 2,
      z: roomSize.z / 2 - objectSize.z / 2,
    };
  }

  private normalizeMouseCoordinates(event: MouseEvent): void {
    const canvas = this.store().gl?.domElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private checkWallProximity(position: THREE.Vector3): void {
    const {minX, maxX, minZ, maxZ} = this.roomBounds;

    // AABB-центр объекта с учётом смещения от origin группы
    const cx = position.x + this.aabbOffset.x;
    const cz = position.z + this.aabbOffset.z;
    const hx = this.objectHalfSize.x;
    const hz = this.objectHalfSize.z;

    // Расстояния от края AABB до каждой стены
    const distances = [
      {dist: (cz - hz) - minZ, rotY: 0},              // задняя стена (-Z)
      {dist: maxZ - (cz + hz), rotY: Math.PI},         // передняя стена (+Z)
      {dist: (cx - hx) - minX, rotY:  Math.PI / 2},   // левая стена (-X)
      {dist: maxX - (cx + hx), rotY: -Math.PI / 2},   // правая стена (+X)
    ];

    const nearest = distances.reduce((a, b) => a.dist < b.dist ? a : b);

    if (nearest.dist > 100) return;

    this.applyRotationWithReclamp(nearest.rotY, position);
  }

  private applyRotationWithReclamp(rotY: number, position: THREE.Vector3): void {
    if (this.draggableObject.rotation.y === rotY) return;

    // 1. Применяем ротацию и сразу обновляем матрицы
    this.draggableObject.rotation.y = rotY;
    this.draggableObject.updateWorldMatrix(true, true);

    // 2. Пересчитываем AABB-зависимые значения с новой ротацией
    this.computeAabbOffset();
    this.calculateSize();
    this.objectHalfSize.copy(this.getWorldSize()).multiplyScalar(0.5);

    // 3. Зажимаем позицию в новые границы комнаты
    const maxX = this.size.x - this.aabbOffset.x;
    const minX = -this.size.x - this.aabbOffset.x;
    const maxZ = this.size.z - this.aabbOffset.z;
    const minZ = -this.size.z - this.aabbOffset.z;
    position.x = Math.max(minX, Math.min(maxX, position.x));
    position.z = Math.max(minZ, Math.min(maxZ, position.z));
    this.draggableObject.position.copy(position);
    this.lastValidPosition.copy(position);

    // 4. Пересоздаём ghost с новым размером
    this.removeGhost();
    this.createGhost();

    this.ngZone.run(() => this.rotationChange.emit(rotY));
  }

  private findWallIntersection(): THREE.Vector3 | null {
    const scene = this.store().scene;
    if (!scene) return null;
    const wallHit = this.raycaster.intersectObjects(scene.children).find(i =>
      !i.object.userData['isGhost'] &&
      (i.object.name?.toLowerCase().includes('wall') || i.object.userData['type'] === 'wall')
    );
    return wallHit ? wallHit.point : null;
  }
}
