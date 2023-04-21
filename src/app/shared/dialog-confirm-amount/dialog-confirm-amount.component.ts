import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { UntypedFormControl } from '@angular/forms';
import { UserSettingsService } from '../../core/user-settings.service';

@Component({
  selector: 'app-dialog-confirm-amount',
  templateUrl: './dialog-confirm-amount.component.html',
  styleUrls: ['./dialog-confirm-amount.component.scss']
})
export class DialogConfirmAmountComponent implements OnInit {
	pageValue: UntypedFormControl = new UntypedFormControl(0);
  maxValue = 0;
  ticker = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _userSettings: UserSettingsService) { }

  ngOnInit(): void {
    const pageValue = +this.data.pageValue;
    if (Number.isInteger(pageValue)) {
      // this.pageValue.setValue(pageValue);
      this.maxValue = 1000 + pageValue;
    }
    this.ticker = this._userSettings.getTokenTicker();
  }

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.floor(value / 1000) + 'k';
    }
    return `${value}`;
  }

}
