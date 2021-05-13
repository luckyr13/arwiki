import { 
  Component, OnInit, OnDestroy, 
  ChangeDetectorRef, ViewChild
} from '@angular/core';
import { ArwikiQuery } from '../../core/arwiki-query';
import * as marked from 'marked';
import DOMPurify from 'dompurify';
import { Observable, Subscription, of } from 'rxjs';
import { 
	readContract
} from 'smartweave';
import { ArweaveService } from '../../core/arweave.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { ArwikiSettingsContract } from '../../core/arwiki-contracts/arwiki-settings';
import { ArwikiCategoriesContract } from '../../core/arwiki-contracts/arwiki-categories';
import { UserSettingsService } from '../../core/user-settings.service';
import { switchMap } from 'rxjs/operators';
declare const window: any;
declare const document: any;

@Component({
  templateUrl: './view-detail.component.html',
  styleUrls: ['./view-detail.component.scss']
})
export class ViewDetailComponent implements OnInit {
	arwikiQuery!: ArwikiQuery;
  htmlContent: string = '';
	pageSubscription: Subscription = Subscription.EMPTY;
  loadingPage: boolean = false;
  pageTitle: string = '';
  pageId: string = '';
  pageImg: string = '';
  pageOwner: string = '';
  pageCategory: string = '';
  block: any;
  scrollTop: number = 0;
  toc: any[] = [];
  routeLang: string = '';
  routeSlug: string = '';
  baseURL: string = this._arweave.baseURL;
  fragment: string = '';

  constructor(
    private route: ActivatedRoute,
  	private _arweave: ArweaveService,
  	private _snackBar: MatSnackBar,
    private _location: Location,
    private _settingsContract: ArwikiSettingsContract,
    private _userSettings: UserSettingsService,
    private _ref: ChangeDetectorRef,
    private _categoriesContract: ArwikiCategoriesContract
  ) { }

  ngOnInit(): void {
  	this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);

    this.route.paramMap.subscribe(async params => {
      const slug = params.get('slug');
      const lang = params.get('lang');
      this.routeLang = lang!;
      this.routeSlug = slug!;
      if (slug) {
        await this.loadPageData(slug!, lang!);

      }
    });

    this._userSettings.scrollTopStream.subscribe((scroll) => {
      this.scrollTop = scroll;
      this._ref.detectChanges();
    })

  }


  async loadPageData(slug: string, langCode: string) {
     // Init page data 
    this.pageTitle = '';
    this.pageImg = '';
    this.pageId = '';
    this.htmlContent = '';
    this.pageOwner = '';
    this.pageCategory = '';
    this.block = {};
    const numPages = 1;
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
   

  	this.pageSubscription = this.getPageBySlug(
  		slug, langCode, maxHeight, numPages
  	).subscribe({
  		next: async (data) => {
        const finalRes: any = [];
        for (let p of data) {
          const title = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title');
          const slug = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
          const category = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category');
          const img = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Img');
          const owner = p.node.owner.address;
          const id = p.node.id;
          const block = p.node.block;
          
          finalRes.push({
            title: title,
            slug: slug,
            category: category,
            img: img,
            owner: owner,
            id: id,
            block: block
          });
          
        }

  			// If page exists
  			if (finalRes.length > 0) {
  				const page: any = finalRes[0];
  				this.pageTitle = page.title ? page.title : '';
  				this.pageImg = page.img ? page.img : '';
  				this.pageId = page.id ? page.id : '';
          this.pageOwner = page.owner ? page.owner : '';
          this.pageCategory = page.category ? page.category : '';
          this.block = page.block;

          const content = await this._arweave.arweave.transactions.getData(
            page.id, 
            {decode: true, string: true}
          );
          this.htmlContent = this.markdownToHTML(content);
          // Generate TOC 
          window.setTimeout(() => {

            this.generateTOC();

            // Listen for fragments
            this.route.fragment.subscribe(fragment => {
              this.fragment = fragment;
              if (this.fragment) {
                this._userSettings.scrollTo(this.fragment, -80);
              }
            });

          }, 500);

          this.loadingPage = false;

  			} else {
  				this.message('Page not found', 'error')
          this.loadingPage = false;
  			}


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


  generateTOC() {
    this.toc = [];
    const container = document.getElementById('arwiki-page-content-detail');
    if (!container) {
      return;
    }
    const headers = container.querySelectorAll('h1, h2, h3, h4');
    this.generateTOC_helper_addId(headers);

  }

  generateTOC_helper_addId(elements: any[]) {
    const numElements = elements.length;
    for (let i = 0; i < numElements; i++) {
      const finalId = elements[i].innerText.trim().replace(/ /gi, '_');
      elements[i].id = `toc_${finalId}`;
      const menuElement = {
        id: elements[i].id,
        top: elements[i].getBoundingClientRect().top,
        text: elements[i].innerText,
        type: elements[i].tagName
      };
      this.generateTOC_helper_addToTable(menuElement);
    }

  }

  generateTOC_helper_addToTable(element: any) {
    this.toc.push(element);
  }

  validateTOCactiveMenu(_elementTop: number ){
    return (_elementTop < this.scrollTop + 170);
  }

  timestampToDate(_time: number) {
    let d = new Date(_time * 1000);
    return d;
  }

  /*
  * @dev
  */
  getPageBySlug(
    _slug: string,
    _langCode: string,
    _maxHeight: number,
    _limit: number = 20
  ) {
    let categoriesCS: any = {};
    let adminList: string[] = [];
    const verifiedPagesDict: Record<string, boolean> = {};
    return this._categoriesContract.getState()
      .pipe(
        switchMap((categoriesContractState) => {
          categoriesCS = Object.keys(categoriesContractState);
          return this._settingsContract.getState();
        }),
        switchMap((settingsContractState) => {
          adminList = Object.keys(settingsContractState.admin_list);
          return this.arwikiQuery.getVerifiedPagesBySlug(
            adminList,
            [_slug],
            categoriesCS,
            _langCode,
            _limit,
            _maxHeight
          );
        }),
        switchMap((verifiedPages) => {
          for (let p of verifiedPages) {
            const vrfdPageId = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
            verifiedPagesDict[vrfdPageId] = true;
          }

          return this.arwikiQuery.getDeletedPagesTX(
            adminList,
            Object.keys(verifiedPagesDict),
            _langCode,
            _limit,
            _maxHeight
          );
        }),
        switchMap((deletedPagesTX) => {
          const deletedPagesDict: Record<string,boolean> = {};
          for (const p of deletedPagesTX) {
            const arwikiId = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
            deletedPagesDict[arwikiId] = true;
          }

          let finalList = Object.keys(verifiedPagesDict).filter((vpId) => {
            return !deletedPagesDict[vpId];
          });
          
          return this.arwikiQuery.getTXsData(finalList);
        })
      );
  }

}
