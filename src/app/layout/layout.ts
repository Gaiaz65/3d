import {Component} from '@angular/core';
import {SceneComponent} from '../planner-scene/scene/scene';
import {ConfigurationLayout} from '../planner-configuration/configuration-layout/configuration-layout';

@Component({
  selector: 'app-layout',
  imports: [
    SceneComponent,
    ConfigurationLayout
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {

}
