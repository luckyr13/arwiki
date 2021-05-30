import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-balance-card',
  templateUrl: './balance-card.component.html',
  styleUrls: ['./balance-card.component.scss']
})
export class BalanceCardComponent implements OnInit {
	@Input() loading: boolean = false;
	@Input() balance: string = '';
	@Input() label: string = '';
	@Input() unit: string = '';
	
  constructor() { }

  ngOnInit(): void {
  }

}
