import {Component, CUSTOM_ELEMENTS_SCHEMA, effect} from "@angular/core";
import {extend, injectStore, NgtArgs} from "angular-three";
import * as THREE from "three";
import {RoomComponent} from './room/room';
import {NgtsOrbitControls} from 'angular-three-soba/controls';
import {NgtsPerspectiveCamera} from 'angular-three-soba/cameras';
import {NgtsGizmoHelperContent, NgtsGizmoHelperImpl, NgtsGizmoViewcube} from 'angular-three-soba/gizmos';

extend(THREE);

@Component({
  selector: "app-scene-graph",
  template: `
    <ngts-perspective-camera [options]="{ makeDefault: true, fov: 50, position: [1000, 5000, -5000], resolution: 128 }"/>
    <ngts-orbit-controls [options]="{ zoomSpeed: 0.2, makeDefault: true, minDistance: 500, maxDistance: 15000 }" ></ngts-orbit-controls>
    <ngt-color *args="['#c1c1c1']" attach="background"/>
    <ngt-ambient-light [intensity]="1"/>
    <ngt-spot-light
      [position]="[50000, 50000, -50000]"
      [intensity]="0.5 * Math.PI"
      [angle]="0.5"
      [penumbra]="1"
      [decay]="0"
      castShadow/>

    <ngt-spot-light
      [position]="[-50000, -50000, 50000]"
      [intensity]="0.3 * Math.PI"
      [angle]="0.5"
      [penumbra]="1"
      [decay]="0"
      castShadow/>
<!--    <ngt-point-light [position]="-100" [intensity]="0.5 * Math.PI" [decay]="0"/>-->
    <app-room></app-room>
    <ngts-gizmo-helper [options]="{
      alignment: 'bottom-right',
      margin: [80, 80],
       }">
      <ng-template gizmoHelperContent>
        <ngts-gizmo-viewcube  [options]="{faces: ['Право','Лево','Верх','Низ','Перед', 'Зад']}"/>
      </ng-template>
    </ngts-gizmo-helper>
    <ngt-axes-helper *args="[10000]"></ngt-axes-helper>
    <ngt-grid-helper *args="[30000, 30]" [position]="[0, -100, 0]"/>
  `,
  imports: [NgtArgs, RoomComponent, NgtsOrbitControls, NgtsOrbitControls, NgtsPerspectiveCamera, NgtsGizmoHelperImpl, NgtsGizmoViewcube, NgtsGizmoHelperContent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SceneGraph {
  private store = injectStore();
  protected readonly Math = Math;

  constructor() {
    effect(() => {
      const camera = this.store.camera();
      camera.near = 10;
      camera.far = 100000;
      camera.position.set(2000, 5000, 5000);
      camera.updateProjectionMatrix();
    });
  }
}
