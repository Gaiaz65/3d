import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CdkDrag} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-item',
  imports: [
    CdkDrag
  ],
  templateUrl: './item.html',
  styleUrl: './item.scss',
})
export class Item {
  @Output() public dragEvent = new EventEmitter<boolean>();
  @Input({required:true}) imgSrc!: string;
  @Input({required:true}) imgTitle!: string;
  @Input({required:true}) configuration!: any;

  public dragEventHandler(value: boolean): void {
    this.dragEvent.emit(value);
  }
}
