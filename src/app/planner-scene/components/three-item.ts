import {Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, ElementRef, inject, input, OnInit, signal, untracked, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {injectStore, NgtArgs, NgtThreeElement} from 'angular-three';
import {DraggableDirective} from '../directives/draggable.directive';
import {MeshSizeLine} from './size-lines';
import {ItemFocusService} from '../services/item-focus.service';
import {ConfigurationStore} from '../../store/store';
import {SurfaceService} from '../services/surface.service';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-three-item',
  standalone: true,
  imports: [NgtArgs, DraggableDirective, MeshSizeLine],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ngt-mesh
      #mesh
      draggableItem
      [position]="livePosition()"
      [rotation]="[0, itemRotationRad(), 0]"
      (dargging)="onDrag(mesh)"
      (focusChange)="onFocusChange($event)"
      (dragEndEvent)="onDragEnd(mesh)"
    >
      <ngt-box-geometry *args="itemSize()"/>
      <ngt-mesh-standard-material color="white" [transparent]="true"/>

      @if (parentMeshRef) {
        <app-mesh-size-lines [targetObject]="parentMeshRef" [meshPosition]="meshPosition()"/>
      }
    </ngt-mesh>
  `
})
export class ThreeItemComponent implements OnInit {
  @ViewChild('mesh') parentMeshRef!: ElementRef<THREE.Mesh>;

  itemId = input.required<number>();

  meshPosition = signal(new THREE.Vector3(0, 0, 0));

  // Позиция инициализируется один раз из store, потом управляется Three.js напрямую
  protected readonly livePosition = signal<[number, number, number]>([0, 250, 0]);

  private readonly itemFocusService = inject(ItemFocusService);
  private readonly configStore      = inject(ConfigurationStore);
  private readonly surfaceService   = inject(SurfaceService);
  private readonly messageService   = inject(MessageService);
  private readonly ngtStore         = injectStore();

  private readonly item              = computed(() => this.configStore.items().find(i => i.id === this.itemId()));
  protected readonly itemSize        = computed(() => this.item()?.size ?? [500, 500, 500]);
  protected readonly itemRotationRad = computed(() => ((this.item()?.rotation ?? 0) * Math.PI) / 180);

  ngOnInit(): void {
    // Читаем из store один раз — дальше Three.js управляет позицией
    const p = this.item()?.position ?? {x: 0, y: 250, z: 0};
    this.livePosition.set([p.x, p.y, p.z]);
  }

  constructor() {
    // Обработка запроса на поворот с проверкой коллизии
    effect(() => {
      const req = this.itemFocusService.rotationRequest();
      if (req === null || req.id !== this.itemId()) return;

      const mesh = this.parentMeshRef?.nativeElement;
      if (!mesh) return;

      const newRotationRad = (req.rotation * Math.PI) / 180;

      const roomSize = untracked(() => this.configStore.roomParameters().size);

      // Временно применяем новый поворот для проверки коллизии
      const prevRotY = mesh.rotation.y;
      mesh.rotation.y = newRotationRad;
      mesh.updateWorldMatrix(true, false);

      // Проверка коллизии с другими объектами
      const hasItemCollision = this.surfaceService.hasCollisionAt(mesh, mesh.position);

      // Проверка выхода за границы стен (по world AABB геометрии)
      mesh.geometry.computeBoundingBox();
      const worldBox = mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);
      const inBounds = worldBox.min.x >= -roomSize.x / 2 &&
                       worldBox.max.x <=  roomSize.x / 2 &&
                       worldBox.min.z >= -roomSize.z / 2 &&
                       worldBox.max.z <=  roomSize.z / 2;

      mesh.rotation.y = prevRotY;
      mesh.updateWorldMatrix(true, false);

      const hasCollision = hasItemCollision || !inBounds;

      untracked(() => {
        if (hasCollision) {
          this.itemFocusService.rotationResult.set('rejected');
          this.messageService.add({
            severity: 'warn',
            summary: 'Поворот невозможен',
            detail: 'Поворот невозможен, переместите и попробуйте снова',
            life: 3000,
          });
        } else {
          this.itemFocusService.rotationResult.set('approved');
          this.configStore.setItemRotation(req.id, req.rotation);
        }
        this.itemFocusService.rotationRequest.set(null);
      });
    });

    // Обработка запроса на копирование
    effect(() => {
      const req = this.itemFocusService.copyRequest();
      if (req === null || req !== this.itemId()) return;

      const mesh = this.parentMeshRef?.nativeElement;
      if (!mesh) return;

      const [w, , d] = untracked(() => this.itemSize());
      const roomSize = untracked(() => this.configStore.roomParameters().size);
      const pos = mesh.position;
      const stepX = w * 1.1;
      const stepZ = d * 1.1;

      // Границы комнаты с учётом половины размера объекта
      const minX = -roomSize.x / 2 + w / 2;
      const maxX =  roomSize.x / 2 - w / 2;
      const minZ = -roomSize.z / 2 + d / 2;
      const maxZ =  roomSize.z / 2 - d / 2;

      let freePos: THREE.Vector3 | null = null;
      outer: for (let ring = 1; ring <= 30 && !freePos; ring++) {
        for (let dx = -ring; dx <= ring; dx++) {
          for (let dz = -ring; dz <= ring; dz++) {
            if (Math.abs(dx) !== ring && Math.abs(dz) !== ring) continue;
            const cx = pos.x + dx * stepX;
            const cz = pos.z + dz * stepZ;
            if (cx < minX || cx > maxX || cz < minZ || cz > maxZ) continue;
            const c = new THREE.Vector3(cx, pos.y, cz);
            if (!this.surfaceService.hasCollisionAt(mesh, c)) {
              freePos = c;
              break outer;
            }
          }
        }
      }

      untracked(() => {
        if (!freePos) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Копирование невозможно',
            detail: 'Недостаточно пространства для копирования',
          });
        } else {
          this.configStore.copyItem(this.itemId(), {x: freePos.x, y: freePos.y, z: freePos.z});
        }
        this.itemFocusService.copyRequest.set(null);
      });
    });
  }

  public onDrag(mesh: NgtThreeElement<typeof THREE.Mesh>): void {
    this.meshPosition.set(new THREE.Vector3(...(mesh.position as any)));
    this.itemFocusService.setDragging(true);
    this.itemFocusService.updatePosition(this.getScreenPos());
  }

  public onFocusChange(focused: boolean): void {
    if (focused) {
      this.itemFocusService.setFocus(this.itemId(), this.getScreenPos());
    } else {
      this.itemFocusService.clearFocus();
    }
  }

  public onDragEnd(mesh: NgtThreeElement<typeof THREE.Mesh>): void {
    const {x, y, z} = mesh.position as any;
    // Сохраняем позицию в store для новых копий, но не обновляем livePosition
    // (mesh уже находится в нужной позиции — Three.js управляет ею напрямую)
    this.configStore.setItemPosition(this.itemId(), {x, y, z});
    this.itemFocusService.setDragging(false);
    this.itemFocusService.updatePosition(this.getScreenPos());
  }

  private getScreenPos(): {x: number; y: number} {
    const mesh = this.parentMeshRef?.nativeElement;
    const store = this.ngtStore();
    if (!mesh || !store) return {x: 0, y: 0};
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    worldPos.project(store.camera);
    const canvas = store.gl.domElement;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (worldPos.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-worldPos.y * 0.5 + 0.5) * rect.height + rect.top,
    };
  }
}
