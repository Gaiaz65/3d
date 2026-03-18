import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef, HostListener,
  signal,
  ViewChild
} from '@angular/core';
import * as THREE from 'three';
import {injectStore, NgtArgs, NgtThreeElement, NgtThreeEvent} from 'angular-three';
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
        [readyToDrag]="focused()"
        [position]="position"
        (click)="focusElement(mesh,$event)"
        (dargging)="check(mesh)"
      >
        <ngt-box-geometry *args="size"/>
        <ngt-mesh-standard-material [color]="focused() ? 'green' :'white'"
                                    [opacity]="focused() ? 0.8 :1"
                                    [transparent]="true"/>

      @if (parentMeshRef) {
        <app-mesh-size-lines [targetObject]="parentMeshRef" [meshPosition]="meshPosition()"/>
      }

        @if (focused()) {
        <ngt-mesh #helper>
          <ngt-box-geometry *args="size"/>
          <ngt-mesh-normal-material color="white" wireframe />
        </ngt-mesh>
        }
      </ngt-mesh>

  `
})
export class ThreeItemComponent {
  @ViewChild('mesh') parentMeshRef!: ElementRef<THREE.Mesh>;
  @ViewChild('bomb') bombmesh!: ElementRef<THREE.Mesh>;
  @HostListener('window:click', ['$event'])
  handleKeyDown(event: MouseEvent) {
    if (this.focused()) {
      event.stopPropagation();
      this.focused.set(false);
      this.toggleControls(true);
    }
  }
  public store = injectStore();
  public focused = signal(false);
  public meshPosition = signal(new THREE.Vector3(0,0,0));
  position = new THREE.Vector3(Math.random(), 0.25, Math.random());
  size = [0.5, 0.5, 0.5];

  public check(mesh: NgtThreeElement<typeof THREE.Mesh>): void {
    const position = new THREE.Vector3(...mesh.position as any);
    this.meshPosition.set(position as any);
  }

  public focusElement(mesh: NgtThreeElement<typeof THREE.Mesh>, event: NgtThreeEvent<MouseEvent>): void {
    event.nativeEvent.stopPropagation();
    this.toggleControls(false);
    this.focused.set(true);
  }


  private toggleControls(flag: boolean) {
    const controls = this.store().controls;
    if (controls) {
      (controls as any).enabled = flag;
    }
  }

  // protected gltf = gltfResource<any>(() => '/assets/bomb-gp.glb');
}
