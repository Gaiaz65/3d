import {afterNextRender, Component, computed, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, input, signal, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {NgtsLine, NgtsText} from 'angular-three-soba/abstractions';
import {beforeRender, injectStore} from 'angular-three';
import {ConfigurationStore} from '../../store/store';
import {ResolvedUnit} from '../interfaces/unit-config.models';
import {computeVisibleWorldBox} from '../utils/object.utils';

interface Bounds {
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
}

@Component({
  selector: 'app-unit-size-lines',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgtsLine, NgtsText],
  template: `
    <ngt-group #sizeLineGroup>
      @if (configStore.showSizeLines() && textReadable()) {
        @for (line of lines(); track $index) {
          @for (text of line.texts; track $index) {
            <ngts-text
              [text]="text.label"
              [options]="{
                position: text.position,
                rotation: text.rotation,
                fontSize: 0.1,
                outlineColor: 'black',
                color: 'black',
                font: 'assets/fonts/rubik/Rubik-VariableFont_wght.ttf',
                renderOrder: 1,
                depthOffset: -1
              }"/>
          }
          <ngts-line [points]="line.points" [options]="{ color: 'black', lineWidth: 1.5}"/>
        }
      }
    </ngt-group>
  `,
})
export class UnitSizeLines {
  @ViewChild('sizeLineGroup') sizeLineGroupRef?: ElementRef<THREE.Group>;

  public store = injectStore();
  public configStore: ConfigurationStore = inject(ConfigurationStore);

  /** ElementRef to the parent ngt-group (for world quaternion in text facing check). */
  public targetGroup = input.required<ElementRef<THREE.Group>>();
  /** Resolved unit — используется только для fallback-label если AABB ещё не готов. */
  public unit = input.required<ResolvedUnit>();
  public skipZAxis = input<boolean>(false);

  public sideLines = signal('topLeft');
  public textReadable = signal(true);

  private readonly _bounds = signal<Bounds | null>(null);

  private readonly linesConfig = computed(() => {
    const b = this._bounds();
    if (!b) return {};
    return this.buildLinesConfig(b);
  });

  public lines = computed(() => this.linesConfig()[this.sideLines()] ?? this.linesConfig()['topLeft']);

  private cameraDir = new THREE.Vector3();
  private textDir   = new THREE.Vector3();

  // 50 mm expressed in metres (group scale = 1000)
  private readonly offset = 0.05;

  constructor() {
    // Tag the wrapper group so DraggableGroupDirective excludes it from AABB
    afterNextRender(() => {
      if (this.sizeLineGroupRef?.nativeElement) {
        this.sizeLineGroupRef.nativeElement.userData['isSizeLine'] = true;
      }
    });

    beforeRender(() => {
      const group = this.targetGroup()?.nativeElement;
      if (!group) return;

      // Quadrant key (для выбора конфига линий)
      const pos = group.position;
      const key = (pos.z > 0 ? 'bottom' : 'top') + (pos.x > 0 ? 'Right' : 'Left');
      if (this.sideLines() !== key) this.sideLines.set(key);

      // Фактический AABB → локальное пространство группы
      const worldBox = computeVisibleWorldBox(group);
      if (worldBox.isEmpty()) return;

      // Конвертируем все 8 углов мирового AABB обратно в локальное пространство группы
      // (worldToLocal учитывает позицию, ротацию и масштаб группы)
      const localBox = new THREE.Box3();
      const wMin = worldBox.min, wMax = worldBox.max;
      for (const x of [wMin.x, wMax.x]) {
        for (const y of [wMin.y, wMax.y]) {
          for (const z of [wMin.z, wMax.z]) {
            localBox.expandByPoint(group.worldToLocal(new THREE.Vector3(x, y, z)));
          }
        }
      }

      const b: Bounds = {
        minX: localBox.min.x, maxX: localBox.max.x,
        minY: localBox.min.y, maxY: localBox.max.y,
        minZ: localBox.min.z, maxZ: localBox.max.z,
      };

      // Обновляем только при реальном изменении
      const prev = this._bounds();
      if (!prev ||
          Math.abs(prev.minX - b.minX) > 1e-6 || Math.abs(prev.maxX - b.maxX) > 1e-6 ||
          Math.abs(prev.minY - b.minY) > 1e-6 || Math.abs(prev.maxY - b.maxY) > 1e-6 ||
          Math.abs(prev.minZ - b.minZ) > 1e-6 || Math.abs(prev.maxZ - b.maxZ) > 1e-6) {
        this._bounds.set(b);
      }

      // Видимость текста
      const lines = this.lines();
      if (!lines?.length) return;
      const rotation = lines[0].texts?.[0]?.rotation;
      if (!rotation) return;
      const visible = this.isTextFacingCamera(rotation);
      if (this.textReadable() !== visible) this.textReadable.set(visible);
    });
  }

