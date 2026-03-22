import {ChangeDetectorRef, Component, computed, effect, inject, model, signal, untracked} from '@angular/core';
import {Drawer} from 'primeng/drawer';
import {SelectButton} from 'primeng/selectbutton';
import {FormsModule} from '@angular/forms';
import {ItemFocusService} from '../../../planner-scene/services/item-focus.service';
import {ConfigurationStore} from '../../../store/store';

@Component({
  selector: 'app-item-properties-sidebar',
  standalone: true,
  imports: [Drawer, SelectButton, FormsModule],
  template: `
    <p-drawer [(visible)]="visible" header="Свойства объекта" position="right" [style]="{width: '320px'}">
      @if (item(); as it) {
        <div class="props-body">
          <div class="prop-row">
            <span class="prop-label">Ширина</span>
            <span class="prop-value">{{ it.size[0] }} мм</span>
          </div>
          <div class="prop-row">
            <span class="prop-label">Высота</span>
            <span class="prop-value">{{ it.size[1] }} мм</span>
          </div>
          <div class="prop-row">
            <span class="prop-label">Глубина</span>
            <span class="prop-value">{{ it.size[2] }} мм</span>
          </div>

          <div class="prop-section">Поворот</div>
          <p-select-button
            [options]="rotationOptions"
            [ngModel]="displayedRotation()"
            (ngModelChange)="onRotation(it.id, $event)"
            optionLabel="label"
            optionValue="value"/>
        </div>
      }
    </p-drawer>
  `,
  styles: [`
    .props-body { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
    .prop-row { display: flex; justify-content: space-between; align-items: center; }
    .prop-label { color: var(--p-text-muted-color, #888); font-size: 13px; }
    .prop-value { font-weight: 600; }
    .prop-section { font-weight: 600; margin-top: 8px; }
  `],
})
export class ItemPropertiesSidebar {
  visible = model(false);

  private readonly focusService = inject(ItemFocusService);
  private readonly configStore  = inject(ConfigurationStore);
  private readonly cdr          = inject(ChangeDetectorRef);

  protected readonly item = computed(() => {
    const id = this.focusService.focusedItemId();
    return this.configStore.items().find(i => i.id === id) ?? null;
  });

  private readonly pendingRotation = signal<number | null>(null);

  protected readonly displayedRotation = computed(() =>
    this.pendingRotation() ?? (this.item()?.rotation ?? 0)
  );

  protected readonly rotationOptions = [
    {label: '-90°', value: -90},
    {label: '-45°', value: -45},
    {label: '0°',   value:   0},
    {label: '45°',  value:  45},
    {label: '90°',  value:  90},
  ];

  constructor() {
    effect(() => {
      const result = this.focusService.rotationResult();
      if (result !== null) {
        untracked(() => {
          this.pendingRotation.set(null);
          this.cdr.detectChanges();
        });
      }
    });
  }

  protected onRotation(id: number, rotation: number): void {
    this.pendingRotation.set(rotation);
    this.focusService.requestRotation(id, rotation);
  }
}
