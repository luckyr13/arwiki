import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { 
  DialogSelectLanguageComponent 
} from '../shared/dialog-select-language/dialog-select-language.component';

@Component({
  selector: 'app-search-engine',
  templateUrl: './search-engine.component.html',
  styleUrls: ['./search-engine.component.scss']
})
export class SearchEngineComponent implements OnInit {
	searchForm: FormGroup = new FormGroup({
		'query': new FormControl('', [Validators.required])
	});
  defaultLang: any;
  
  constructor(private _dialog: MatDialog) { }

  ngOnInit(): void {
    this.defaultLang = {
      "code": "en",
      "iso_name": "English",
      "native_name": "English",
      "numPages": 0,
      "writing_system": "LTR",
      "contract": ""
    };

  }

  onSubmitSearch() {
  }

  openSelectLanguageDialog(): void {
    const dialogRef = this._dialog.open(DialogSelectLanguageComponent, {
      width: '650px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(lang => {
      if (lang) {
        this.defaultLang = lang;
      }

    });
  }


}
