import {Component} from '@angular/core';
import {SceneComponent} from '../planner-scene/scene/scene';
import {ConfigurationLayout} from '../planner-configuration/configuration-layout/configuration-layout';
import {ItemContextMenuComponent} from '../planner-configuration/components/item-context-menu/item-context-menu';
import {Toast} from 'primeng/toast';

@Component({
  selector: 'app-layout',
  imports: [
    SceneComponent,
    ConfigurationLayout,
    ItemContextMenuComponent,
    Toast,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {

}
