import {Component, DOCUMENT, inject, OnInit, Renderer2} from '@angular/core';
import {Panel} from 'primeng/panel';
import {Item} from './item/item';
import {CdkDropList} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-items-list',
  imports: [
    Panel,
    Item,
    CdkDropList
  ],
  templateUrl: './items-list.html',
  styleUrl: './items-list.scss',
})
export class ItemsList implements OnInit {

  public items: any[] = [
    {
      type: 'floor',
      title: 'На пол',
      items: [
        {id: 1, imageUrl: 'src/assets/floor.png', title: 'cube'},
      ]
    },
    {
      type: 'wall',
      title: 'На стену',
      items: [
        {id: 2, imageUrl: 'assets/img/wall.png', title: 'round'},
      ]
    }
  ];

  private readonly renderer: Renderer2 = inject(Renderer2);
  private readonly document: Document = inject(DOCUMENT);

  ngOnInit(): void {
    // роут на запрос данных
    // Вид => items
  }

  public handleDragClass(value: boolean): void {
    if (value) {
      this.renderer.addClass(this.document.body,'drag-cursor');
    } else {
      this.renderer.removeClass(this.document.body,'drag-cursor');
    }
  }
}
