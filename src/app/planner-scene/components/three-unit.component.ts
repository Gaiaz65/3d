import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef, inject,
  input,
  output,
  ViewChild,
} from '@angular/core';
import {loaderResource, NgtArgs, NgtThreeEvent} from 'angular-three';
import {ResolvedFacade, ResolvedPlinth, ResolvedTabletop, ResolvedUnit, Vec3} from '../interfaces/unit-config.models';
import {DraggableGroupDirective} from '../directives/draggable-group.directive';
import {UnitSizeLines} from './unit-size-lines';
import * as THREE from 'three';
import {ConfigurationStore} from '../../store/store';
import {TextureLoader} from 'three';

/**
 * ThreeUnitComponent
 *
 * Renders a fully resolved unit (panels + facades + legs + shelves + rods)
 * produced by UnitBuilderService.
 *
 * All geometry is driven by ResolvedUnit — this component has zero
 * knowledge of expressions or catalog configs.
 */
@Component({
  selector: 'app-three-unit',
  standalone: true,
  imports: [NgtArgs, DraggableGroupDirective, UnitSizeLines],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ngt-group
      #group
      draggableGroup
      [dragLevel]="unit().level"
      [position]="[position().x, position().y, position().z]"
      [rotation]="[0, rotation(), 0]"
      [scale]="[1000,1000,1000]">
      <!-- ── Corpus panels ───────────────────────────────────────────── -->
      @for (panel of unit().panels; track panel.name) {
        <ngt-mesh
          [position]="[panel.position.x, panel.position.y, panel.position.z]"
          [castShadow]="true"
          [receiveShadow]="true"
        >
          <ngt-box-geometry *args="[panel.size.x, panel.size.y, panel.size.z]"/>
          <ngt-mesh-standard-material
            [color]="corpusColor()"
            [map]="corpusTexture.value()"
            [roughness]="0.65"
            [metalness]="0.05"
            [emissive]="corpusEmissiveColor()"
            [emissiveIntensity]="isSelected() ? 0.15 : 0"
          />
        </ngt-mesh>
      }

      <!-- ── Facades ────────────────────────────────────────────────── -->
      @for (facade of unit().facades; track $index) {
        <ngt-mesh
          [position]="[facade.position.x, facade.position.y, facade.position.z]"
          [castShadow]="true"
          (click)="onFacadeClick($event, $index)"
          (pointerover)="onPointerOver($event)"
          (pointerout)="onPointerOut()"
        >
          <ngt-box-geometry *args="[facade.size.x, facade.size.y, facade.size.z]"/>
          <ngt-mesh-standard-material
            [color]="facadeColor()"
            [roughness]="0.28"
            [metalness]="0.04"
          />
        </ngt-mesh>

        <!-- Handle (only when assigned) -->
        @if (facade.handle; as h) {
          <ngt-mesh
            [position]="[h.position.x, h.position.y, h.position.z]"
            [rotation]="handleRotation(h)"
          >
            <ngt-box-geometry *args="[h.size.x, h.size.y, h.size.z]"/>
            <ngt-mesh-standard-material
              [color]="'#c0c0c0'"
              [roughness]="0.2"
              [metalness]="0.8"
            />
          </ngt-mesh>
        }
      }

      <!-- ── Legs ───────────────────────────────────────────────────── -->
      @for (leg of unit().legs; track $index) {
        <ngt-mesh [position]="[leg.position.x, leg.position.y, leg.position.z]">
          <ngt-cylinder-geometry *args="[leg.radius, leg.radius, leg.height, 12]"/>
          <ngt-mesh-standard-material
            [color]="'#a8a8a8'"
            [roughness]="0.3"
            [metalness]="0.7"
          />
        </ngt-mesh>
      }

      <!-- ── Shelves ─────────────────────────────────────────────────── -->
      @for (shelf of unit().shelves; track $index) {
        <ngt-mesh [position]="[shelf.position.x, shelf.position.y, shelf.position.z]">
          <ngt-box-geometry *args="[shelf.size.x, shelf.size.y, shelf.size.z]"/>
          <ngt-mesh-standard-material [color]="corpusColor()" [roughness]="0.65"/>
        </ngt-mesh>
      }

      <!-- ── Rods ───────────────────────────────────────────────────── -->
      @for (rod of unit().rods; track $index) {
        <ngt-mesh
          [position]="[rod.position.x, rod.position.y, rod.position.z]"
          [rotation]="[0, 0, Math.PI / 2]"
        >
          <ngt-cylinder-geometry *args="[rod.radius, rod.radius, rod.length, 8]"/>
          <ngt-mesh-standard-material [color]="'#b0b0b0'" [roughness]="0.2" [metalness]="0.9"/>
        </ngt-mesh>
      }

      <!-- ── Plinths ─────────────────────────────────────────────────── -->
      @for (plinth of unit().plinths; track $index) {
        <ngt-mesh
          [position]="[plinth.position.x, plinth.position.y, plinth.position.z]"
          [rotation]="plinthRotation(plinth)"
        >
          <ngt-box-geometry *args="[plinth.size.x, plinth.size.y, plinth.size.z]"/>
          <ngt-mesh-standard-material
            [color]="corpusColor()"
            [roughness]="0.8"
            [metalness]="0.0"
          />
        </ngt-mesh>
      }

      <!-- ── Tabletops ───────────────────────────────────────────────── -->
      @for (top of (unit().tabletops ?? []); track $index) {
        <ngt-mesh
          [position]="[top.position.x, top.position.y, top.position.z]"
          [rotation]="tabletopRotation(top)"
          [castShadow]="true"
          [receiveShadow]="true"
        >
          <ngt-box-geometry *args="[top.size.x, top.size.y, top.size.z]"/>
          <ngt-mesh-standard-material
            [color]="'#c8b89a'"
            [roughness]="0.4"
            [metalness]="0.05"
          />
        </ngt-mesh>
      }

      <!-- Selection outline (invisible hit box for entire unit) -->
      <ngt-mesh
        [visible]="false"
        (click)="onUnitClick($event)"
      >
        <ngt-box-geometry *args="[unit().size.x, unit().size.y, unit().size.z]"/>
        <ngt-mesh-basic-material [transparent]="true" [opacity]="0"/>
      </ngt-mesh>

      @if (groupRef) {
        <app-unit-size-lines [targetGroup]="groupRef" [unit]="unit()"/>
      }
    </ngt-group>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreeUnitComponent {
  @ViewChild('group') groupRef!: ElementRef<THREE.Group>;
  readonly unit = input.required<ResolvedUnit>();
  readonly position = input<Vec3>({x: 0, y: 0, z: 0});
  readonly rotation = input<number>(0); // Y-axis rotation in radians
  readonly selected = input<boolean>(false);

  readonly unitClick = output<string>();   // emits uid
  readonly facadeClick = output<number>(); // emits facade index

  protected readonly Math = Math;

  private readonly store = inject(ConfigurationStore);

  readonly isSelected = computed(() => this.selected());

  readonly corpusColor = computed(() => {
    const facades = this.store.facades();
    const mat = facades['color'];
    return mat ?? '#a8a8a8';
  });

  readonly corpusEmissiveColor = computed(() => {
    const facades = this.store.facades();
    const mat = facades['emissiveColor'];
    return mat ?? '#ddd5c0';
  });

  protected corpusTexture = loaderResource(
    () => TextureLoader,
    () => {
      const facades = this.store.facades();
      let path = '';
      //TODO убрать заглушку и добавить обработку репита в three-unit component
      if (Object.keys(facades).length && facades['textures'].length) {
        path = facades['textures'][0].path
      }
      return path ?? ''
    });

  readonly facadeColor = computed(() => {
    const mat = null;
    return mat ?? '#f0ece4';
  });

  tabletopRotation(top: ResolvedTabletop): [number, number, number] {
    if (!top.rotation) return [0, 0, 0];
    return [top.rotation.x ?? 0, top.rotation.y ?? 0, top.rotation.z ?? 0];
  }

  plinthRotation(plinth: ResolvedPlinth): [number, number, number] {
    return [plinth?.rotation?.x ?? 0, plinth?.rotation?.y ?? 0, plinth?.rotation?.z ?? 0];
  }

  handleRotation(handle: NonNullable<ResolvedFacade['handle']>): [number, number, number] {
    if (!handle.rotation) return [0, 0, 0];
    return [handle.rotation.x ?? 0, handle.rotation.y ?? 0, handle.rotation.z ?? 0];
  }

  onUnitClick(event: NgtThreeEvent<MouseEvent>): void {
    event.stopPropagation();
    this.unitClick.emit(this.unit().uid);
  }

  onFacadeClick(event: NgtThreeEvent<MouseEvent>, index: number): void {
    event.stopPropagation();
    this.facadeClick.emit(index);
  }

  onPointerOver(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    document.body.style.cursor = 'pointer';
  }

  onPointerOut(): void {
    document.body.style.cursor = 'auto';
  }
}
