import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-search-engine',
  templateUrl: './search-engine.component.html',
  styleUrls: ['./search-engine.component.scss']
})
export class SearchEngineComponent implements OnInit {
	searchForm: FormGroup = new FormGroup({
		'query': new FormControl('', [Validators.required])
	});
  constructor() { }

  ngOnInit(): void {
  }


  onSubmitSearch() {

  }


}
