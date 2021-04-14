import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  templateUrl: './add-admin.component.html',
  styleUrls: ['./add-admin.component.scss']
})
export class AddAdminComponent implements OnInit {
	createAdminFrm: FormGroup = new FormGroup({
		newAdminAddress: new FormControl('')
	});
  constructor() { }

  get newAdminAddress() {
  	return this.createAdminFrm.get('newAdminAddress');
  }

  ngOnInit(): void {
  }
  
  createNewAdmin() {
  	alert('ok')
  }
}
