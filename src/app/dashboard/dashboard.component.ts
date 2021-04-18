import { Component, OnInit } from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import { ArweaveService } from '../core/arweave.service';
import { Observable, Subscription, EMPTY } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UserSettingsService } from '../core/user-settings.service';
import { ArwikiQuery } from '../core/arwiki-query';
declare const window: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
	mainAddress: string = this._auth.getMainAddressSnapshot();
	balance: Observable<string> = this._arweave.getAccountBalance(this.mainAddress);
	loadingMyPages: boolean = false;
  pages: any[] = [];
  loading: boolean = false;
  txmessage: string = '';
  lastTransactionID: Observable<string> = this._arweave.getLastTransactionID(this.mainAddress);
  myPagesSubscription: Subscription = Subscription.EMPTY;
  routeLang: string = '';
  arwikiQuery: ArwikiQuery|null = null;
  baseURL: string = this._arweave.baseURL;

  constructor(
  	private _router: Router,
  	private _snackBar: MatSnackBar,
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _userSettings: UserSettingsService,
    private _route: ActivatedRoute
  ) { }

  ngOnInit() {
  	this.loading = true;
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
  
  	// Fetch data to display
  	// this.loading is updated to false on success
  	this.getUserInfo();

    // Get pages 
    this.getMyArWikiPages();

    // Get language from route
    this._route.paramMap.subscribe(params => {
      const lang = params.get('lang');
      if (lang) {
        this.routeLang = lang;
      
      }
    });

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


  /*
  *	@dev Get user info
  */
  getUserInfo() {

    this.loading = false;
  }

  /*
  *	@dev Destroy subscriptions
  */
  ngOnDestroy() {
    if (this.myPagesSubscription) {
      this.myPagesSubscription.unsubscribe();
    }
  }

  /*
  * @dev Reload page
  */
  reload() {
    window.location.reload();
  }

  getMyArWikiPages() {
    this.loadingMyPages = true;

    this.myPagesSubscription = this.arwikiQuery!.getMyArWikiPages(
      this._auth.getMainAddressSnapshot()
    ).subscribe({
      next: (pages) => {

        const finalPages: any = [];
        for (let p of pages) {
          const title = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title');
          const slug = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
          const category = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category');
          const lang = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Lang');
          const img = this.sanitizeImg(this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Img'));
          const owner = p.node.owner.address;
          const id = p.node.id;
          
          finalPages.push({
            title: title,
            slug: slug,
            category: category,
            img: img,
            owner: owner,
            lang: lang,
            id: id
          });
        }

        this.pages = finalPages;
        this.loadingMyPages = false;

      },
      error: (error) => {
        this.message(error, 'error');
        this.loadingMyPages = false;
      }
    });
  }

  searchKeyNameInTags(_arr: any[], _key: string) {
    let res = '';
    for (const a of _arr) {
      if (a.name === _key) {
        return a.value;
      }
    }
    return res;
  }

  sanitizeImg(_img: string) {
    let res: string = _img.indexOf('http') >= 0 ?
      _img :
      _img ? `${this.baseURL}${_img}` : '';
    return res;
  }

}
