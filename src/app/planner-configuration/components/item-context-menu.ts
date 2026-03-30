import {Component, inject, signal} from '@angular/core';
import {ItemFocusService} from '../../planner-scene/services/item-focus.service';
import {ConfigurationStore} from '../../store/store';
import {Button} from 'primeng/button';
import {ItemPropertiesSidebar} from './item-properties-sidebar';
import {ItemSpecModal} from './item-spec-modal';

@Component({
  selector: 'app-item-context-menu',
  standalone: true,
  imports: [Button, ItemPropertiesSidebar, ItemSpecModal],
  styles: `
    .item-ctx-menu {
      position: fixed;
      z-index: 1000;
      display: flex;
      flex-direction: row;
      gap: 2px;
      background: var(--p-surface-overlay, #fff);
      opacity: 0.7;
      border: 1px solid var(--p-surface-border, #ddd);
      border-radius: 8px;
      padding: 4px;
      box-shadow: 0 4px 16px rgba(0,0,0,.15);
    }
  `,
  template: `
    @if (focusService.focusedItemId() !== null && !focusService.isDragging()) {
      <div class="item-ctx-menu"
           [style.left.px]="focusService.screenPosition()!.x + 16"
           [style.top.px]="focusService.screenPosition()!.y - 60">
        <p-button icon="pi pi-copy"      severity="secondary" [text]="true" size="small" pTooltip="Копировать"   (onClick)="copy()"/>
        <p-button icon="pi pi-sync"      severity="secondary" [text]="true" size="small" pTooltip="Заменить"     (onClick)="replace()"/>
        <p-button icon="pi pi-sliders-h" severity="secondary" [text]="true" size="small" pTooltip="Свойства"     (onClick)="propertiesVisible.set(true)"/>
        <p-button icon="pi pi-list"      severity="secondary" [text]="true" size="small" pTooltip="Спецификация" (onClick)="specVisible.set(true)"/>
        <p-button icon="pi pi-trash"     severity="danger"    [text]="true" size="small" pTooltip="Удалить"      (onClick)="delete()"/>
      </div>
    }

    <app-item-properties-sidebar [(visible)]="propertiesVisible"/>
    <app-item-spec-modal         [(visible)]="specVisible"/>
  `,
})
export class ItemContextMenuComponent {
  protected readonly focusService = inject(ItemFocusService);
  private  readonly configStore   = inject(ConfigurationStore);

  protected propertiesVisible = signal(false);
  protected specVisible       = signal(false);

  protected copy(): void {
    const id = this.focusService.focusedItemId();
    if (id !== null) this.focusService.requestCopy(id);
  }

  protected replace(): void {
    console.log('replace item', this.focusService.focusedItemId());
  }

  protected delete(): void {
    const id = this.focusService.focusedItemId();
    if (id !== null) {
      this.configStore.removeItem(id);
      this.focusService.clearFocus();
    }
  }
}
