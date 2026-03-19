import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Slider} from 'primeng/slider';
import {Panel} from 'primeng/panel';
import {InputNumberModule} from 'primeng/inputnumber';
import {debounceTime, distinctUntilChanged} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ConfigurationService} from '../../services/configuration.service';
import {ConfigurationStore} from '../../../store/store';

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
  ],
  providers: [],
  templateUrl: './configuration-form.html',
  styleUrl: './configuration-form.scss',
})
export class ConfigurationForm implements OnInit {
  public form: FormGroup = new FormGroup({
    width: new FormControl<number>(5000, {nonNullable: true}),
    depth: new FormControl<number>(4000, {nonNullable: true}),
    height: new FormControl<number>(2500, {nonNullable: true}),
  });
  public readonly formConfig = FORM_CONFIG;

  private destroyRef: DestroyRef = inject(DestroyRef)
  private configurationStore = inject(ConfigurationStore);

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(500),
        distinctUntilChanged((a: Record<string, number>,b: Record<string, number>)=> {
        return JSON.stringify(a) === JSON.stringify(b);
      }))
      .subscribe(
        (val: Record<string, number>) => {
          this.form.patchValue({...val});
          this.configurationStore.updateRoomSize({size:{
              x: val['width'],
              y: val['height'],
              z: val['depth'],
            }})
        }
      );
  }

  public checkOnBlur(controlName:string, minValue: number): void {
    const control = this.form.get(controlName);
    if (control && !control.value) {
      control.patchValue(minValue);
    }
  }
}
