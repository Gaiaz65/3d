import {Directive, ElementRef, inject, Input, OnDestroy, OnInit} from "@angular/core";
import * as THREE from "three";

interface LineConfig {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

interface LabelConfig {
  position: THREE.Vector3;
  text: number;
  rotation?: number;
  axis: 'x' | 'y';
}

@Directive({selector: "ngt-mesh[sizeLines]"})
export class SizeLinesDirective implements OnInit, OnDestroy {
  @Input() public showX: boolean = true;
  @Input() public showY: boolean = true;
  @Input() public showLines: boolean = true;
  @Input() public set wallSize(value: number[]) {
    const [x,y,z] = value;
    this.size = new THREE.Vector3(x,y,z);
    this.removeAll();
    this.drawAll();
    this.setVisibility(!!this.getCurrentOpacity());
  };

  private readonly targetObject: THREE.Object3D;
  private lines: THREE.Line[] = [];
  private sprites: THREE.Sprite[] = [];
  private size!: THREE.Vector3;
  private host = inject<ElementRef<THREE.Mesh>>(ElementRef);
  private isInitialized = false;
  private lastOpacity = 1;
  private lastShowLines = true;
  private animationFrame: number | null = null;

  // Приватные настройки
  private readonly lineColor: string | number = 'black';
  private readonly labelColor: string = '#000000';
  private readonly offset: number = 0.05;

  constructor() {
    this.targetObject = this.host.nativeElement;
  }

  ngOnInit() {
    // Начинаем проверять размеры сразу
    this.startChecking();
  }

  ngOnDestroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.removeAll();
  }

  private startChecking() {
    const check = () => {
      // Пытаемся получить размеры объекта
      if (!this.isInitialized) {
        this.tryInitialize();
      }

      // Обновляем видимость, если уже инициализированы
      if (this.isInitialized) {
        this.updateVisibility();
      }

      this.animationFrame = requestAnimationFrame(check);
    };
    check();
  }

  private tryInitialize() {
    if (!this.targetObject) return;


    // Проверяем, что размеры не нулевые
    if (this.size.x > 0 || this.size.y > 0 || this.size.z > 0) {
      this.isInitialized = true;

      // Сразу создаем линии, если нужно
      if (this.shouldShow()) {
        this.drawAll();
      }
    }
  }

  private getCurrentOpacity(): number {
    const parentMaterial = (this.targetObject as THREE.Mesh).material;
    if (!parentMaterial) return 1;

    if (Array.isArray(parentMaterial)) {
      return Math.min(...parentMaterial.map(m => m.opacity));
    } else {
      return parentMaterial.opacity;
    }
  }

  private shouldShow(): boolean {
    if (!this.showLines) return false;
    const opacity = this.getCurrentOpacity();
    return opacity > 0;
  }

  private updateVisibility() {
    const currentOpacity = this.getCurrentOpacity();
    const shouldShow = this.shouldShow();

    // Проверяем изменения
    const opacityChanged = currentOpacity !== this.lastOpacity;
    const showLinesChanged = this.showLines !== this.lastShowLines;

    if (opacityChanged || showLinesChanged) {
      this.lastOpacity = currentOpacity;
      this.lastShowLines = this.showLines;

      if (shouldShow) {
        if (this.lines.length === 0 && this.sprites.length === 0) {
          this.removeAll();
          this.drawAll();
        } else {
          this.setVisibility(true);
        }
      } else {
        this.setVisibility(false);
      }
    }
  }

  private setVisibility(visible: boolean) {
    this.lines.forEach(line => {
      line.visible = visible;
    });
    this.sprites.forEach(sprite => {
      sprite.visible = visible;
    });
  }

  private drawAll() {
    if (!this.size || (this.size.x === 0 && this.size.y === 0 && this.size.z === 0)) {
      return;
    }

    this.createLines();
    this.createLabels();
  }

  private removeAll() {
    this.lines.forEach(line => {
      if (line.parent) {
        line.parent.remove(line);
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      }
    });
    this.lines = [];

    this.sprites.forEach(sprite => {
      if (sprite.parent) {
        sprite.parent.remove(sprite);
        if (sprite.material.map) {
          sprite.material.map.dispose();
        }
        sprite.material.dispose();
      }
    });
    this.sprites = [];
  }

  private createLines(): void {
    const xCoordinate = this.size.x;
    const yCoordinate = this.size.y;
    const halfX = xCoordinate / 2;
    const halfY = yCoordinate / 2;

    if (this.showY) {
      // Основная вертикальная линия
      this.drawLine({
        start: new THREE.Vector3(halfX + this.offset, halfY, 0),
        end: new THREE.Vector3(halfX + this.offset, -halfY, 0)
      });

      // Засечки на концах
      this.drawLine({
        start: new THREE.Vector3(halfX + this.offset - 0.05, halfY, 0),
        end: new THREE.Vector3(halfX + this.offset + 0.05, halfY, 0)
      });
      this.drawLine({
        start: new THREE.Vector3(halfX + this.offset - 0.05, -halfY, 0),
        end: new THREE.Vector3(halfX + this.offset + 0.05, -halfY, 0)
      });
    }

    if (this.showX) {
      // Основная горизонтальная линия
      this.drawLine({
        start: new THREE.Vector3(-halfX, halfY + this.offset, 0),
        end: new THREE.Vector3(halfX, halfY + this.offset, 0)
      });

      // Засечки на концах
      this.drawLine({
        start: new THREE.Vector3(-halfX, halfY + this.offset - 0.05, 0),
        end: new THREE.Vector3(-halfX, halfY + this.offset + 0.05, 0)
      });
      this.drawLine({
        start: new THREE.Vector3(halfX, halfY + this.offset - 0.05, 0),
        end: new THREE.Vector3(halfX, halfY + this.offset + 0.05, 0)
      });
    }
  }

  private drawLine(config: LineConfig): void {
    const points = [config.start, config.end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({color: this.lineColor});
    const line = new THREE.Line(geometry, material);

    this.targetObject.add(line);
    this.lines.push(line);
  }

  private createLabels(): void {
    const xCoordinate = this.size.x;
    const halfX = xCoordinate / 2;
    const halfY = this.size.y / 2;

    if (this.showY) {
      this.createLabel({
        position: new THREE.Vector3(halfX + this.offset * 2, 0, 0),
        text: this.size.y,
        rotation: Math.PI / 2,
        axis: 'y'
      });
    }

    if (this.showX) {
      this.createLabel({
        position: new THREE.Vector3(0, halfY + this.offset * 2, 0),
        text: xCoordinate,
        axis: 'x'
      });
    }
  }

  private createLabel(config: LabelConfig): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.font = '20px Arial';
    ctx.fillStyle = this.labelColor;
    ctx.textAlign = 'center';
    ctx.fillText(this.formatNumber(config.text), canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      depthWrite: false,
      rotation: config.rotation || 0
    });

    const sprite = new THREE.Sprite(material);
    this.targetObject.add(sprite);
    sprite.position.copy(config.position);
    this.sprites.push(sprite);
  }

  private formatNumber(value: number): string {
    return (value * 1000).toString();
  }
}
