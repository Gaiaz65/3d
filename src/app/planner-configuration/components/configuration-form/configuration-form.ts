import {Component, DestroyRef, effect, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Slider} from 'primeng/slider';
import {Panel} from 'primeng/panel';
import {InputNumberModule} from 'primeng/inputnumber';
import {debounceTime, distinctUntilChanged, take} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ConfigurationStore} from '../../../store/store';
import {Button} from 'primeng/button';
import {HttpClient} from '@angular/common/http';
import {IWall} from '../../../planner-scene/interfaces/configuration';

const FORM_CONFIG = [
  {min: 1000, max: 10000, controlName: 'width', label: 'Ширина'},
  {min: 1000, max: 10000, controlName: 'depth', label: 'Длинна'},
  {min: 2000, max: 3800, controlName: 'height', label: 'Высота'},
]

@Component({
  selector: 'app-configuration-form',
  imports: [
    ReactiveFormsModule,
    Slider,
    Panel,
    InputNumberModule,
    Button,
  ],
  providers: [],
  templateUrl: './configuration-form.html',
  styleUrl: './configuration-form.scss',
})
export class ConfigurationForm implements OnInit {

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
    {
      id: 5,
      url: 'assets/walls/pictureWall.jpg',
      title: 'Обои с рисунком',
    },
  ];
  public currentWall!: IWall;

  public form: FormGroup = new FormGroup({
    width: new FormControl<number>(5000, {nonNullable: true}),
    depth: new FormControl<number>(4000, {nonNullable: true}),
    height: new FormControl<number>(2500, {nonNullable: true}),
  });
  public readonly formConfig = FORM_CONFIG;
  public utilities: WritableSignal<any[]> = signal([])
  public communications: WritableSignal<any[]> = signal([])

  private destroyRef: DestroyRef = inject(DestroyRef)
  private configurationStore = inject(ConfigurationStore);
  private http = inject(HttpClient);

  constructor() {
    effect(() => {
      this.currentFloor = this.configurationStore.currentFloor();
    });

    effect(() => {
      this.currentWall = this.configurationStore.currentWall();
    });
  }

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(500),
        distinctUntilChanged((a: Record<string, number>, b: Record<string, number>) => {
          return JSON.stringify(a) === JSON.stringify(b);
        }))
      .subscribe(
        (val: Record<string, number>) => {
          this.form.patchValue({...val});
          this.configurationStore.updateRoomSize({
            size: {
              x: val['width'],
              y: val['height'],
              z: val['depth'],
            }
          })
        }
      );

    this.http.get('assets/configs/init/constructive.json')
      .pipe(take(1))
      .subscribe((res: any) => {
        const utilities: any[] = [];
        const communications: any[] = [];
        res.forEach((item: any) => {
          if (item.id === 'decor') {
            communications.push(...item.items);
          } else {
            utilities.push(...item.items);
          }
        })
        this.utilities.set(utilities.map((item: any) => {
          return {
            ...item,
            sectionId: 'utilities',
          };
        }));

        this.communications.set(communications.map((item: any) => {
          return {
            ...item,
            sectionId: 'utilities',
          };
        }));
      })

  }

  public checkOnBlur(controlName: string, minValue: number): void {
    const control = this.form.get(controlName);
    if (control && !control.value) {
      control.patchValue(minValue);
    }
  }

  public createUtilityObject(obj: any): void {
    this.configurationStore.addItem(obj);
  }


  public createCommunicationObject(obj: any): void {
    this.configurationStore.addItem(obj);
  }

  public selectFloor(floor: IWall): void {
    this.configurationStore.setCurrentFloor(floor);
  }

  public selectWall(wall: IWall): void {
    this.configurationStore.setCurrentWall(wall);
  }

}
