import {afterNextRender, Component, computed, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, input, OnInit, signal, ViewChild, WritableSignal} from '@angular/core';
import * as THREE from 'three';
import {NgtsLine, NgtsText} from 'angular-three-soba/abstractions';
import {beforeRender, injectStore} from 'angular-three';
import {ConfigurationStore} from '../../store/store';
import {ResolvedUnit} from '../interfaces/unit-config.models';

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
          <ngts-line [points]="line.points" [options]="{ color: 'black', lineWidth: 1.5, depthTest: true }"/>
        }
      }
    </ngt-group>
  `,
})
export class UnitSizeLines implements OnInit {
  @ViewChild('sizeLineGroup') sizeLineGroupRef?: ElementRef<THREE.Group>;

  public store = injectStore();
  public configStore: ConfigurationStore = inject(ConfigurationStore);

  /** ElementRef to the parent ngt-group (for world quaternion in text facing check). */
  public targetGroup = input.required<ElementRef<THREE.Group>>();
  /** Resolved unit — provides outer dimensions in metres. */
  public unit = input.required<ResolvedUnit>();

  public sideLines: WritableSignal<string> = signal('topLeft');
  public textReadable: WritableSignal<boolean> = signal(true);

  // Signal so `lines` computed reacts when ngOnInit populates the config
  private linesConfig = signal<Record<string, any>>({});
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

      // Determine which quadrant the unit is in (group is a direct scene child → position = world pos)
      const pos = group.position;
      const key = (pos.z > 0 ? 'bottom' : 'top') + (pos.x > 0 ? 'Right' : 'Left');
      if (this.sideLines() !== key) this.sideLines.set(key);

      // Hide text when facing away from camera
      const lines = this.lines();
      if (!lines?.length) return;
      const rotation = lines[0].texts?.[0]?.rotation;
      if (!rotation) return;
      const visible = this.isTextFacingCamera(rotation);
      if (this.textReadable() !== visible) this.textReadable.set(visible);
    });
  }

  ngOnInit(): void {
    this.linesConfig.set(this.buildLinesConfig());
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

  private buildLinesConfig(): Record<string, any> {
    const s  = this.unit().size;       // outer spec dimensions (metres)
    const cs = this.unit().corpusSize; // actual corpus box (metres)

    // Geometry convention (UnitBuilderService):
    //   X: centred       → -s.x/2 … +s.x/2
    //   Y: floor-aligned → 0 (floor) … s.y (top, includes legs)
    //   Z: front-aligned → 0 (corpus front face) … -cs.z (corpus back panel)
    //
    // size.z (spec depth, e.g. 600mm) ≠ cs.z (corpus depth, e.g. 478mm):
    // size.z includes installation allowance; lines use cs.z to match visible geometry.
    const minX   = -s.x / 2, maxX = s.x / 2;
    const maxY   = s.y;
    const frontZ = 0;         // corpus front face
    const backZ  = -cs.z;    // corpus back panel (actual geometry end)
    const centerZ = -cs.z / 2;
    const centerY  = maxY / 2;

    const o   = this.offset;
    const ho  = o / 2;  // half offset
    const do2 = o * 2;  // double offset

    // All configs draw Y & X dimension lines on the BACK face (backZ),
    // as requested: "по задней стенке z".
    // The Z dimension line runs from backZ → frontZ showing corpus depth.

    // ── topLeft  (world: x<0, z<0) ──────────────────────────────────────────
    const topLeft = [{
      texts: [
        { label: this.mm(s.x),  rotation: [0, 0, 0],           position: [0,          maxY + do2, backZ + ho] },
        { label: this.mm(s.y),  rotation: [0, 0, Math.PI / 2], position: [maxX + do2, centerY,    backZ + ho] },
        { label: this.mm(cs.z), rotation: [0, Math.PI / 2, 0], position: [minX + ho,  maxY + do2, centerZ   ] },
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
        // Z (top-left corner, back → front)
        [minX, maxY + do2, backZ],  [minX, maxY + o, backZ],
        [minX, maxY + o,   frontZ],
        [minX, maxY + do2, frontZ], [minX, maxY,     frontZ],
      ],
    }];

    // ── topRight  (world: x>0, z<0) ─────────────────────────────────────────
    const topRight = [{
      texts: [
        { label: this.mm(s.x),  rotation: [0, 0, 0],            position: [0,          maxY + do2, backZ + ho] },
        { label: this.mm(s.y),  rotation: [0, 0, Math.PI / 2],  position: [minX - do2, centerY,    backZ + ho] },
        { label: this.mm(cs.z), rotation: [0, -Math.PI / 2, 0], position: [maxX - ho,  maxY + do2, centerZ   ] },
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
        // Z (top-right corner, back → front)
        [maxX, maxY + do2, backZ],  [maxX, maxY + o, backZ],
        [maxX, maxY + o,   frontZ],
        [maxX, maxY + do2, frontZ], [maxX, maxY,     frontZ],
      ],
    }];

    // ── bottomRight  (world: x>0, z>0) ──────────────────────────────────────
    const bottomRight = [{
      texts: [
        { label: this.mm(s.x),  rotation: [0, Math.PI, 0],           position: [0,          maxY + do2, backZ - ho] },
        { label: this.mm(s.y),  rotation: [0, Math.PI, Math.PI / 2], position: [minX - do2, centerY,    backZ - ho] },
        { label: this.mm(cs.z), rotation: [0, -Math.PI / 2, 0],      position: [maxX - ho,  maxY + do2, centerZ   ] },
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
        // Z (top-right corner, back → front)
        [maxX, maxY + do2, backZ],  [maxX, maxY + o, backZ],
        [maxX, maxY + o,   frontZ],
        [maxX, maxY + do2, frontZ], [maxX, maxY,     frontZ],
      ],
    }];

    // ── bottomLeft  (world: x<0, z>0) ───────────────────────────────────────
    const bottomLeft = [{
      texts: [
        { label: this.mm(s.x),  rotation: [0, Math.PI, 0],           position: [0,          maxY + do2, backZ - ho] },
        { label: this.mm(s.y),  rotation: [0, Math.PI, Math.PI / 2], position: [maxX + do2, centerY,    backZ - ho] },
        { label: this.mm(cs.z), rotation: [0, Math.PI / 2, 0],       position: [minX + ho,  maxY + do2, centerZ   ] },
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
        // Z (top-left corner, back → front)
        [minX, maxY + do2, backZ],  [minX, maxY + o, backZ],
        [minX, maxY + o,   frontZ],
        [minX, maxY + do2, frontZ], [minX, maxY,     frontZ],
      ],
    }];

    return { topLeft, topRight, bottomRight, bottomLeft };
  }

  /** Converts metres → mm string for display. */
  private mm(value: number): string {
    return Math.round(value * 1000).toString();
  }
}
