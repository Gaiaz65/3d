import {Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, inject, signal, WritableSignal} from '@angular/core';
import {injectStore, loaderResource, NgtArgs} from 'angular-three';
import * as THREE from 'three';
import {TextureLoader} from 'three';
import {WallOpacityDirective} from '../directives/wall-opacity.directive';
import {ConfigurationStore} from '../../store/store';
import {WallSizeLines} from '../components/wall-size-lines';
import {ThreeUnitComponent} from '../components/three-unit.component';
import {SketchOutlineDirective} from '../directives/sketch-outline.directive';

@Component({
  selector: 'app-room',
  imports: [
    NgtArgs,
    WallOpacityDirective,
    WallSizeLines,
    ThreeUnitComponent,
    SketchOutlineDirective,
  ],
  template: `
    <ngt-group>
      @for (wall of wallPositions(); track wall.type) {
        <ngt-mesh #wallMesh
                  [userData]="{type: 'wall', wallType: wall.type}"
                  wallOpacity
                  sketchOutline
                  [enabled]="isSketchView()"
                  [position]="[wall.pos.x, wall.pos.y, wall.pos.z]"
                  [rotation]="[0, wall.rotation, 0]">
          <ngt-plane-geometry *args="[
            wall.type === 'left' || wall.type === 'right' ? roomDepth() : roomWidth(),
            roomHeight()
          ]"/>
          @if (isSketchView()) {
            <ngt-mesh-standard-material color="white"/>
          } @else {
            <ngt-mesh-standard-material [map]="wallTexture.value()"/>
          }

          <app-wall-size-lines
            [wall]="wallMesh"
            [wallSize]="[
              wall.type === 'left' || wall.type === 'right' ? roomDepth() : roomWidth(),
              roomHeight(),
              wallThickness
            ]"/>
        </ngt-mesh>
      }

      @for (entry of placedUnits(); track entry.id) {
        <app-three-unit
          [isSketchView]="isSketchView()"
          [id]="entry.id"
          [unit]="entry.resolvedUnit"
          [position]="entry.position"
          [rotation]="entry.rotation"
        />
      }

      <ngt-mesh [position]="floor().position"
                sketchOutline
                [enabled]="isSketchView()"
                [userData]="{type: 'wall', wallType: 'floor'}"
                [rotation]="floor().rotation">
        <ngt-plane-geometry *args="floor().geometry"/>
        @if (isSketchView()) {
          <ngt-mesh-standard-material color="white"/>
        } @else {
          <ngt-mesh-standard-material color="0xF5F0E6"
                                      [map]="floorTexture.value()"
                                      [opacity]="0.9"/>
        }
      </ngt-mesh>

      <ngt-mesh [position]="ceiling().position"
                [rotation]="ceiling().rotation">
        <ngt-plane-geometry *args="ceiling().geometry"/>
        @if (isSketchView()) {
          <ngt-mesh-standard-material color="white"/>
        } @else {
          <ngt-mesh-standard-material wireframe [opacity]="0" [transparent]="true"/>
        }
      </ngt-mesh>
    </ngt-group>
  `,
  styleUrl: './room.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RoomComponent {
  public roomHeight: WritableSignal<number> = signal(0);
  public roomDepth: WritableSignal<number> = signal(0);
  public roomWidth: WritableSignal<number> = signal(0);
  public isSketchView: WritableSignal<boolean> = signal(false);
  public readonly wallThickness = 10;

  public readonly ceiling = computed(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    geometry: [this.roomWidth() + this.wallThickness, this.roomDepth()],
    position: [0, this.roomHeight(), 0],
  }));
  public readonly floor = computed(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    geometry: [this.roomWidth(), this.roomDepth()],
    position: [0, this.wallThickness, 0],
  }));
  public wallPositions = computed(() => ([
    {pos: {x: 0, y: this.roomHeight() / 2, z: -this.roomDepth() / 2}, rotation: 0, type: 'back'},
    {pos: {x: 0, y: this.roomHeight() / 2, z: this.roomDepth() / 2}, rotation: Math.PI, type: 'front'},
    {pos: {x: -this.roomWidth() / 2, y: this.roomHeight() / 2, z: 0}, rotation: Math.PI / 2, type: 'left'},
    {pos: {x: this.roomWidth() / 2, y: this.roomHeight() / 2, z: 0}, rotation: -Math.PI / 2, type: 'right'},
  ]));

  protected floorTexture = loaderResource(() => TextureLoader, () => this.configurationStore.currentFloor().url);
  protected wallTexture = loaderResource(() => TextureLoader, () => this.configurationStore.currentWall().url);

  readonly placedUnits = computed(() => this.configurationStore.items());

  protected configurationStore = inject(ConfigurationStore);
  private store = injectStore();

  constructor() {
    effect(() => {
      const {x, y, z} = this.configurationStore.roomParameters().size;
      this.roomHeight.set(y);
      this.roomDepth.set(z);
      this.roomWidth.set(x);
      this.store().invalidate();
    });

    const TILE = 1000;
    effect(() => {
      const tex = this.wallTexture.value();
      if (!tex) return;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(this.roomWidth() / TILE, this.roomHeight() / TILE);
      tex.needsUpdate = true;
      this.store().invalidate();
    });

    effect(() => {
      const tex = this.floorTexture.value();
      if (!tex) return;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(this.roomWidth() / TILE, this.roomDepth() / TILE);
      tex.needsUpdate = true;
      this.store().invalidate();
    });

    effect(() => {
      this.isSketchView.set(this.configurationStore.isSketchView());
    });
  }
}
