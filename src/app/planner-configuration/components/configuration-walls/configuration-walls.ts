import {Component, effect, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {Panel} from 'primeng/panel';
import {InputNumberModule} from 'primeng/inputnumber';
import {Button} from 'primeng/button';
import {ConfigurationStore} from '../../../store/store';
import {IWall} from '../../../planner-scene/interfaces/configuration';

@Component({
  selector: 'app-configuration-walls',
  imports: [
    ReactiveFormsModule,
    Panel,
    InputNumberModule,
    Button,
  ],
  providers: [],
  templateUrl: './configuration-walls.html',
  styleUrl: './configuration-walls.scss',
})
export class ConfigurationWalls {
  public walls: IWall[] = [
    {
      id: 0,
      url: 'assets/walls/blueWall.jpg',
      title: 'Голубые обои',
    },
    {
      id: 1,
      url: 'assets/walls/defaultWall.jpg',
      title: 'Стандартные обои',
    },
    {
      id: 2,
      url: 'assets/walls/greenWall.jpg',
      title: 'Зеленые обои',
    },
    {
      id: 3,
      url: 'assets/walls/orangeWall.jpg',
      title: 'Оранжевые обои',
    },
    {
      id: 4,
      url: 'assets/walls/whiteWall.jpg',
      title: 'Белые обои',
    },
  ];
  public currentWall!: IWall;

  private configStore = inject(ConfigurationStore);

  constructor() {
    effect(() => {
      this.currentWall = this.configStore.currentWall();
    });
  }

  public selectWall(wall:IWall): void {
    this.configStore.setCurrentWall(wall);
  }
}
