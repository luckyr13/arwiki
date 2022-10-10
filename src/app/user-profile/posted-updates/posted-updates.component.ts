import { Component, OnInit, OnDestroy, Input } from '@angular/core';

@Component({
  selector: 'app-posted-updates',
  templateUrl: './posted-updates.component.html',
  styleUrls: ['./posted-updates.component.scss']
})
export class PostedUpdatesComponent implements OnInit, OnDestroy {
  @Input('address') address: string = '';

  constructor() { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

}
