import {Component, effect, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {Panel} from 'primeng/panel';
import {InputNumberModule} from 'primeng/inputnumber';
import {Button} from 'primeng/button';
import {ConfigurationStore} from '../../store/store';
import {IWall} from '../../planner-scene/interfaces/configuration';
import {HttpClient} from '@angular/common/http';
import {UnitBuilderService} from '../../planner-scene/services/unit-builder.service';
import {Tooltip} from 'primeng/tooltip';
import {OptionGroup} from '../../planner-scene/interfaces/unit-config.interface';

@Component({
  selector: 'app-configuration-facades',
  imports: [
    ReactiveFormsModule,
    Panel,
    InputNumberModule,
    Button,
    Tooltip,
  ],
  providers: [],
  template: `
    <section class="configuration-sections">
      <p-panel class="full-width configuration-container"
               [header]="'Материалы (ТЕСТ)'"
               [toggleable]="true"
               [collapsed]="true">
        <div class="configuration-list__container">
          @for (material of materials(); track $index) {
            <div class="configuration-list__item">
              <div class="configuration-list__item-title" [innerText]="material.title" [pTooltip]="material.title"></div>
              @if (material.image && material.textures.length) {
                <img [src]="material.image">
              } @else {
                <div class="color" [style.background-color]="material.color ?? material.emissiveColor"></div>
              }
              <p-button (click)="applyFacade(material)"
                        [label]="'Применить'"></p-button>
            </div>
          }
        </div>
      </p-panel>
    </section>
  `
})
export class ConfigurationMaterials implements OnInit {
  public materials: WritableSignal<any> = signal([]);
  private filteredSections: string[] = ['facades']

  private configStore = inject(ConfigurationStore);
  private http = inject(HttpClient);

  ngOnInit(): void {
    this.http.get('assets/configs/init/materials-sura.json').subscribe(
      (raw: any) => {
        const res = raw.map((item: any) => {
          if (item.textures.length > 0) {
              //TODO убрать заглушку и добавить обработку репита в three-unit component
            item.textures[0].path = 'assets/furniture/material/map1.png';
            item.image = 'assets/furniture/material/map1.png';
          }
          return {
            ...item
          }
        })
        this.materials.set(res);
      }
    )
  }

  public applyFacade(obj: any): void {
    this.configStore.setFacadeStyle(obj);
  }
}
