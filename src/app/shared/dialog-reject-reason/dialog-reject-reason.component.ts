import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-reject-reason',
  templateUrl: './dialog-reject-reason.component.html',
  styleUrls: ['./dialog-reject-reason.component.scss']
})
export class DialogRejectReasonComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
  }

}
