import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  input,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import * as THREE from "three";
import {getObjectSize} from '../utils/object.utils';
import {NgtsLine, NgtsText} from 'angular-three-soba/abstractions';
import {beforeRender, injectStore} from 'angular-three';

@Component({
  selector: 'app-mesh-size-lines',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    NgtsLine,
    NgtsText,
  ],
  template: `
    @if (textReadable()) {
      @for (line of lines(); track $index) {
        @for (text of line.texts; track $index) {
          <ngts-text [text]="text.label"
                     [options]="{
                 position: text.position,
                 rotation: text.rotation,
                 fontSize: 100,
                 outlineColor: 'black',
                 color: 'black',
                 font: 'assets/fonts/rubik/Rubik-VariableFont_wght.ttf',
                 renderOrder: 1,
                 depthOffset: -1,
                 }">
          </ngts-text>
        }
        <ngts-line [points]="line.points" [options]="{ color: 'black', lineWidth: 1.5, depthTest: true }"/>
      }
    }
  `
})
export class MeshSizeLine implements OnInit {
  public store = injectStore();
  public targetObject = input.required<any>(); // Объект, для которого рисуем линию
  public meshPosition = input.required<any>(); // Объект, для которого рисуем линию
  public sideLines: WritableSignal<string> = signal('top');
  public textReadable: WritableSignal<boolean> = signal(true);
  public lines = computed(() => {
    return this.linesConfig[this.sideLines()] || this.linesConfig['topLeft']
  });

  private cameraDir = new THREE.Vector3();
  private textDir = new THREE.Vector3();
  private offset = 50;
  private linesConfig: Record<string, any> = {};

  constructor() {
    effect(() => {
      const pos = this.meshPosition();
      const key =
        (pos.z > 0 ? 'bottom' : 'top') +
        (pos.x > 0 ? 'Right' : 'Left');

      if (this.sideLines() !== key) {
        this.sideLines.set(key);
      }
    });

    beforeRender(() => {
      const lines = this.lines();
      if (!lines?.length) return;

      const rotation = lines[0].texts?.[0]?.rotation;
      if (!rotation) return;

      const visible = this.isTextFacingCamera(rotation);
      if (this.textReadable() !== visible) {
        this.textReadable.set(visible);
      }
    });
  }

  ngOnInit(): void {
    this.definePossibleLines();
  }