  private isTextFacingCamera(rotation: number[]): boolean {
    const camera = this.store.camera();
    if (!camera) return true;

    camera.getWorldDirection(this.cameraDir);
    this.textDir.set(0, 0, 1).applyEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2]));

    const parent = this.targetGroup()?.nativeElement as THREE.Object3D | undefined;
    if (parent) {
      const q = new THREE.Quaternion();
      parent.getWorldQuaternion(q);
      this.textDir.applyQuaternion(q);
    }
    return this.textDir.dot(this.cameraDir) < 0;
  }

  private buildLinesConfig(b: Bounds): Record<string, any> {
    const { minX, maxX, minY, maxY, minZ, maxZ } = b;

    const frontZ  = maxZ;
    const backZ   = minZ;
    const centerZ = (minZ + maxZ) / 2;
    const centerY = (minY + maxY) / 2;

    const labelW = this.mm(maxX - minX);
    const labelH = this.mm(maxY - minY);
    const labelD = this.mm(maxZ - minZ);

    const o   = this.offset;
    const ho  = o / 2;
    const do2 = o * 2;

    // ── topLeft  (world: x<0, z<0) ──────────────────────────────────────────
    const topLeft = [{
      texts: [
        { label: labelW, rotation: [0, 0, 0],           position: [0,          maxY + do2, backZ + ho] },
        { label: labelH, rotation: [0, 0, Math.PI / 2], position: [maxX + do2, centerY,    backZ + ho] },
      ],
      points: [
        // Y (right side, back face)
        [maxX,      ho,   backZ], [maxX + do2, ho,   backZ],
        [maxX + o,  ho,   backZ], [maxX + o,   maxY, backZ],
        [maxX + do2, maxY, backZ], [maxX, maxY, backZ],
        // X (top, back face)
        [maxX, maxY + do2, backZ], [maxX, maxY + o, backZ],
        [minX, maxY + o,   backZ],
        [minX, maxY + do2, backZ], [minX, maxY,     backZ],
      ],
    }];

    // ── topRight  (world: x>0, z<0) ─────────────────────────────────────────
    const topRight = [{
      texts: [
        { label: labelW, rotation: [0, 0, 0],            position: [0,          maxY + do2, backZ + ho] },
        { label: labelH, rotation: [0, 0, Math.PI / 2],  position: [minX - do2, centerY,    backZ + ho] },
      ],
      points: [
        // Y (left side, back face)
        [minX,      ho,   backZ], [minX - do2, ho,   backZ],
        [minX - o,  ho,   backZ], [minX - o,   maxY, backZ],
        [minX - do2, maxY, backZ], [minX, maxY, backZ],
        // X (top, back face)
        [minX, maxY + do2, backZ], [minX, maxY + o, backZ],
        [maxX, maxY + o,   backZ],
        [maxX, maxY + do2, backZ], [maxX, maxY,     backZ],
      ],
    }];

    // ── bottomRight  (world: x>0, z>0) ──────────────────────────────────────
    const bottomRight = [{
      texts: [
        { label: labelW, rotation: [0, Math.PI, 0],           position: [0,          maxY + do2, backZ - ho] },
        { label: labelH, rotation: [0, Math.PI, Math.PI / 2], position: [minX - do2, centerY,    backZ - ho] },
      ],
      points: [
        // Y (left side, back face)
        [minX,      ho,   backZ], [minX - do2, ho,   backZ],
        [minX - o,  ho,   backZ], [minX - o,   maxY, backZ],
        [minX - do2, maxY, backZ], [minX, maxY, backZ],
        // X (top, back face)
        [minX, maxY + do2, backZ], [minX, maxY + o, backZ],
        [maxX, maxY + o,   backZ],
        [maxX, maxY + do2, backZ], [maxX, maxY,     backZ],
      ],
    }];

    // ── bottomLeft  (world: x<0, z>0) ───────────────────────────────────────
    const bottomLeft = [{
      texts: [
        { label: labelW, rotation: [0, Math.PI, 0],           position: [0,          maxY + do2, backZ - ho] },
        { label: labelH, rotation: [0, Math.PI, Math.PI / 2], position: [maxX + do2, centerY,    backZ - ho] },
      ],
      points: [
        // Y (right side, back face)
        [maxX,      ho,   backZ], [maxX + do2, ho,   backZ],
        [maxX + o,  ho,   backZ], [maxX + o,   maxY, backZ],
        [maxX + do2, maxY, backZ], [maxX, maxY, backZ],
        // X (top, back face)
        [maxX, maxY + do2, backZ], [maxX, maxY + o, backZ],
        [minX, maxY + o,   backZ],
        [minX, maxY + do2, backZ], [minX, maxY,     backZ],
      ],
    }];

    if (!this.skipZAxis()) {
      bottomLeft[0].texts.push({ label: labelD, rotation: [0, Math.PI / 2, 0],       position: [minX + ho,  maxY + do2, centerZ   ] });
      bottomLeft[0].points.push(
        [minX, maxY + do2, backZ],  [minX, maxY + o, backZ],
        [minX, maxY + o,   frontZ],
        [minX, maxY + do2, frontZ], [minX, maxY,     frontZ]);

      bottomRight[0].texts.push({ label: labelD, rotation: [0, -Math.PI / 2, 0],      position: [maxX - ho,  maxY + do2, centerZ   ] });
      bottomRight[0].points.push(
        [maxX, maxY + do2, backZ],  [maxX, maxY + o, backZ],
        [maxX, maxY + o,   frontZ],
        [maxX, maxY + do2, frontZ], [maxX, maxY,     frontZ],
      );

      topLeft[0].texts.push({ label: labelD, rotation: [0, Math.PI / 2, 0], position: [minX + ho,  maxY + do2, centerZ   ] });
      topLeft[0].points.push(
        [minX, maxY + do2, backZ],  [minX, maxY + o, backZ],
        [minX, maxY + o,   frontZ],
        [minX, maxY + do2, frontZ], [minX, maxY,     frontZ],
      );

      topRight[0].texts.push({ label: labelD, rotation: [0, -Math.PI / 2, 0], position: [maxX - ho,  maxY + do2, centerZ   ] });
      topRight[0].points.push(
        [maxX, maxY + do2, backZ],  [maxX, maxY + o, backZ],
        [maxX, maxY + o,   frontZ],
        [maxX, maxY + do2, frontZ], [maxX, maxY,     frontZ],
      );
    }

    return { topLeft, topRight, bottomRight, bottomLeft };
  }

  /** Converts metres → mm string for display. */
  private mm(value: number): string {
    return Math.round(value * 1000).toString();
  }
}
