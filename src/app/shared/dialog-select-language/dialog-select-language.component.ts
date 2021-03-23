import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArwikiLangIndexContract } from '../../arwiki-contracts/arwiki-lang-index';
import { Subscription, Observable } from 'rxjs'; 
import { ArweaveService } from '../../auth/arweave.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  templateUrl: './dialog-select-language.component.html',
  styleUrls: ['./dialog-select-language.component.scss']
})
export class DialogSelectLanguageComponent implements OnInit, OnDestroy {
	langs: any;
	langCodes: string[] = [];
	langsSubscription: Subscription = Subscription.EMPTY;
	loading: boolean = false;
	error: string = '';

  constructor(
  	private _arwikiLangIndex: ArwikiLangIndexContract,
  	private _arweave: ArweaveService,
  	private _snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
  	this.loading = true;
  	this.langsSubscription = this._arwikiLangIndex
  		.getLangsLocalCopy()
  		.subscribe({
  			next: (state: any) => {
	  			this.langs = state.langs;
	  			for (let s of Object.keys(state.langs)) {
	  				this.langCodes.push(s)
	  			}
	  			this.langCodes = Array.prototype.sort.call(this.langCodes);
	  			this.loading = false;
	  		},
	  		error: (error) => {
	  			this.error = error;
	  			this.loading = false;
	  			this.message(error, 'error');
	  		}
	  	});
  }

  ngOnDestroy() {
  	if (this.langsSubscription) {
  		this.langsSubscription.unsubscribe();
  	}
  }

  /*
  *	Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }
}
