import {Directive, ElementRef, inject, Input, OnDestroy, OnInit} from "@angular/core";
import * as THREE from "three";

@Directive({selector: "ngt-mesh[sizeLines]"})
export class SizeLinesDirective implements OnInit, OnDestroy {

  @Input() targetObject: THREE.Object3D | null = null;
  @Input() liesInZ: boolean = false;
  @Input() showX: boolean = true;
  @Input() showY: boolean = true;
  private points: THREE.Mesh[] = [];
  private size!: THREE.Vector3;
  private offset: number = 0.05;
  private host = inject<ElementRef<THREE.Mesh>>(ElementRef);

  constructor() {
    this.targetObject = this.host.nativeElement;
  }

  ngOnInit() {
    if (this.targetObject) {
      // Небольшая задержка для гарантии загрузки объекта
      setTimeout(() => {
        this.calculateObjectCoordinates();
        this.addEdgePoints();
        this.addLabels();
      }, 100);
    }
  }

  ngOnDestroy() {
    this.removePoints();
  }

  private addEdgePoints() {
    if (!this.targetObject) return;

    const xCoordinate = !this.liesInZ ? this.size.x : this.size.z;
    const yCoordinate = this.size.y;

    const positionsY = [
      {pos: new THREE.Vector3(xCoordinate / 2 + this.offset, (yCoordinate / 2))}, // вверх
      {pos: new THREE.Vector3(xCoordinate / 2 + this.offset, -((yCoordinate / 2)))},// низ
    ];

    const positionsX = [
      {pos: new THREE.Vector3(-xCoordinate / 2, (yCoordinate / 2) + this.offset)}, // право
      {pos: new THREE.Vector3(xCoordinate / 2, (yCoordinate / 2) + this.offset)}, // лево
    ];

    if (this.showY) {
      this.joinPoints(positionsY[0].pos, positionsY[1].pos);
      this.addAdditionalLines(positionsY[0].pos, false);
      this.addAdditionalLines(positionsY[1].pos, false);
    }

    if (this.showX) {
      this.joinPoints(positionsX[0].pos, positionsX[1].pos);
      this.addAdditionalLines(positionsX[0].pos, true);
      this.addAdditionalLines(positionsX[1].pos, true);
    }
  }

  private removePoints() {
    this.points.forEach(point => {
      if (point.parent) {
        point.parent.remove(point);
      }
    });
    this.points = [];
  }

  private addLabels(): void {
    if (!this.targetObject) return;
    const xCoordinate = !this.liesInZ ? this.size.x : this.size.z;

    if (this.showY) {
      const labelMaterial = new THREE.SpriteMaterial({
        map: this.createLabelTexture(this.size.y),
        depthTest: false,
        depthWrite: false,
        rotation: Math.PI / 2
      });
      const labelY = new THREE.Sprite(labelMaterial);
      this.targetObject.add(labelY);
      labelY.position.copy(new THREE.Vector3(xCoordinate / 2 + (this.offset * 2)));
    }

    if (this.showX) {
      const labelMaterial = new THREE.SpriteMaterial({
        map: this.createLabelTexture(xCoordinate),
        depthTest: false,
        depthWrite: false
      });
      const labelX = new THREE.Sprite(labelMaterial);
      this.targetObject.add(labelX);
      labelX.position.copy(new THREE.Vector3(0, (this.size.y / 2) + (this.offset * 2)));
    }
  }

  private addAdditionalLines(vector: THREE.Vector3, byX: boolean): void {
    if (!this.targetObject) return;

    const { x, y } = vector;

    if (byX) {
      this.joinPoints(new THREE.Vector3(x,y - this.offset),new THREE.Vector3(x,y + this.offset))
    } else {
      this.joinPoints(new THREE.Vector3(x - this.offset,y),new THREE.Vector3(x + this.offset,y))
    }
  }

  private joinPoints(start: THREE.Vector3, end: THREE.Vector3): void {
    if (!this.targetObject) return;
    const points = [start, end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({color: 'black'});
    const line = new THREE.Line(geometry, material);
    this.targetObject.add(line);
  }

  private calculateObjectCoordinates(): void {
    if (!this.targetObject) return;
    const box = new THREE.Box3().setFromObject(this.targetObject);
    this.size = box.getSize(new THREE.Vector3())
  }

  private createLabelTexture(text: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.font = '20px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText((text * 1000).toString(), canvas.width / 2, canvas.height / 2);

    return new THREE.CanvasTexture(canvas);
  }
}
