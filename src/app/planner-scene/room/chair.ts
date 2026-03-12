import {AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {NgtArgs, NgtThreeElement} from 'angular-three';
import {DraggableDirective} from '../directives/draggable.directive';
import {MeshSizeLine} from './sizeLines';

@Component({
  selector: 'app-chair',
  standalone: true,
  imports: [
    NgtArgs,
    DraggableDirective,
    MeshSizeLine
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
      <ngt-mesh
        #mesh
        draggableItem
        [position]="position"
        (dblclick)="check(mesh)"
        (dargging)="check(mesh)">
        <ngt-box-geometry *args="size"/>
        <ngt-mesh-standard-material color="transparent" [opacity]="0.9"/>

      @if (parentMeshRef) {
        <app-mesh-size-lines [targetObject]="parentMeshRef"/>
      }
      </ngt-mesh>

  `
})
export class ChairComponent {
  @ViewChild('mesh') parentMeshRef!: ElementRef<THREE.Mesh>;
  position = new THREE.Vector3(0, 0.5, 0);
  size = [1.5, 1, 1];

  public check(mesh: NgtThreeElement<typeof THREE.Mesh>): void {
  }

}
