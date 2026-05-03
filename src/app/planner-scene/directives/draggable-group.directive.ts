import {Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnDestroy, OnInit, Output, signal} from '@angular/core';
import * as THREE from 'three';
import {injectStore} from 'angular-three';
import {fromEvent, Subject, takeUntil} from 'rxjs';
import {ConfigurationStore} from '../../store/store';
import {SurfaceService} from '../services/surface.service';
import {DragGhostService} from '../services/drag-ghost.service';
import {computeVisibleWorldBox} from '../utils/object.utils';
import {DragSelectionBox} from '../helpers/drag-selection-box';
import {DragWallSnap, RoomBounds} from '../helpers/drag-wall-snap';

@Directive({
  selector: '[draggableGroup]',
  standalone: true,
  providers: [DragGhostService],
})
export class DraggableGroupDirective implements OnInit, OnDestroy {
  @Input() public dragLevel: string = 'bottom';
  @Input() public countInvisibleUnits: boolean = false;
  @Output() public dragging       = new EventEmitter<void>();
  @Output() public dragEndEvent   = new EventEmitter<void>();
  @Output() public focusChange    = new EventEmitter<boolean>();
  @Output() public rotationChange = new EventEmitter<number>();

  public focused = signal(false);

  private readonly host          = inject<ElementRef<THREE.Group>>(ElementRef);
  private readonly store         = injectStore();
  private readonly configStore   = inject(ConfigurationStore);
  private readonly ngZone        = inject(NgZone);
  private readonly surfaceService = inject(SurfaceService);
  private readonly ghostService  = inject(DragGhostService);

  private readonly draggableObject: THREE.Group;
  private readonly selectionBox: DragSelectionBox;
  private readonly wallSnap = new DragWallSnap();

  private readonly destroy$     = new Subject<void>();
  private readonly dragDestroy$ = new Subject<void>();

  private isDragging  = false;
  private dragPlane   = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private dragOffset  = new THREE.Vector3();
  private raycaster   = new THREE.Raycaster();
  private mouse       = new THREE.Vector2();

  private lastValidPosition = new THREE.Vector3();
  private aabbOffset        = new THREE.Vector3();
  private objectHalfSize    = new THREE.Vector3();
  private roomBounds: RoomBounds = {minX: 0, maxX: 0, minZ: 0, maxZ: 0};
  private size  = {x: 0, y: 0, z: 0};
  private minY  = 0;

  constructor() {
    this.draggableObject = this.host.nativeElement;
    this.selectionBox    = new DragSelectionBox(this.draggableObject);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (!this.draggableObject) return;

    this.surfaceService.registerItem(this.draggableObject);

    this.surfaceService.focusChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(focused => {
        if (focused !== this.draggableObject && this.focused()) this.unfocusSilently();
      });

    this.ngZone.runOutsideAngular(() => {
      const canvas = this.store().gl?.domElement;
      if (!canvas) return;
      fromEvent(canvas, 'mousedown')
        .pipe(takeUntil(this.destroy$))
        .subscribe(e => this.handleMouseDown(e as MouseEvent));
    });
  }

  ngOnDestroy(): void {
    this.ghostService.remove();
    this.selectionBox.remove();
    this.surfaceService.unregisterItem(this.draggableObject);
    this.destroy$.next();
    this.destroy$.complete();
    this.dragDestroy$.next();
    this.dragDestroy$.complete();
  }

  // ── Focus / selection ──────────────────────────────────────────────────────

