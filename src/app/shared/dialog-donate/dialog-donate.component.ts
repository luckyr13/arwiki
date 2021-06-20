import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-donate',
  templateUrl: './dialog-donate.component.html',
  styleUrls: ['./dialog-donate.component.scss']
})
export class DialogDonateComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
  }

}
