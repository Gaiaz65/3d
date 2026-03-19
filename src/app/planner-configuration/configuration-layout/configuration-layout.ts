import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Slider} from 'primeng/slider';
import {Panel} from 'primeng/panel';
import {InputNumberModule} from 'primeng/inputnumber';
import {debounceTime, distinctUntilChanged} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ConfigurationService} from '../services/configuration.service';
import {ConfigurationStore} from '../../store/store';
import {ConfigurationForm} from '../components/configuration-form/configuration-form';
import {ConfigurationFloor} from '../components/configuration-floor/configuration-floor';
import {ConfigurationWalls} from '../components/configuration-walls/configuration-walls';
import {ConfigurationContextMenu} from '../components/cofiguration-context-menu/configuration-context-menu';


@Component({
  selector: 'app-configuration-layout',
  imports: [
    ReactiveFormsModule,
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
