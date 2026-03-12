import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  OnInit,
} from '@angular/core';
import * as THREE from 'three';
import {injectStore} from 'angular-three';
import {getObjectSize} from '../utils/object.utils';
import {NgtsLine, NgtsText} from 'angular-three-soba/abstractions';

@Component({
  selector: 'app-mesh-size-lines',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    NgtsLine,
    NgtsText
  ],
  template: `
    @for (line of lines; track line) {
      <ngts-text [text]="line.text.label"
                 [options]="{
                 position: line.text.position,
                 rotation: line.text.rotation,
                 fontSize: 0.1,
                 outlineColor: 'black',
                 color: 'black',
                 }">
      </ngts-text>
      <ngts-line [points]="line.geometry" [options]="{ color: 'black', lineWidth: 1.5 }"/>
    }
  `
})
export class MeshSizeLine implements OnInit {
  public targetObject = input.required<any>(); // Объект, для которого рисуем линию

  // Параметры внешнего вида (как в оригинале)
  public direction = input<boolean>(true); // true = вверх, false = вниз
  public color = input<string>('#ff0000');
  public lines: any[] = []

  private store = injectStore();
  private scene = this.store().scene;
  private offset = 0.05;

  ngOnInit() {
    this.calculatePoints();
  }

  private calculatePoints() {
    const target = this.targetObject()?.nativeElement;
    if (!target) return;

    // Получаем границы объекта
    const {x, y, z} = getObjectSize(target);
    const minX = -(x / 2);
    const minY = 0;
    const minZ = -(z / 2);

    const maxX = x / 2;
    const maxY = y;
    const maxZ = z / 2;

    // Позиционируем в центр объекта
    const centerX = (maxX + minX) / 2;
    const centerY = (maxY + minY) / 2;
    const centerZ = (maxZ + minZ) / 2;

    const halfOffset = this.offset / 2;
    const doubleOffset = this.offset * 2;

    const xPoints = [
      new THREE.Vector3(minX, centerY, minZ),
      new THREE.Vector3(minX, centerY + doubleOffset, minZ),
      new THREE.Vector3(minX, centerY + this.offset, minZ),
      new THREE.Vector3(minX, centerY + this.offset, minZ),
      new THREE.Vector3(maxX, centerY + this.offset, minZ),
      new THREE.Vector3(maxX, centerY + this.offset, minZ),
      new THREE.Vector3(maxX, centerY + doubleOffset, minZ),
      new THREE.Vector3(maxX, centerY, minZ),
    ];
    const xTextPosition = [centerX, centerY + doubleOffset, minZ + halfOffset];

    const yPoints = [
      new THREE.Vector3(maxX, centerY, minZ),
      new THREE.Vector3(maxX + doubleOffset, centerY, minZ),
      new THREE.Vector3(maxX + this.offset, centerY, minZ),
      new THREE.Vector3(maxX + this.offset, -centerY + halfOffset, minZ),
      new THREE.Vector3(maxX + this.offset, -centerY + halfOffset, minZ),
      new THREE.Vector3(maxX + this.offset, -centerY + halfOffset, minZ),
      new THREE.Vector3(maxX + doubleOffset, -centerY + halfOffset, minZ),
      new THREE.Vector3(maxX, -centerY + halfOffset, minZ),
    ];
    const yTextPosition = [maxX + doubleOffset, minY, minZ + halfOffset];

    const zPoints = [
      new THREE.Vector3(minX, centerY, minZ),
      new THREE.Vector3(minX, centerY + doubleOffset, minZ),
      new THREE.Vector3(minX, centerY + this.offset, minZ),
      new THREE.Vector3(minX, centerY + this.offset, maxZ),
      new THREE.Vector3(minX, centerY + this.offset, maxZ),
      new THREE.Vector3(minX, centerY + this.offset, maxZ),
      new THREE.Vector3(minX, centerY + doubleOffset, maxZ),
      new THREE.Vector3(minX, centerY, maxZ),
    ];
    const zTextPosition = [minX + halfOffset, centerY + doubleOffset, centerZ];

    this.lines = [
      {
        text: {
          label: this.prepareText(x),
          position: xTextPosition,
          rotation: [0, 0, 0]
        },
        geometry: xPoints
      },
      {
        text: {
          label: this.prepareText(y),
          position: yTextPosition,
          rotation: [0, 0, Math.PI / 2]
        },
        geometry: yPoints
      },
      {
        text: {
          label: this.prepareText(z),
          position: zTextPosition,
          rotation: [0, Math.PI / 2, 0]
        },
        geometry: zPoints
      }
    ];
  }

  private prepareText(value: number) {
    return (value * 1000).toString();
  }
}
