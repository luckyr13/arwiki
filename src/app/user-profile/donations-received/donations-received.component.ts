import { Component, OnInit, OnDestroy, Input } from '@angular/core';

@Component({
  selector: 'app-donations-received',
  templateUrl: './donations-received.component.html',
  styleUrls: ['./donations-received.component.scss']
})
export class DonationsReceivedComponent implements OnInit, OnDestroy {
  @Input('address') address: string = '';

  constructor() { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

}
