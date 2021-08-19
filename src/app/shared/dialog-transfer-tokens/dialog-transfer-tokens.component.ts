import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-transfer-tokens',
  templateUrl: './dialog-transfer-tokens.component.html',
  styleUrls: ['./dialog-transfer-tokens.component.scss']
})
export class DialogTransferTokensComponent implements OnInit {

  constructor(
  	@Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
  }

}
