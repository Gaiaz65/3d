import {Component, inject, OnInit, signal, ViewChild, WritableSignal} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {Panel} from 'primeng/panel';
import {InputNumberModule} from 'primeng/inputnumber';
import {Button} from 'primeng/button';
import {ConfigurationStore} from '../../store/store';
import {HttpClient} from '@angular/common/http';
import {Tooltip} from 'primeng/tooltip';
import {OptionGroup} from '../../planner-scene/interfaces/unit-config.interface';
import {take} from 'rxjs';
import {UnitAddModal} from './unit-add-modal';
import {updateUrl} from '../../planner-scene/utils/image.util';

@Component({
  selector: 'app-configuration-utils',
  imports: [
    ReactiveFormsModule,
    Panel,
    InputNumberModule,
    Button,
    Tooltip,
    UnitAddModal,
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
                <img [src]="'assets/suraScreens/'+object.title+'.jpg'" (error)="updateUrl($event)" alt="-">
                <p-button (click)="openAddModal(object, $index)" [label]="'Добавить'"/>
              </div>
            }
          </div>
        </p-panel>
      }
    </section>

    <app-unit-add-modal #addModal/>
  `
})
export class ConfigurationUtilObjects implements OnInit {
  @ViewChild('addModal') addModal!: UnitAddModal;

  public sections: WritableSignal<any> = signal([]);
  private filteredSections: string[] = [
    'equipments',
    'builtInEquipments',
    'topVitrinaUnits',
    'facades',
  ];

  private configStore = inject(ConfigurationStore);
  private http = inject(HttpClient);

  ngOnInit(): void {
    this.http.get('assets/configs/init/init.json')
      .pipe(take(1))
      .subscribe((res: any) => {
        this.sections.set(
          res
            .filter((section: OptionGroup) => !this.filteredSections.includes(section.id))
            .map((section: any) => ({
              ...section,
              items: (section.items ?? []).map((item: any) => ({...item, sectionId: section.id})),
            }))
        );
      });
  }

  public openAddModal(obj: any, inx: number): void {
    this.addModal.open(obj, (cfg, material) => {
      if (material) this.configStore.setFacadeStyle(material);
      this.configStore.addItem(cfg);
    });
  }

  public updateUrl($event: any): void {
    updateUrl($event);
  }
}
