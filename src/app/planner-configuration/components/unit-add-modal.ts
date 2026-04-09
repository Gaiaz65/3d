import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {take} from 'rxjs';
import {Button} from 'primeng/button';
import {Dialog} from 'primeng/dialog';
import {SelectButton} from 'primeng/selectbutton';
import {Tooltip} from 'primeng/tooltip';
import {ConfigurationStore} from '../../store/store';
import {PrimeTemplate} from 'primeng/api';

@Component({
  selector: 'app-unit-add-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Dialog, Button, SelectButton, FormsModule, Tooltip, PrimeTemplate],
  template: `
    <p-dialog
      [header]="config()?.title ?? 'Добавить модуль'"
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '800px', maxWidth: '95vw' }"
    >
      @if (config(); as cfg) {

        <!-- ── Общая информация ──────────────────────────────────────── -->
        <div class="unit-info">
          @if (cfg.image) {
            <img [src]="cfg.image" class="unit-image" [alt]="cfg.title">
          }
          <div class="unit-meta">
            <div class="unit-title">{{ cfg.title }}</div>
            <div class="unit-dims">
              @if (cfg.widthText)  { <span>Ш: {{ cfg.widthText }}</span> }
              @if (cfg.heightText) { <span>В: {{ cfg.heightText }}</span> }
              @if (cfg.depthText)  { <span>Г: {{ cfg.depthText }}</span> }
            </div>
            @if (cfg.level) {
              <span class="unit-badge">{{ cfg.level === 'bottom' ? 'Нижний' : 'Верхний' }}</span>
            }
          </div>
        </div>

        <!-- ── radioButton-настройки ────────────────────────────────── -->
        @if (radioOptions().length) {
          <div class="section-title">Настройки</div>
          @for (opt of radioOptions(); track opt.id) {
            <div class="radio-group">
              <div class="radio-group__label">{{ opt.title }}</div>
              <p-select-button
                [options]="opt.items"
                [ngModel]="radioValues()[opt.id]"
                (ngModelChange)="setRadio(opt.id, $event)"
                optionLabel="title"
                optionValue="id"
              />
            </div>
          }
        }

        <!-- ── Цвет фасада ──────────────────────────────────────────── -->
        <div class="section-title">Цвет фасада</div>
        <div class="color-grid">
          @for (mat of materials(); track mat.id) {
            <div
              class="color-chip"
              [class.selected]="selectedMaterial()?.id === mat.id"
              (click)="selectedMaterial.set(mat)"
              [pTooltip]="mat.title"
              tooltipPosition="top"
            >
              @if (mat.textures?.length && mat.image) {
                <img [src]="mat.image" class="color-chip__img">
              } @else {
                <div class="color-chip__fill" [style.background-color]="mat.color ?? mat.emissiveColor"></div>
              }
              <span class="color-chip__label">{{ mat.title }}</span>
            </div>
          }
        </div>
      }

      <ng-template pTemplate="footer">
        <p-button label="Отмена" severity="secondary" (click)="cancel()"/>
        <p-button label="Добавить на сцену" icon="pi pi-plus" (click)="confirm()"/>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .unit-info {
      display: flex; gap: 14px; align-items: flex-start; margin-bottom: 4px;
    }
    .unit-image {
      width: 110px; height: 90px; object-fit: contain;
      border-radius: 6px; border: 1px solid #e0e0e0; flex-shrink: 0;
    }
    .unit-meta { display: flex; flex-direction: column; gap: 6px; }
    .unit-title { font-weight: 600; font-size: 14px; line-height: 1.3; }
    .unit-dims { display: flex; gap: 10px; font-size: 12px; color: #777; }
    .unit-badge {
      display: inline-block; padding: 2px 8px;
      background: #eef2ff; color: #4f46e5;
      border-radius: 12px; font-size: 11px; font-weight: 500;
    }
    .section-title {
      font-weight: 600; font-size: 13px; margin: 16px 0 8px; color: #333;
      border-bottom: 1px solid #eee; padding-bottom: 4px;
    }
    .radio-group { margin-bottom: 12px; }
    .radio-group__label { font-size: 12px; color: #555; margin-bottom: 6px; }
    .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
      gap: 8px; max-height: 200px; overflow-y: auto; padding: 2px;
    }
    .color-chip {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      cursor: pointer; padding: 4px; border-radius: 6px;
      border: 2px solid transparent; transition: border-color .15s;
    }
    .color-chip:hover  { border-color: #93c5fd; }
    .color-chip.selected { border-color: #3b82f6; }
    .color-chip__fill {
      width: 44px; height: 44px; border-radius: 4px;
      border: 1px solid rgba(0,0,0,.1);
    }
    .color-chip__img {
      width: 44px; height: 44px; object-fit: cover; border-radius: 4px;
    }
    .color-chip__label {
      font-size: 10px; text-align: center; color: #555; line-height: 1.2;
      max-width: 62px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
  `],
})
export class UnitAddModal {
  readonly visible = signal(false);
  readonly config  = signal<any>(null);
  readonly selectedMaterial = signal<any>(null);
  readonly materials = signal<any[]>([]);
  readonly radioValues = signal<Record<string, string>>({});

  readonly radioOptions = computed(() => {
    const cfg = this.config();
    if (!cfg) return [];
    const result: any[] = [];
    for (const opt of cfg.options ?? []) {
      if (opt.isGroup) {
        for (const sub of opt.options ?? []) {
          if (sub.type === 'radioButton' || sub.type === 'radiobutton') result.push(sub);
        }
      } else if (opt.type === 'radioButton' || opt.type === 'radiobutton') {
        result.push(opt);
      }
    }
    return result;
  });

  private confirmCb?: (cfg: any, material: any) => void;

  private readonly store = inject(ConfigurationStore);
  private readonly http  = inject(HttpClient);

  constructor() {
    this.http.get<any[]>('assets/configs/init/materials-sura.json')
      .pipe(take(1))
      .subscribe(data => {
        this.materials.set(data);
        const def = data.find(m => m.isDefault) ?? data[0];
        if (def) this.selectedMaterial.set(def);
      });
  }

  open(config: any, onConfirm: (cfg: any, material: any) => void): void {
    this.config.set(config);
    this.confirmCb = onConfirm;

    const values: Record<string, string> = {};
    for (const opt of this.radioOptions()) {
      values[opt.id] = opt.defaultValue ?? opt.items?.[0]?.id ?? '';
    }
    this.radioValues.set(values);
    this.visible.set(true);
  }

  setRadio(optId: string, value: string): void {
    this.radioValues.set({ ...this.radioValues(), [optId]: value });
  }

  confirm(): void {
    const patched = this.patchedConfig();
    this.confirmCb?.(patched, this.selectedMaterial());
    this.visible.set(false);
  }

  cancel(): void {
    this.visible.set(false);
  }

  private patchedConfig(): any {
    const cfg = structuredClone(this.config());
    const values = this.radioValues();
    for (const opt of cfg.options ?? []) {
      if (opt.isGroup) {
        for (const sub of opt.options ?? []) {
          if ((sub.type === 'radioButton' || sub.type === 'radiobutton') && values[sub.id] !== undefined) {
            sub.defaultValue = values[sub.id];
          }
        }
      } else if ((opt.type === 'radioButton' || opt.type === 'radiobutton') && values[opt.id] !== undefined) {
        opt.defaultValue = values[opt.id];
      }
    }
    return cfg;
  }
}
