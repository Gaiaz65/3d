import {Component, inject, OnInit, ViewChild} from '@angular/core';
import {SpeedDial} from 'primeng/speeddial';
import {MenuItem} from 'primeng/api';
import {ConfigurationStore} from '../../store/store';

@Component({
  selector: 'app-configuration-context-menu',
  imports: [
    SpeedDial
  ],
  template: `
    <p-speeddial #dial
                 [model]="items"
                 [hideOnClickOutside]="false"
                 [tooltipOptions]="{tooltipPosition: 'bottom'}"
                 [style]="{ position: 'absolute', left: '33%', top: '1%' }"
                 direction="right"/>
  `,
})
export class ConfigurationContextMenu implements OnInit {
  @ViewChild('dial') dial!: SpeedDial;
  public items: MenuItem[] | null = null;
  private configStore = inject(ConfigurationStore);

  ngOnInit(): void {
    this.items = [
      {
        icon: 'pi pi-arrow-circle-left',
        label: 'Отменить действие',
        command: () => {
          setTimeout(() => this.dial.show());
        }
      },
      {
        icon: 'pi pi-arrow-circle-right',
        label: 'Вернуть действие',
        command: () => {
          setTimeout(() => this.dial.show());
        }
      },
      {
        icon: 'pi pi-eye',
        label: 'Показать/скрыть размерные линии',
        command: () => {
          setTimeout(() => this.dial.show());
          this.configStore.toggleSizeLines(!this.configStore.showSizeLines());
        }
      },
      {
        icon: 'pi pi-box',
        label: 'Скетч вид',
        command: () => {
          setTimeout(() => this.dial.show());
          this.configStore.toggleSketchView(!this.configStore.isSketchView());
        }
      },
      {
        icon: 'pi pi-eraser',
        label: 'Удалить все',
        command: () => {
          this.configStore.clearItems();
        }
      },
      {
        icon: 'pi pi-file-plus',
        label: 'Создать проект',
        command: () => {
          setTimeout(() => this.dial.show());
        }
      },
      {
        icon: 'pi pi-save',
        label: 'Сохранить проект',
        command: () => {
          setTimeout(() => this.dial.show());

        }
      },
      {
        icon: 'pi pi-share-alt',
        label: 'Поделиться проектом',
        command: () => {
          setTimeout(() => this.dial.show());

        }
      },
      {
        icon: 'pi pi-file-pdf',
        label: 'Экспорт спецификации',
        command: () => {
          setTimeout(() => this.dial.show());
        }
      },
    ];
  }
}