  private isTextFacingCamera(rotation: number[]) {

    const camera = this.store.camera();
    if (!camera) return true;

    camera.getWorldDirection(this.cameraDir);

    this.textDir
      .set(0, 0, 1)
      .applyEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2]));

    const dot = this.textDir.dot(this.cameraDir);

    return dot < 0;
  }

  private definePossibleLines(): void {
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

    this.linesConfig['topLeft'] = [{
      texts: [
        {
          label: this.prepareText(x),
          rotation: [0, 0, 0],
          position: [centerX, centerY + doubleOffset, minZ + halfOffset]
        }, {
          label: this.prepareText(y),
          rotation: [0, 0, Math.PI / 2],
          position: [maxX + doubleOffset, minY, minZ + halfOffset]
        }, {
          label: this.prepareText(z),
          rotation: [0, Math.PI / 2, 0],
          position: [minX + halfOffset, centerY + doubleOffset, centerZ]
        },
      ],
      points: [
        // y
        [maxX, -centerY + halfOffset, minZ],
        [maxX + doubleOffset, -centerY + halfOffset, minZ],
        [maxX + this.offset, -centerY + halfOffset, minZ],
        [maxX + this.offset, -centerY + halfOffset, minZ],
        [maxX + this.offset, -centerY + halfOffset, minZ],
        [maxX + this.offset, centerY, minZ],
        [maxX + doubleOffset, centerY, minZ],
        [maxX, centerY, minZ],
        //x
        [maxX, centerY + doubleOffset, minZ],
        [maxX, centerY + this.offset, minZ],
        [maxX, centerY + this.offset, minZ],
        [minX, centerY + this.offset, minZ],
        [minX, centerY + this.offset, minZ],
        [minX, centerY + doubleOffset, minZ],
        [minX, centerY, minZ],
        //z
        [minX, centerY, minZ],
        [minX, centerY + doubleOffset, minZ],
        [minX, centerY + this.offset, minZ],
        [minX, centerY + this.offset, maxZ],
        [minX, centerY + this.offset, maxZ],
        [minX, centerY + this.offset, maxZ],
        [minX, centerY + doubleOffset, maxZ],
        [minX, centerY, maxZ],
      ]
    }];

    this.linesConfig['topRight'] = [{
      texts: [
        {
          label: this.prepareText(x),
          rotation: [0, 0, 0],
          position: [centerX, centerY + doubleOffset, minZ + halfOffset]
        }, {
          label: this.prepareText(y),
          rotation: [0, 0, Math.PI / 2],
          position: [minX - doubleOffset, minY, minZ + halfOffset]
        }, {
          label: this.prepareText(z),
          rotation: [0, -(Math.PI / 2), 0],
          position: [maxX - halfOffset, centerY + doubleOffset, centerZ]
        },
      ],
      points: [
        // y
        [minX, -centerY + halfOffset, minZ],
        [minX - doubleOffset, -centerY + halfOffset, minZ],
        [minX - this.offset, -centerY + halfOffset, minZ],
        [minX - this.offset, -centerY + halfOffset, minZ],
        [minX - this.offset, -centerY + halfOffset, minZ],
        [minX - this.offset, centerY, minZ],
        [minX - doubleOffset, centerY, minZ],
        [minX, centerY, minZ],
        //x
        [minX, centerY + doubleOffset, minZ],
        [minX, centerY + this.offset, minZ],
        [minX, centerY + this.offset, minZ],
        [maxX, centerY + this.offset, minZ],
        [maxX, centerY + this.offset, minZ],
        [maxX, centerY + doubleOffset, minZ],
        //z
        [maxX, centerY, minZ],
        [maxX, centerY + doubleOffset, minZ],
        [maxX, centerY + this.offset, minZ],
        [maxX, centerY + this.offset, maxZ],
        [maxX, centerY + this.offset, maxZ],
        [maxX, centerY + this.offset, maxZ],
        [maxX, centerY + doubleOffset, maxZ],
        [maxX, centerY, maxZ],
      ]
    }];

    this.linesConfig['bottomRight'] = [{
      texts: [
        {
          label: this.prepareText(x),
          rotation: [0, Math.PI, 0],
          position: [centerX, centerY + doubleOffset, maxZ - halfOffset]
        }, {
          label: this.prepareText(y),
          rotation: [0, Math.PI, Math.PI / 2],
          position: [minX - doubleOffset, minY, maxZ - halfOffset]
        }, {
          label: this.prepareText(z),
          rotation: [0, -(Math.PI / 2), 0],
          position: [maxX - halfOffset, centerY + doubleOffset, centerZ]
        },
      ],
      points: [
        // y
        [minX, -centerY + halfOffset, maxZ],
        [minX - doubleOffset, -centerY + halfOffset, maxZ],
        [minX - this.offset, -centerY + halfOffset, maxZ],
        [minX - this.offset, -centerY + halfOffset, maxZ],
        [minX - this.offset, -centerY + halfOffset, maxZ],
        [minX - this.offset, centerY, maxZ],
        [minX - doubleOffset, centerY, maxZ],
        [minX, centerY, maxZ],
        //x
        [minX, centerY + doubleOffset, maxZ],
        [minX, centerY + this.offset, maxZ],
        [minX, centerY + this.offset, maxZ],
        [maxX, centerY + this.offset, maxZ],
        [maxX, centerY + this.offset, maxZ],
        [maxX, centerY + doubleOffset, maxZ],
        //z
        [maxX, centerY, maxZ],
        [maxX, centerY + doubleOffset, maxZ],
        [maxX, centerY + this.offset, maxZ],
        [maxX, centerY + this.offset, maxZ],
        [maxX, centerY + this.offset, maxZ],
        [maxX, centerY + this.offset, minZ],
        [maxX, centerY + doubleOffset, minZ],
        [maxX, centerY, minZ],
      ]
    }];

    this.linesConfig['bottomLeft'] = [{
      texts: [
        {
          label: this.prepareText(x),
          rotation: [0, Math.PI, 0],
          position: [centerX, centerY + doubleOffset, maxZ - halfOffset]
        }, {
          label: this.prepareText(y),
          rotation: [0, Math.PI, Math.PI / 2],
          position: [maxX + doubleOffset, minY, maxZ - halfOffset]
        }, {
          label: this.prepareText(z),
          rotation: [0, Math.PI / 2, 0],
          position: [minX + halfOffset, centerY + doubleOffset, centerZ]
        },
      ],
      points: [
        // y
        [maxX, -centerY + halfOffset, maxZ],
        [maxX + doubleOffset, -centerY + halfOffset, maxZ],
        [maxX + this.offset, -centerY + halfOffset, maxZ],
        [maxX + this.offset, -centerY + halfOffset, maxZ],
        [maxX + this.offset, -centerY + halfOffset, maxZ],
        [maxX + this.offset, centerY, maxZ],
        [maxX + doubleOffset, centerY, maxZ],
        [maxX, centerY, maxZ],
        //x
        [maxX, centerY, maxZ],
        [maxX, centerY + doubleOffset, maxZ],
        [maxX, centerY + this.offset, maxZ],
        [maxX, centerY + this.offset, maxZ],
        [minX, centerY + this.offset, maxZ],
        [minX, centerY + this.offset, maxZ],
        [minX, centerY + doubleOffset, maxZ],
        [minX, centerY, maxZ],
        //z
        [minX, centerY, maxZ],
        [minX, centerY + doubleOffset, maxZ],
        [minX, centerY + this.offset, maxZ],
        [minX, centerY + this.offset, maxZ],
        [minX, centerY + this.offset, maxZ],
        [minX, centerY + this.offset, minZ],
        [minX, centerY + doubleOffset, minZ],
        [minX, centerY, minZ],
      ]
    }];
  }

  private prepareText(value: number) {
    return Math.round(value).toString();
  }
}
