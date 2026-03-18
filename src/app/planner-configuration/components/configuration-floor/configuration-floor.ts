import {Component, effect, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {Panel} from 'primeng/panel';
import {IWall} from '../../../planner-scene/interfaces/configuration';
import {ConfigurationStore} from '../../../store/store';
import {Button} from 'primeng/button';


@Component({
  selector: 'app-configuration-floor',
  imports: [
    ReactiveFormsModule,
    Panel,
    Button,
  ],
  providers: [],
  templateUrl: './configuration-floor.html',
  styleUrl: './configuration-floor.scss',
})
export class ConfigurationFloor{
  public floor: IWall[] = [
    {
      id: 0,
      url: 'assets/floor/darkWoodFloor.png',
      title: 'Темное дерево',
    },
    {
      id: 1,
      url: 'assets/floor/defaultFloor.jpg',
      title: 'Стандартный пол',
    },
    {
      id: 2,
      url: 'assets/floor/greenTileFloor.png',
      title: 'Зеленая плитка',
    },
    {
      id: 3,
      url: 'assets/floor/whiteFloor.png',
      title: 'Белое дерево',
    },
    {
      id: 4,
      url: 'assets/floor/whiteTileDefault.png',
      title: 'Белая квадратная плитка',
    },
    {
      id: 5,
      url: 'assets/floor/woodFloor.png',
      title: 'Светлое дерево',
    },
  ];
  public currentFloor!: IWall;

  private configStore = inject(ConfigurationStore);

  constructor() {
    effect(() => {
      this.currentFloor = this.configStore.currentFloor();
    });
  }

  public selectFloor(floor:IWall): void {
    this.configStore.setCurrentFloor(floor);
  }
}
