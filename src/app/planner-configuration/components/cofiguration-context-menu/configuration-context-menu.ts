import {Component, OnInit, ViewChild} from '@angular/core';
import {SpeedDial} from 'primeng/speeddial';
import {MenuItem} from 'primeng/api';

@Component({
  selector: 'app-configuration-context-menu',
  imports: [
    SpeedDial
  ],
  templateUrl: './configuration-context-menu.html',
  styleUrl: './configuration-context-menu.scss',
})
export class ConfigurationContextMenu implements OnInit {
  @ViewChild('dial') dial!: SpeedDial;
  public items: MenuItem[] | null = null;

  ngOnInit(): void {
    this.items = [
      {
        icon: 'pi pi-arrow-circle-left',
        label: 'Отменить действие',
        command: () => {
          setTimeout(() => this.dial.show());
          console.log(this.dial)
          console.log('2')
        }
      },
      {
        icon: 'pi pi-arrow-circle-right',
        label: 'Вернуть действие',
        command: () => {
          setTimeout(() => this.dial.show());
          console.log('2')
        }
      },
      {
        icon: 'pi pi-eye',
        label: 'Показать/скрыть размерные линии',
        command: () => {
          setTimeout(() => this.dial.show());
          console.log('penc')
        }
      },
      {
        icon: 'pi pi-box',
        label: 'Скетч вид',
        command: () => {
          setTimeout(() => this.dial.show());
          console.log('3')
        }
      },
      {
        icon: 'pi pi-eraser',
        label: 'Удалить все',
        command: () => {
          setTimeout(() => this.dial.show());
          console.log('3')
        }
      },
      {
        icon: 'pi pi-file-plus',
        label: 'Создать проект',
        command: () => {
          setTimeout(() => this.dial.show());
          console.log('3')
        }
      },
      {
        icon: 'pi pi-save',
        label: 'Сохранить проект',
        command: () => {
          setTimeout(() => this.dial.show());
          console.log('3')
        }
      },
      {
        icon: 'pi pi-share-alt',
        label: 'Поделиться проектом',
        command: () => {
          setTimeout(() => this.dial.show());
          console.log('3')
        }
      },
      {
        icon: 'pi pi-file-pdf',
        label: 'Экспорт спецификации',
        command: () => {
          setTimeout(() => this.dial.show());
          console.log('3')
        }
      },
    ];
  }

  check($e: any): void {

  }
}
