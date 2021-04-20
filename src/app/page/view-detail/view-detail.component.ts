import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ArwikiQuery } from '../../core/arwiki-query';
import * as marked from 'marked';
import DOMPurify from 'dompurify';
import { Observable, Subscription } from 'rxjs';
import { 
	readContract
} from 'smartweave';
import { ArweaveService } from '../../core/arweave.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { ArwikiSettingsContract } from '../../arwiki-contracts/arwiki-settings';
import { UserSettingsService } from '../../core/user-settings.service';

@Component({
  templateUrl: './view-detail.component.html',
  styleUrls: ['./view-detail.component.scss']
})
export class ViewDetailComponent implements OnInit {
	arwikiQuery: ArwikiQuery|null = null;
  htmlContent: string = '';
	pageSubscription: Subscription = Subscription.EMPTY;
  loadingPage: boolean = false;
  pageTitle: string = '';
  pageId: string = '';
  pageImg: string = '';
  scrollTop: number = 0;

  constructor(
    private route: ActivatedRoute,
  	private _arweave: ArweaveService,
  	private _snackBar: MatSnackBar,
    private _location: Location,
    private _settingsContract: ArwikiSettingsContract,
    private _userSettings: UserSettingsService,
    private _ref: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
  	this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);

    this.route.paramMap.subscribe(async params => {
      const slug = params.get('slug');
      const lang = params.get('lang');
      if (slug) {
        await this.loadPageData(slug!, lang!);
      }
    });

    this._userSettings.scrollTopStream.subscribe((scroll) => {
      this.scrollTop = scroll;
      if (this.scrollTop >= 100) {
        this._ref.detectChanges();

      }
    })

  }

  async loadPageData(slug: string, langCode: string) {
  	this.loadingPage = true;

    let networkInfo;
    let maxHeight = 0;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height;
    } catch (error) {
      this.message(error, 'error');
      return;
    }
    // Init page data 
    this.pageTitle = '';
    this.pageImg = '';
    this.pageId = '';
    this.htmlContent = '';
    const numPages = 1;

  	this.pageSubscription = this.arwikiQuery!.getPageBySlug(
  		slug, langCode, this._settingsContract, maxHeight, numPages
  	).subscribe({
  		next: async (data) => {
  			// If page exists
  			if (Array.isArray(data) && data.length > 0) {
  				const page: any = data[0];
  				this.pageTitle = page.title ? page.title : '';
  				this.pageImg = page.img ? page.img : '';
  				this.pageId = page.id ? page.id : '';

          const content = await this._arweave.arweave.transactions.getData(
            page.id, 
            {decode: true, string: true}
          );
          this.htmlContent = this.markdownToHTML(content);
  				

  			} else {
  				this.message('Page not found', 'error')
  			}

				// this.htmlContent = this.markdownToHTML(data);
        this.loadingPage = false;
  		},
  		error: (error) => {
  			this.message(error, 'error')
        this.loadingPage = false;
  		}
  	});

  }

  ngOnDestroy() {
  	if (this.pageSubscription) {
  		this.pageSubscription.unsubscribe();
  	}
  }

  markdownToHTML(_markdown: string) {
  	var html = marked(_markdown);
		var clean = DOMPurify.sanitize(html);
		return html;
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

  goBack() {
    this._location.back();
  }

}
