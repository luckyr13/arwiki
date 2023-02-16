import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-voted',
  templateUrl: './dialog-voted.component.html',
  styleUrls: ['./dialog-voted.component.scss']
})
export class DialogVotedComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {votes: string[]}
  ) {

  }

}
