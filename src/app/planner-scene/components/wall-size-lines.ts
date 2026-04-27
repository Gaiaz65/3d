import {Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, signal} from '@angular/core';
import * as THREE from 'three';
import {beforeRender} from 'angular-three';
import {NgtsLine, NgtsText} from 'angular-three-soba/abstractions';
import {ConfigurationStore} from '../../store/store';

const FONT = 'assets/fonts/rubik/Rubik-VariableFont_wght.ttf';
/** Отступ размерных линий от края стены, мм */
const OFFSET = 50;
/** Половина длины засечки, мм */
const TICK = 40;

@Component({
  selector: 'app-wall-size-lines',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgtsLine, NgtsText],
  template: `
    @if (configStore.showSizeLines() && visible()) {
      <ngts-line [points]="widthPoints()"
                 [options]="lineOptions"/>

      <ngts-line [points]="heightPoints()"
                 [options]="lineOptions"/>

      <ngts-text [text]="widthLabel()"
                 [options]="{
                   position: widthLabelPos(),
                   fontSize: 100,
                   color: 'black',
                   outlineColor: 'white',
                   outlineWidth: 4,
                   font: font,
                   renderOrder: 1,
                   depthOffset: -1
                 }"/>

      <ngts-text [text]="heightLabel()"
                 [options]="{
                   position: heightLabelPos(),
                   rotation: [0, 0, halfPi],
                   fontSize: 100,
                   color: 'black',
                   outlineColor: 'white',
                   outlineWidth: 4,
                   font: font,
                   renderOrder: 1,
                   depthOffset: -1
                 }"/>
    }
  `,
})
export class WallSizeLines {
  public wallSize = input.required<number[]>();
  public wall = input<any>(null);
  public configStore: ConfigurationStore = inject(ConfigurationStore);

  protected readonly font    = FONT;
  protected readonly halfPi  = Math.PI / 2;
  protected readonly lineOptions = {color: 'black', lineWidth: 1.5, depthTest: true, transparent: false, depthWrite: true} as const;

  protected readonly visible = signal(true);

  private readonly W = computed(() => this.wallSize()[0] ?? 0);
  private readonly H = computed(() => this.wallSize()[1] ?? 0);

  /** Ширина — горизонтальная линия над стеной с засечками по краям */
  protected readonly widthPoints = computed<[number, number, number][]>(() => {
    const W = this.W(), H = this.H(), y = H / 2 + OFFSET;
    return [
      [-W / 2, y + TICK, 0],
      [-W / 2, y - TICK, 0],
      [-W / 2, y,        0],
      [ W / 2, y,        0],
      [ W / 2, y - TICK, 0],
      [ W / 2, y + TICK, 0],
    ];
  });

  /** Высота — вертикальная линия справа от стены с засечками по краям */
  protected readonly heightPoints = computed<[number, number, number][]>(() => {
    const W = this.W(), H = this.H(), x = W / 2 + OFFSET;
    return [
      [x - TICK, H / 2,  0],
      [x + TICK, H / 2,  0],
      [x,        H / 2,  0],
      [x,       -H / 2,  0],
      [x - TICK, -H / 2, 0],
      [x + TICK, -H / 2, 0],
    ];
  });

  protected readonly widthLabelPos  = computed(() => [0,                    this.H() / 2 + OFFSET * 2.5, 0] as [number, number, number]);
  protected readonly heightLabelPos = computed(() => [this.W() / 2 + OFFSET * 2.5, 0,                   0] as [number, number, number]);

  protected readonly widthLabel  = computed(() => Math.round(this.W()).toString());
  protected readonly heightLabel = computed(() => Math.round(this.H()).toString());

  constructor() {
    // Скрываем размерные линии когда стена становится прозрачной
    // (WallOpacityDirective обнуляет opacity при взгляде снаружи)
    beforeRender(() => {
      const mesh = this.wall();
      if (!mesh) return;

      const mat = (mesh as THREE.Mesh).material;
      const opacity = Array.isArray(mat)
        ? Math.min(...(mat as THREE.Material[]).map(m => (m as any).opacity ?? 1))
        : ((mat as any).opacity ?? 1);

      const shouldShow = opacity > 0;
      if (this.visible() !== shouldShow) this.visible.set(shouldShow);
    });
  }
}
