import {Component, model} from '@angular/core';
import {Dialog} from 'primeng/dialog';

@Component({
  selector: 'app-item-spec-modal',
  standalone: true,
  imports: [Dialog],
  template: `
    <p-dialog [(visible)]="visible" header="Спецификация модуля" [modal]="true" [style]="{width: '600px'}">
      <!-- TODO: specification content -->
    </p-dialog>
  `,
})
export class ItemSpecModal {
  visible = model(false);
}
