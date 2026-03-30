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
import {take} from 'rxjs';

@Component({
  selector: 'app-configuration-utils',
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
      @for (section of sections(); track section.id) {
        <p-panel class="full-width configuration-container"
                 [header]="section.title"
                 [toggleable]="true"
                 [collapsed]="true">
          <div class="configuration-list__container">
            @for (object of section.items; track $index) {
              <div class="configuration-list__item">
                <div class="configuration-list__item-title" [innerText]="object.title" [pTooltip]="object.title"></div>
                <img [src]="object.url">
                <p-button (click)="createObject(object)"
                          [label]="'Добавить'"></p-button>
              </div>
            }
          </div>
        </p-panel>
      }
    </section>
  `
})
export class ConfigurationUtilObjects implements OnInit {
  public sections: WritableSignal<any> = signal([]);
  private filteredSections: string[] = [
    'equipments',
    'builtInEquipments',
    'topVitrinaUnits',
    'facades',
  ]

  private configStore = inject(ConfigurationStore);
  private http = inject(HttpClient);
  private readonly builder = inject(UnitBuilderService);

  ngOnInit(): void {
    this.http.get('assets/configs/init/init.json')
      .pipe(take(1))
      .subscribe((res: any) => {
        this.sections.set(res.filter((section: OptionGroup) => !this.filteredSections.includes(section.id)));
      })
  }

  public createObject(obj: any): void {
    console.log(obj)
    const item = this.builder.build(obj);
    console.log(item)
    this.configStore.addItem(item)
  }
}
