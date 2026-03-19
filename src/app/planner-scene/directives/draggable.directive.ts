import {Directive, OnInit, OnDestroy, inject, NgZone, ElementRef, EventEmitter, Output, signal} from '@angular/core';
import * as THREE from 'three';
import {injectStore} from 'angular-three';
import {fromEvent, Subject, takeUntil} from 'rxjs';
import {ConfigurationStore} from '../../store/store';
import {getObjectSize} from '../utils/object.utils';
import {SurfaceService} from '../services/surface.service';

@Directive({
  selector: '[draggableItem]',
  standalone: true
})
export class DraggableDirective implements OnInit, OnDestroy {
  @Output() dargging = new EventEmitter<void>();
  @Output() dragEndEvent = new EventEmitter<void>();
  @Output() focusChange = new EventEmitter<boolean>();

  public focused = signal(false);

  private host = inject<ElementRef<THREE.Mesh>>(ElementRef);
  private store = injectStore();
  private configStore = inject(ConfigurationStore);
  private ngZone = inject(NgZone);
  private surfaceService = inject(SurfaceService);

  private destroy$ = new Subject<void>();
  private dragDestroy$ = new Subject<void>();

  private draggableObject: THREE.Object3D;
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

  constructor() {
    this.draggableObject = this.host.nativeElement;
  }

  ngOnInit() {
    if (!this.draggableObject) return;

    this.surfaceService.registerItem(this.draggableObject);

    // Когда другой объект получает фокус — снимаем свой без уведомления сервиса
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

  ngOnDestroy() {
    this.removeGhost();
    this.removeSelectionBox();
    this.surfaceService.unregisterItem(this.draggableObject);
    this.destroy$.next();
    this.destroy$.complete();
    this.dragDestroy$.next();
    this.dragDestroy$.complete();
  }

  // ── Фокус ─────────────────────────────────────────────────────────────────

  private handleMouseDown(event: MouseEvent): void {
    if (!this.draggableObject) return;

    const camera = this.store().camera;
    const scene = this.store().scene;
    if (!camera || !scene) return;

    this.normalizeMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, camera);

    const intersects = this.raycaster.intersectObject(this.draggableObject, false);
    const hitThisObject = intersects.length > 0;

    if (hitThisObject) {
      event.stopPropagation();
      if (!this.focused()) {
        // Первый клик: только фокус, без перетаскивания
        this.setFocused(true);
        this.toggleControls(false);
      } else {
        // Объект уже выбран — начинаем drag
        this.startDrag(event, intersects[0]);
      }
    } else if (this.focused()) {
      // Клик в пустом месте — снимаем выбор
      this.setFocused(false);
    }
  }

  private setFocused(value: boolean): void {
    if (value) {
      // Уведомляем сервис — он сообщит другим директивам снять фокус
      this.surfaceService.setFocus(this.draggableObject);
      this.focused.set(true);
      this.focusChange.emit(true);
      this.createSelectionBox();
    } else {
      this.unfocusSilently();
    }
  }

  /** Снять фокус без уведомления сервиса (чтобы не создавать циклов) */
  private unfocusSilently(): void {
    this.focused.set(false);
    this.focusChange.emit(false);
    this.removeSelectionBox();
    this.toggleControls(true);
  }

  // ── Selection box ──────────────────────────────────────────────────────────

