import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-dialog-confirm-amount',
  templateUrl: './dialog-confirm-amount.component.html',
  styleUrls: ['./dialog-confirm-amount.component.scss']
})
export class DialogConfirmAmountComponent implements OnInit {
	pageValue: FormControl = new FormControl(this.data.pageValue);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    const pageValue = +this.data.pageValue;
    if (Number.isInteger(pageValue)) {
      this.pageValue.setValue(pageValue);
    }
  }

  formatLabel(value: number) {
    if (value >= 1000) {
      return Math.floor(value / 1000) + 'k';
    }
    return value;
  }

}
