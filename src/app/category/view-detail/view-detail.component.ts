import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription } from 'rxjs';
import { ArwikiSettingsContract } from '../../arwiki-contracts/arwiki-settings';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getVerification } from "arverify";
import { ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: './view-detail.component.html',
  styleUrls: ['./view-detail.component.scss']
})
export class ViewDetailComponent implements OnInit {
  arwikiQuery: ArwikiQuery|null = null;
  pagesSubscription: Subscription = Subscription.EMPTY;
  loadingPages: boolean = false;
  category: string = '';
  pages: any[] = [];
  routeLang: string = '';

  constructor(
  	private _arweave: ArweaveService,
  	private _settingsContract: ArwikiSettingsContract,
  	private _snackBar: MatSnackBar,
  	private _route: ActivatedRoute
 	) { }

  ngOnInit(): void {
    // Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
  	this.category = this._route.snapshot.paramMap.get('category')!;
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this.loadingPages = true;

    this.pagesSubscription = this.arwikiQuery.getPagesByCategory(
    	this.category,
    	this._settingsContract
    ).subscribe({
    	next: (pages) => {

    		this.pages = pages;
    		this.loadingPages = false;
    	},
    	error: (error) => {
    		this.message(error, 'error');
    		this.loadingPages = false;
    	}
    });
  }

  slugToLabel(_s: string) {
  	return _s.replace(/_/gi, " ");
  }


  /*
  *	Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 8000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }


  ngOnDestroy() {
  	if (this.pagesSubscription) {
  		this.pagesSubscription.unsubscribe();
  	}

  }


  async getArverifyVerification(_address: string) {
    const verification = await getVerification(_address);

    return ({
      verified: verification.verified,
      icon: verification.icon,
      percentage: verification.percentage
    });
  }

}
