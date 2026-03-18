import {Component} from '@angular/core';
import {NgtCanvas, NgtCanvasContent, NgtCanvasImpl} from 'angular-three/dom';
import {SceneGraph} from '../scene-graph';
import {NgtsStats} from 'angular-three-soba/stats';

@Component({
  selector: 'app-scene',
  imports: [NgtCanvas, SceneGraph, NgtCanvasImpl, NgtCanvasContent, NgtsStats],
  template: `
        <ngt-canvas stats>
            <app-scene-graph  *canvasContent />
        </ngt-canvas>
    `,
  styleUrl: './scene.scss',
})
export class SceneComponent {}
