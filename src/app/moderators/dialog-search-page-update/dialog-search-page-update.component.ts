import { Component, OnInit, Inject} from '@angular/core';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-search-page-update',
  templateUrl: './dialog-search-page-update.component.html',
  styleUrls: ['./dialog-search-page-update.component.scss']
})
export class DialogSearchPageUpdateComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
  }

}
