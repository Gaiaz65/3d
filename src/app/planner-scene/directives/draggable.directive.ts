import {Directive, OnInit, OnDestroy, inject, NgZone, ElementRef, EventEmitter, Output, Input} from '@angular/core';
import * as THREE from 'three';
import {injectStore} from 'angular-three';
import {filter, fromEvent, Subject, takeUntil} from 'rxjs';
import {ConfigurationStore} from '../../store/store';
import {getObjectSize} from '../utils/object.utils';

@Directive({
  selector: '[draggableItem]',
  standalone: true
})
export class DraggableDirective implements OnInit, OnDestroy {
  @Output() dargging: EventEmitter<any> = new EventEmitter();
  @Output() dragEndEvent: EventEmitter<any> = new EventEmitter();
  @Input() readyToDrag: boolean = false;
  private host = inject<ElementRef<THREE.Mesh>>(ElementRef);
  private store = injectStore();
  private configStore = inject(ConfigurationStore);
  private ngZone = inject(NgZone);
  private destroy$ = new Subject<void>();
  private draggableObject: THREE.Object3D;

  private isDragging = false;
  private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private dragOffset = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private size = {
    x: 0,
    y: 0,
    z: 0,
  }

  private dragDestroy$ = new Subject<void>();

  constructor() {
    this.draggableObject = this.host.nativeElement;
  }

  ngOnInit() {
    if (!this.draggableObject) return;

    this.ngZone.runOutsideAngular(() => {
      const canvas = this.store().gl?.domElement;
      if (!canvas) return;

      // Подписываемся на mousedown один раз
      fromEvent(canvas, 'mousedown')
        .pipe(
          takeUntil(this.destroy$),
          filter(() => this.readyToDrag)
        )
        .subscribe((e) => {
            this.onMouseDown(e as MouseEvent);
        });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.dragDestroy$.next();
    this.dragDestroy$.complete();
  }

  private onMouseDown(event: MouseEvent) {
    if (!this.draggableObject) return;

    const camera = this.store().camera;
    const scene = this.store().scene;
    if (!camera || !scene) return;
    this.calculateSize();
    this.normalizeMouseCoordinates(event);

    // Проверяем, кликнули ли по нашему объекту
    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObject(this.draggableObject, true);

    if (intersects.length === 0) return;

    // Останавливаем всплытие события
    event.stopPropagation();

    // Начинаем перетаскивание
    this.isDragging = true;
    this.dragOffset.copy(this.draggableObject.position).sub(intersects[0].point);

    this.toggleControls(false);

    // Сбрасываем предыдущие подписки на drag
    this.dragDestroy$.next();

    // Подписываемся на движение мыши и отпускание
    const canvas = this.store().gl?.domElement;
    if (!canvas) return;

    // Используем новый dragDestroy$ для этих подписок
    fromEvent(canvas, 'mousemove')
      .pipe(takeUntil(this.dragDestroy$))
      .subscribe((e) => this.onMouseMove(e as MouseEvent));

    fromEvent(canvas, 'mouseup')
      .pipe(takeUntil(this.dragDestroy$))
      .subscribe(() => this.onMouseUp());
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isDragging || !this.draggableObject) return;

    const camera = this.store().camera;
    if (!camera) return;

    // Обновляем координаты мыши
    const canvas = this.store().gl?.domElement;
    if (!canvas) return;

    this.normalizeMouseCoordinates(event);
    // Находим точку на плоскости
    this.raycaster.setFromCamera(this.mouse, camera);
    const intersection = new THREE.Vector3();

    if (this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) {
      // Двигаем объект
      const positionClone = intersection.clone().add(this.dragOffset);
      const wallPoints = this.defineWallCursor(event);
      const objectSize = getObjectSize(this.host.nativeElement);

      let y;
      let x;
      let z;


      y = wallPoints ? wallPoints.y : this.draggableObject.position.y || objectSize.y / 2;
      x = wallPoints ? wallPoints.x : positionClone.x;
      z = wallPoints ? wallPoints.z : positionClone.z;

      if (x > 0 && x > this.size.x) {
        x = this.size.x;
      } else if (x < 0 && x < -this.size.x) {
        x = -this.size.x;
      }

      if (z > 0 && z > this.size.z) {
        z = this.size.z;
      } else if (z < 0 && z < -this.size.z) {
        z = -this.size.z;
      }

      if (y > 0 && y > this.size.y) {
        y = this.size.y;
      } else if (y < objectSize.y / 2) {
        y = objectSize.y / 2;
      }


      const newPosition = new THREE.Vector3(x, y, z);
      this.draggableObject.position.copy(newPosition);
      this.dargging.emit();
    }
  }

  private onMouseUp() {
    this.isDragging = false;
    this.toggleControls(true);
    this.dragEndEvent.emit();
    // Завершаем подписки на drag
    this.dragDestroy$.next();
  }

  private toggleControls(flag: boolean) {
    // const controls = this.store().controls;
    // if (controls) {
    //   (controls as any).enabled = flag;
    // }
  }

  private calculateSize(): void {
    const objectSize = getObjectSize(this.host.nativeElement);

    const roomSize = this.configStore.roomParameters().size;
    this.size = {
      x: (roomSize.x / 2) - (objectSize.x / 2),
      y: roomSize.y - (objectSize.y / 2),
      z: (roomSize.z / 2) - (objectSize.z / 2)
    }
  }

  private normalizeMouseCoordinates(event: MouseEvent): void {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Получить Y координату стены под курсором
   */
  public defineWallCursor(event: MouseEvent): any {
    const camera = this.store().camera;
    const scene = this.store().scene;

    // Пускаем луч
    this.raycaster.setFromCamera(this.mouse, camera);

    // Ищем все объекты
    const intersects = this.raycaster.intersectObjects(scene.children);

    // Фильтруем только стены (по имени или userData)

    const wallIntersects = intersects.filter(i =>
      i.object.name?.toLowerCase().includes('wall') ||
      i.object.userData?.['type'] === 'wall'
    );

    if (wallIntersects.length > 0) {
      return wallIntersects[0].point;
    } else {
      return null;
    }
  }
}