  private createSelectionBox(): void {
    if (this.selectionBox) return;

    const mesh = this.host.nativeElement as THREE.Mesh;
    if (!mesh.geometry) return;

    mesh.geometry.computeBoundingBox();
    const geomBox = mesh.geometry.boundingBox;
    if (!geomBox) return;

    const size = new THREE.Vector3();
    geomBox.getSize(size);

    const boxGeo = new THREE.BoxGeometry(size.x, size.y, size.z);

    // Прозрачная заливка
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0x00dd55,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.selectionBox = new THREE.Mesh(boxGeo, fillMat);
    this.selectionBox.userData['isSelectionBox'] = true;

    // Чёткие рёбра поверх заливки
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const edgesMat = new THREE.LineBasicMaterial({color: 0x00ff55});
    this.selectionEdges = new THREE.LineSegments(edgesGeo, edgesMat);
    this.selectionBox.add(this.selectionEdges);

    mesh.add(this.selectionBox);
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

  private startDrag(_event: MouseEvent, firstIntersect: THREE.Intersection): void {
    this.calculateSize();
    this.isDragging = true;
    this.toggleControls(false);
    this.lastValidPosition.copy(this.draggableObject.position);
    this.dragOffset.copy(this.draggableObject.position).sub(firstIntersect.point);
    this.createGhost();

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
    if (!this.isDragging || !this.draggableObject) return;

    const camera = this.store().camera;
    if (!camera) return;

    this.normalizeMouseCoordinates(event);
    this.raycaster.setFromCamera(this.mouse, camera);
    const intersection = new THREE.Vector3();

    if (this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) {
      const positionClone = intersection.clone().add(this.dragOffset);
      const wallPoint = this.findWallIntersection();
      const objectSize = getObjectSize(this.host.nativeElement);

      let x = wallPoint ? wallPoint.x : positionClone.x;
      let y = wallPoint ? wallPoint.y : (this.draggableObject.position.y || objectSize.y / 2);
      let z = wallPoint ? wallPoint.z : positionClone.z;

      if (x > 0 && x > this.size.x) x = this.size.x;
      else if (x < 0 && x < -this.size.x) x = -this.size.x;

      if (z > 0 && z > this.size.z) z = this.size.z;
      else if (z < 0 && z < -this.size.z) z = -this.size.z;

      if (y > this.size.y) y = this.size.y;
      else if (y < objectSize.y / 2) y = objectSize.y / 2;

      const clamped = new THREE.Vector3(x, y, z);

      if (this.surfaceService.hasCollisionAt(this.draggableObject, clamped)) {
        // Коллизия: объект остаётся на месте, призрак следует за курсором
        this.showGhost(clamped);
      } else {
        // Свободно: объект двигается, призрак скрыт
        this.draggableObject.position.copy(clamped);
        this.lastValidPosition.copy(clamped);
        this.hideGhost();
      }

      this.dargging.emit();
    }
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.removeGhost();
    this.toggleControls(true);
    this.dragEndEvent.emit();
    this.dragDestroy$.next();
  }

  // ── Ghost (тень при коллизии) ─────────────────────────────────────────────

  private createGhost(): void {
    if (this.ghost) return;

    const mesh = this.host.nativeElement as THREE.Mesh;
    if (!mesh.geometry) return;

    const geometry = mesh.geometry.clone();
    const material = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Добавляем рёбра для чёткости контура
    const edgesGeo = new THREE.EdgesGeometry(geometry);
    const edgesMat = new THREE.LineBasicMaterial({color: 0xff6666});
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);

    this.ghost = new THREE.Mesh(geometry, material);
    this.ghost.add(edges);
    this.ghost.userData['isGhost'] = true;
    this.ghost.visible = false;

    this.store().scene.add(this.ghost);
  }

  private showGhost(position: THREE.Vector3): void {
    if (!this.ghost) return;
    this.ghost.position.copy(position);
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

  // ── Утилиты ───────────────────────────────────────────────────────────────

  private toggleControls(enabled: boolean): void {
    const controls = this.store().controls;
    if (controls) {
      (controls as any).enabled = enabled;
    }
  }

  private calculateSize(): void {
    const objectSize = getObjectSize(this.host.nativeElement);
    const roomSize = this.configStore.roomParameters().size;
    this.size = {
      x: roomSize.x / 2 - objectSize.x / 2,
      y: roomSize.y - objectSize.y / 2,
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

  private findWallIntersection(): THREE.Vector3 | null {
    const scene = this.store().scene;
    if (!scene) return null;

    const intersects = this.raycaster.intersectObjects(scene.children);
    const wallHit = intersects.find(i =>
      !i.object.userData?.['isGhost'] &&
      (i.object.name?.toLowerCase().includes('wall') ||
        i.object.userData?.['type'] === 'wall')
    );
    return wallHit ? wallHit.point : null;
  }
}