  private handleMouseDown(event: MouseEvent): void {
    const camera = this.store().camera;
    if (!camera) return;

    this.normalizeMouseCoords(event);
    this.raycaster.setFromCamera(this.mouse, camera);

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
      this.selectionBox.create(this.countInvisibleUnits);
      this.ngZone.run(() => { this.focused.set(true); this.focusChange.emit(true); });
    } else {
      this.unfocusSilently();
    }
  }

  private unfocusSilently(): void {
    this.selectionBox.remove();
    this.toggleControls(true);
    this.ngZone.run(() => { this.focused.set(false); this.focusChange.emit(false); });
  }

  // ── Drag ──────────────────────────────────────────────────────────────────

  private startDrag(_event: MouseEvent, hit: THREE.Intersection): void {
    this.isDragging = true;
    this.toggleControls(false);
    this.lastValidPosition.copy(this.draggableObject.position);
    this.dragOffset.copy(this.draggableObject.position).sub(hit.point);
    this.updateDragPlane();
    this.refreshAabb();
    this.ghostService.create(this.getWorldSize());

    const {x, z} = this.configStore.roomParameters().size;
    this.roomBounds = {minX: -x / 2, maxX: x / 2, minZ: -z / 2, maxZ: z / 2};

    this.dragDestroy$.next();
    const canvas = this.store().gl?.domElement;
    if (!canvas) return;

    fromEvent(canvas, 'mousemove')
      .pipe(takeUntil(this.dragDestroy$))
      .subscribe(e => this.onMouseMove(e as MouseEvent));

    fromEvent(canvas, 'mouseup')
      .pipe(takeUntil(this.dragDestroy$))
      .subscribe(() => this.onMouseUp());
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const camera = this.store().camera;
    if (!camera) return;

    this.normalizeMouseCoords(event);
    this.raycaster.setFromCamera(this.mouse, camera);
    const intersection = new THREE.Vector3();

    if (Math.abs(this.raycaster.ray.direction.dot(this.dragPlane.normal)) < 0.05) {
      this.updateDragPlane();
    }

    if (!this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) return;

    const raw      = intersection.clone().add(this.dragOffset);
    const wallPoint = this.findWallIntersection();

    let x = wallPoint ? wallPoint.x : raw.x;
    let y = wallPoint ? wallPoint.y : this.draggableObject.position.y;
    let z = wallPoint ? wallPoint.z : raw.z;

    const maxX = this.size.x - this.aabbOffset.x;
    const minX = -this.size.x - this.aabbOffset.x;
    const maxZ = this.size.z - this.aabbOffset.z;
    const minZ = -this.size.z - this.aabbOffset.z;
    x = Math.max(minX, Math.min(maxX, x));
    z = Math.max(minZ, Math.min(maxZ, z));

    if (this.dragLevel === 'bottom') {
      y = 0;
    } else {
      y = Math.max(this.minY, Math.min(this.size.y, y));
    }

    const clamped = new THREE.Vector3(x, y, z);

    if (this.surfaceService.hasCollisionAt(this.draggableObject, clamped)) {
      this.ghostService.show(clamped, this.aabbOffset);
    } else {
      this.draggableObject.position.copy(clamped);
      this.lastValidPosition.copy(clamped);
      this.ghostService.hide();
    }

    this.checkWallSnap(clamped);
    this.checkObjectProximity(clamped);

    this.store().invalidate();
    this.dragging.emit();
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.ghostService.remove();
    this.toggleControls(true);
    this.store().invalidate();
    this.dragEndEvent.emit();
    this.dragDestroy$.next();
  }

  // ── Wall snap ─────────────────────────────────────────────────────────────

  private checkWallSnap(position: THREE.Vector3): void {
    const snap = this.wallSnap.check(position, this.aabbOffset, this.objectHalfSize, this.roomBounds);
    if (!snap || this.surfaceService.hasCollisionAt(this.draggableObject, position)) return;
    this.applyRotationWithReclamp(snap.rotY, position);
  }

  private applyRotationWithReclamp(rotY: number, position: THREE.Vector3): void {
    if (this.draggableObject.rotation.y === rotY) return;

    this.draggableObject.rotation.y = rotY;
    this.draggableObject.updateWorldMatrix(true, true);

    this.refreshAabb();

    const maxX = this.size.x - this.aabbOffset.x;
    const minX = -this.size.x - this.aabbOffset.x;
    const maxZ = this.size.z - this.aabbOffset.z;
    const minZ = -this.size.z - this.aabbOffset.z;
    position.x = Math.max(minX, Math.min(maxX, position.x));
    position.z = Math.max(minZ, Math.min(maxZ, position.z));
    this.draggableObject.position.copy(position);
    this.lastValidPosition.copy(position);

    this.ghostService.remove();
    this.ghostService.create(this.getWorldSize());

    this.ngZone.run(() => this.rotationChange.emit(rotY));
  }

  private checkObjectProximity(position: THREE.Vector3): void {
    const delta = this.surfaceService.getSnapDelta(this.draggableObject, position, 100);
    if (!delta || this.surfaceService.hasCollisionAt(this.draggableObject, position)) return;
    position.add(delta);
    this.draggableObject.position.copy(position);
    this.lastValidPosition.copy(position);
    this.ghostService.hide();
  }

  // ── AABB helpers ──────────────────────────────────────────────────────────

  private refreshAabb(): void {
    const worldBox = computeVisibleWorldBox(this.draggableObject, this.countInvisibleUnits);
    const worldSize = worldBox.getSize(new THREE.Vector3());
    const worldCenter = worldBox.getCenter(new THREE.Vector3());

    this.aabbOffset.copy(worldCenter).sub(this.draggableObject.position);
    this.objectHalfSize.copy(worldSize).multiplyScalar(0.5);

    const roomSize = this.configStore.roomParameters().size;
    this.minY  = worldSize.y / 2 - this.aabbOffset.y;
    this.size  = {
      x: roomSize.x / 2 - worldSize.x / 2,
      y: roomSize.y - this.aabbOffset.y - worldSize.y / 2,
      z: roomSize.z / 2 - worldSize.z / 2,
    };
  }

  private getWorldSize(): THREE.Vector3 {
    return computeVisibleWorldBox(this.draggableObject, this.countInvisibleUnits)
      .getSize(new THREE.Vector3());
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  private toggleControls(enabled: boolean): void {
    const controls = this.store().controls;
    if (controls) (controls as any).enabled = enabled;
  }

  private updateDragPlane(): void {
    const cameraDir = new THREE.Vector3();
    this.store().camera.getWorldDirection(cameraDir);
    if (Math.abs(cameraDir.y) < 0.1) {
      const normal = new THREE.Vector3(cameraDir.x, 0, cameraDir.z).normalize().negate();
      this.dragPlane.setFromNormalAndCoplanarPoint(normal, this.draggableObject.position);
    } else {
      this.dragPlane.set(new THREE.Vector3(0, 1, 0), -this.draggableObject.position.y);
    }
  }

  private normalizeMouseCoords(event: MouseEvent): void {
    const canvas = this.store().gl?.domElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    this.mouse.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;
  }

  private findWallIntersection(): THREE.Vector3 | null {
    const scene = this.store().scene;
    if (!scene) return null;
    const hit = this.raycaster.intersectObjects(scene.children).find(i =>
      !i.object.userData['isGhost'] &&
      (i.object.name?.toLowerCase().includes('wall') || i.object.userData['type'] === 'wall'),
    );
    return hit ? hit.point : null;
  }
}
