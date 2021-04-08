import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { UserSettingsService } from '../auth/user-settings.service';
import { ArweaveService } from '../auth/arweave.service';
import { MatDialog } from '@angular/material/dialog';
import {
  ModalFileManagerComponent 
} from '../shared/modal-file-manager/modal-file-manager.component';
import { FormGroup, FormControl } from '@angular/forms';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import * as SimpleMDE from 'simplemde';
declare const document: any;



@Component({
  selector: 'app-create-page',
  templateUrl: './create-page.component.html',
  styleUrls: ['./create-page.component.scss']
})
export class CreatePageComponent implements OnInit {
	public authorAddress: string = this._auth.getMainAddressSnapshot();
	defaultTheme: string = '';
	loadingFrm: boolean = false;
	frmNew: FormGroup = new FormGroup({
		title: new FormControl('', [Validators.required, Validators.maxLength(150)]),
		slug: new FormControl('', [Validators.required, Validators.maxLength(150)]),
		summary: new FormControl('', [Validators.required, Validators.maxLength(500)])
	});
	txmessage: string = '';
  previewImgUrl: string = '';
  simplemde: any;
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  tags: any[] = [];
  contentTextareaObject: any;
  baseImgUrl: string = 'https://arweave.net/';

  public get title() {
		return this.frmNew.get('title');
	}
	public get slug() {
		return this.frmNew.get('slug');
	}
	public get summary() {
		return this.frmNew.get('summary');
	}

	goBack() {
  	this._location.back();
  }

  constructor(
  	private _location: Location,
    private _userSettings: UserSettingsService,
    private _arweave: ArweaveService,
    private _auth: AuthService,
    public _dialog: MatDialog,
  	private _router: Router,
  	private _snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
  	this.getDefaultTheme();
    this.contentTextareaObject = document.getElementById("create-page-textarea-simplemde-content");
    this.simplemde = new SimpleMDE({
      element: this.contentTextareaObject
    });
  }


  getDefaultTheme() {
  	this.defaultTheme = this._userSettings.getDefaultTheme();
    this._userSettings.defaultThemeObservable$.subscribe(
    	(theme) => {
    		this.defaultTheme = theme;
    	}
    );
  }


  getSkeletonLoaderAnimationType() {
  	let type = 'false';
  	if (this.defaultTheme === 'arwiki-dark') {
  		// type = 'progress-dark';
  	}
  	return type;
  }

  getSkeletonLoaderThemeNgStyle() {
  	let ngStyle: any = {
  		'height.px': '320',
  		'width': '100%'
  	};
  	if (this.defaultTheme === 'arwiki-dark') {
  		ngStyle['background-color'] = '#3d3d3d';
  	}

  	return ngStyle;
  }

  /*
  *  @dev 
  */
  openFileManager() {
    const refFileManager = this._dialog.open(ModalFileManagerComponent, {
      width: '720px',
      data: {}
    });
    refFileManager.afterClosed().subscribe(result => {
      if (result) {
        this.previewImage(result);
      }
    });
  }

  onSubmit() {
  	const title = this.title!.value;
  	const slug = this.slug!.value;
  	const summary = this.summary!.value;
    const content = this.contentTextareaObject.value;

    if (!content) {
      alert('Please type some content :)');
      return;
    }
  	this.disableForm(true);

  	// Save data 

  	
  }

  disableForm(disable: boolean) {
  	if (disable) {
  		this.title!.disable();
	  	this.slug!.disable();
	  	this.summary!.disable();
      this.loadingFrm = true;
  	} else {
  		this.title!.enable();
	  	this.slug!.enable();
	  	this.summary!.enable();
      this.loadingFrm = false;
  	}
  }

  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }

  previewImage(imgUrl: string) {
    if (imgUrl.length > 0) {
      this.previewImgUrl = `${this.baseImgUrl + imgUrl}`;
    }

  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our tag
    if ((value || '').trim()) {
      this.tags.push({name: value.trim()});
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(tag: any): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  updateSlug(s: string) {
    this.slug!.setValue(s.replace(/ /gi, '_'));
  }


}
