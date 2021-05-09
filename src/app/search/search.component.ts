import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArwikiQuery } from '../core/arwiki-query';
import { ArweaveService } from '../core/arweave.service';
import { Subscription } from 'rxjs';
import { ArwikiSettingsContract } from '../core/arwiki-contracts/arwiki-settings';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getVerification } from "arverify";
import { ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
arwikiQuery: ArwikiQuery|null = null;
  pagesSubscription: Subscription = Subscription.EMPTY;
  loadingPages: boolean = false;
  query: string = '';
  pages: any[] = [];
  routeLang: string = '';
  pagesData: any = {};
  baseURL: string = this._arweave.baseURL;
  arverifyProcessedAddressesMap: any = {};

  constructor(
  	private _arweave: ArweaveService,
  	private _settingsContract: ArwikiSettingsContract,
  	private _snackBar: MatSnackBar,
  	private _route: ActivatedRoute
 	) { }

  async ngOnInit() {
    // Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);

    this._route.paramMap.subscribe(async params => {
      this.query = params.get('query')!;
      this.routeLang = params.get('lang')!;

      await this.searchNow();
    });

    
  }

  async searchNow() {
    this.loadingPages = true;
    this.pages = [];

    let networkInfo;
    let maxHeight = 0;
    const maxPages = 100;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height;
    } catch (error) {
      this.message(error, 'error');
      return;
    }

    this.pagesSubscription = this.arwikiQuery!.searchInApprovedTags(
      [this.query],
      this.routeLang,
      this._settingsContract,
      maxHeight,
      maxPages
    ).subscribe({
      next: async (pages) => {
        this.pages = pages;
        this.pagesData = {};
        this.loadingPages = false;

        for (let p of pages) {
          this.pagesData[p.id] = await this._arweave.arweave.transactions.getData(
            p.id, 
            {decode: true, string: true}
          );  
        }

        // Verify addresses 
        // Validate owner address with ArVerify
        this.arverifyProcessedAddressesMap = {};
        for (let p of pages) {
          // Avoid duplicates
          if (
            Object.prototype.hasOwnProperty.call(
              this.arverifyProcessedAddressesMap, 
              p.owner
            )
          ) {
            continue;
          }
          const arverifyQuery = await this.getArverifyVerification(p.owner);
          this.arverifyProcessedAddressesMap[p.owner] = arverifyQuery;
        }
        
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

  sanitizeMarkdown(_s: string) {
    _s = _s.replace(/[#*=\[\]]/gi, '')
    let res: string = `${_s.substring(0, 250)} ...`;
    return res;
  }

  
  sanitizeImg(_img: string) {
    let res: string = _img.indexOf('http') >= 0 ?
      _img :
      _img ? `${this.baseURL}${_img}` : '';
    return res;
  }

}
