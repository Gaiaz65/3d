import {Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, signal, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {NgtArgs, NgtThreeElement} from 'angular-three';
import {DraggableDirective} from '../directives/draggable.directive';
import {MeshSizeLine} from './size-lines';

@Component({
  selector: 'app-three-item',
  standalone: true,
  imports: [
    NgtArgs,
    DraggableDirective,
    MeshSizeLine,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ngt-mesh
      #mesh
      draggableItem
      [position]="position"
      (dargging)="onDrag(mesh)"
    >
      <ngt-box-geometry *args="size"/>
      <ngt-mesh-standard-material color="white" [transparent]="true"/>

      @if (parentMeshRef) {
        <app-mesh-size-lines [targetObject]="parentMeshRef" [meshPosition]="meshPosition()"/>
      }
    </ngt-mesh>
  `
})
export class ThreeItemComponent {
  @ViewChild('mesh') parentMeshRef!: ElementRef<THREE.Mesh>;

  public meshPosition = signal(new THREE.Vector3(0, 0, 0));
  position = new THREE.Vector3((Math.random() - 0.5) * 2000, 250, (Math.random() - 0.5) * 2000);
  size = [500, 500, 500];

  public onDrag(mesh: NgtThreeElement<typeof THREE.Mesh>): void {
    this.meshPosition.set(new THREE.Vector3(...(mesh.position as any)));
  }
}
