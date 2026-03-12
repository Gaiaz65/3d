import {
  AfterViewInit,
  Directive,
  ElementRef,
  inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2
} from "@angular/core";
import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { injectStore } from 'angular-three';
import { ConfigurationStore } from '../../store/store';

@Directive({ selector: "ngt-mesh[objectSizeLines]" })
export class ObjectSizeDirective implements OnInit, OnDestroy, AfterViewInit {
  private store = injectStore();
  private configStore = inject(ConfigurationStore);
  private ngZone = inject(NgZone);
  private renderer2 = inject(Renderer2);

  @Input() public set objectSize(value: number[]) {
    const [x, y, z] = value;
  };

  @Input() linesColor: string = '#000000';
  @Input() lineWidth: number = 2;
  @Input() showLabels: boolean = true;
  @Input() labelSize: string = '16px';

  private host = inject<ElementRef<THREE.Mesh>>(ElementRef);
  private css2DRenderer!: CSS2DRenderer;
  private linesScene: THREE.Scene;
  private linesGroup: THREE.Group;
  private labelsGroup: THREE.Group;
  private animationFrameId!: number;
  private isInitialized = false;

  // Точки для соединения
  private readonly sY = [
    {x: 0, y: -0.5, z: 0},
    {x: 0, y: 0.5, z: 0},
  ];

  private readonly sZ = [
    {x: 0, y: 0.5, z: 0.5},
    {x: 0, y: 0.5, z: -0.5},
  ];

  private readonly sX = [
    {x: -0.5, y: 0.5, z: 0},
    {x: 0.5, y: 0.5, z: 0},
  ];

  constructor() {
    this.linesGroup = new THREE.Group();
    this.labelsGroup = new THREE.Group();
    this.linesScene = new THREE.Scene();
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.initializeCSS2DRenderer();
      this.initializeLines();
    });
  }

  ngOnInit() {}

  private initializeCSS2DRenderer() {
    this.css2DRenderer = new CSS2DRenderer();
    this.css2DRenderer.setSize(window.innerWidth, window.innerHeight);

    const domElement = this.css2DRenderer.domElement;

    document.body.appendChild(domElement);
  }

  private initializeLines() {
    this.createCornerLines();
    if (this.showLabels) {
    }

    this.linesScene.add(this.linesGroup);
    this.linesScene.add(this.labelsGroup);
    this.isInitialized = true;
  }

  private createCornerLines() {
    // Создаем три отдельные линии, которые сходятся в точке (0,1,0)

    // Линия Y (вертикальная от 0,0,0 до 0,1,0)
    this.createLine(
      this.sY.map(p => new THREE.Vector3(p.x, p.y, p.z)),
      this.linesColor
    );

    // Линия Z (горизонтальная по Z от 0,1,0 до 0,1,1)
    this.createLine(
      this.sZ.map(p => new THREE.Vector3(p.x, p.y, p.z)),
      this.linesColor
    );

    // Линия X (горизонтальная по X от 0,1,0 до 1,1,0)
    this.createLine(
      this.sX.map(p => new THREE.Vector3(p.x, p.y, p.z)),
      this.linesColor
    );

    // Добавляем маленькие сферы в ключевых точках
    this.addPointSpheres();
  }

  private createLine(points: THREE.Vector3[], color: string) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geometry, material);
    this.linesGroup.add(line);
  }

  private addPointSpheres() {
    const sphereGeometry = new THREE.SphereGeometry(0.03, 6, 6);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: this.linesColor });

    // Точки, где нужны сферы
    const points = [
      {x: 0, y: -0.5, z: 0}, // Нижняя точка
      {x: 0, y: 0.5, z: 0}, // Центральная точка (угол)
      {x: 0, y: 0.5, z: 1}, // Конец Z
      {x: 1, y: 0.5, z: 0}, // Конец X
    ];

    points.forEach(point => {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(point.x, point.y, point.z);
      this.linesGroup.add(sphere);
    });
  }

  ngOnDestroy() {
    this.isInitialized = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.ngZone.runOutsideAngular(() => {
      while(this.linesGroup.children.length > 0) {
        this.linesGroup.remove(this.linesGroup.children[0]);
      }

      while(this.labelsGroup.children.length > 0) {
        this.labelsGroup.remove(this.labelsGroup.children[0]);
      }

      if (this.css2DRenderer && this.css2DRenderer.domElement) {
        this.css2DRenderer.domElement.remove();
      }
    });
  }
}
