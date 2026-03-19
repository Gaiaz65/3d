import {Component} from '@angular/core';
import {InputNumberModule} from 'primeng/inputnumber';
import {ConfigurationForm} from '../components/configuration-form/configuration-form';
import {ConfigurationFloor} from '../components/configuration-floor/configuration-floor';
import {ConfigurationWalls} from '../components/configuration-walls/configuration-walls';
import {ConfigurationContextMenu} from '../components/cofiguration-context-menu/configuration-context-menu';


@Component({
  selector: 'app-configuration-layout',
  imports: [
    InputNumberModule,
    ConfigurationForm,
    ConfigurationFloor,
    ConfigurationWalls,
    ConfigurationContextMenu,
  ],
  providers: [],
  templateUrl: './configuration-layout.html',
  styleUrl: './configuration-layout.scss',
})
export class ConfigurationLayout {

}
