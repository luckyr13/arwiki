import { Component, OnInit, OnDestroy, Input } from '@angular/core';

@Component({
  selector: 'app-donations-made',
  templateUrl: './donations-made.component.html',
  styleUrls: ['./donations-made.component.scss']
})
export class DonationsMadeComponent implements OnInit, OnDestroy {
  @Input('address') address: string = '';

  constructor() { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

}
