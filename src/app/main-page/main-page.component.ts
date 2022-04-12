import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';
import { Subscription, of, Observable } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { ArweaveService } from '../core/arweave.service';
import { ArwikiTokenContract } from '../core/arwiki-contracts/arwiki-token';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArwikiQuery } from '../core/arwiki-query';
import { AuthService } from '../auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ArwikiCategoryIndex } from '../core/interfaces/arwiki-category-index';
import { ArwikiPage } from '../core/interfaces/arwiki-page';
import { ArwikiPageIndex } from '../core/interfaces/arwiki-page-index';
import * as marked from 'marked';
import DOMPurify from 'dompurify';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit, OnDestroy {
	categories: ArwikiCategoryIndex = {};
	categoriesSlugs: string[] = [];
	categoriesSubscription: Subscription = Subscription.EMPTY;
	defaultTheme: string = '';
	loading: boolean = false;
  appName: string = 'Arweave';
  appLogoLight: string = './assets/img/arweave-dark.png';
  appLogoDark: string = './assets/img/arweave-light.png';
  loadingLatestArticles: boolean = false;
  latestArticles: ArwikiPage[] = [];
  latestArticlesData: Record<string, string> = {};
  arwikiQuery!: ArwikiQuery;
  pagesSubscription: Subscription = Subscription.EMPTY;
  routeLang: string = '';
  baseURL = this._arweave.baseURL;
  pagesByCategory: Record<string, ArwikiPage[]> = {};
  mainPage: ArwikiPage = null!;
  mainPageSubscription: Subscription = Subscription.EMPTY;
  loadingMainPageTX: boolean = false;
  mainLogo: string = '';
  partners: any[] = [
    { img: './assets/img/partners/pn-1kx.png', alt: '1kx', href:'' },
    { img: './assets/img/partners/pn-a16z.png', alt: '', href:'' },
    { img: './assets/img/partners/pn-usv.png', alt: '', href:'' },
    { img: './assets/img/partners/pn-coinbase.png', alt: 'Coinbase', href:'' },
  ];

  constructor(
    private _userSettings: UserSettingsService,
    private _arweave: ArweaveService,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _snackBar: MatSnackBar,
    private _auth: AuthService,
    private _route: ActivatedRoute,
    private _router: Router
  ) { }

  async loadMainPageData() {
    this.getDefaultTheme();
    this.loading = true;
    this.loadingLatestArticles = true;
    this.loadingMainPageTX = true;

    // Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);

    let networkInfo;
    let maxHeight = 0;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height;
    } catch (error) {
      this.message(`${error}`, 'error');
      return;
    }

    // Get categories (portals)
    let maxPagesByCategory = 30;
    this.pagesByCategory = {};

    this.categoriesSubscription = this.getPagesByCategory(
        maxPagesByCategory, this.routeLang
      )
      .subscribe({
        next: (txs: ArdbTransaction[]|ArdbBlock[]) => {
          let pagesByCategoryTmp: Record<string, ArwikiPage[]> = {};
          for (let p of txs) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
            const slug = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
            const category = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category');
            const img = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img');
            const owner = pTX.owner.address;
            const id = pTX.id;
            const block = pTX.block;
            const language = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang');
            
            
            if (!Array.isArray(pagesByCategoryTmp[category])) {
              pagesByCategoryTmp[category] = [];
            }
            pagesByCategoryTmp[category].push({
              title: title,
              slug: slug,
              category: category,
              img: img,
              owner: owner,
              id: id,
              block: block,
              language: language
            });
          }

          // Sort results
          for (const c in pagesByCategoryTmp) {
            pagesByCategoryTmp[c].sort((a, b) => {
              return a.title.localeCompare(b.title);
            });
          }

          // Save result
          this.pagesByCategory = pagesByCategoryTmp;

          this.loading = false;
        },
        error: (error: string) => {
          this.message(`Error: ${error}`, 'error')
          this.loading = false;
        },
      })


    // Get latest articles 
    const numArticles = 8;

    this.pagesSubscription = this.getLatestArticles(
        numArticles, this.routeLang
      ).subscribe({
      next: async (pages: ArwikiPage[]) => {
        // Sort desc
        this.latestArticles = pages.sort((a, b) => {
          if (a.start! > b.start!) {
            return -1;
          } else if (a.start! < b.start!) {
            return 1;
          }
          return 0;
        });
        
        this.loadingLatestArticles = false;
        this.latestArticlesData = {};

        for (let p of this.latestArticles ) {
          let error = false;
          try {
             let data = await this._arweave.arweave.transactions.getData(
              p.id, 
              {decode: true, string: true}
            );
            this.latestArticlesData[p.id] = data;
          } catch (err) {
            console.error('ErrLoading:', err);
            error = true;
          }

          if (error) {
            try {
              console.warn('Fetching data from gw ...', p.id);
              const data = await fetch(`${this._arweave.baseURL}${p.id}`);
              if (data.ok) {
                  this.latestArticlesData[p.id] = await data.text();
              } else {
                throw Error('Error fetching data!');
              }
            } catch (err) {
              console.error('ERR', err);
            }
          }
         
        }
      },
      error: (error) => {
        this.message(error, 'error');
        this.loadingLatestArticles = false;
      }
    });

      // Get main page tx
    this.mainPageSubscription = this.getMainPageTX(
        this.routeLang, maxHeight
      )
      .subscribe({
        next: async (txs: ArdbTransaction[]|ArdbBlock[]) => {
          this.mainPage = null!;
          for (let p of txs) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
            const slug = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
            const category = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category');
            const img = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img');
            const owner = pTX.owner.address;
            const id = pTX.id;
            const block = pTX.block;
            const language = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang');
            
            this.mainPage = {
              title: title,
              slug: slug,
              category: category,
              img: img,
              owner: owner,
              id: id,
              block: block,
              language: language
            };

            this.mainPage.content = await this._arweave.arweave.transactions.getData(
              id, {decode: true, string: true}
            );

            break;
          }

          this.loadingMainPageTX = false;
        },
        error: (error: string) => {
          this.message(`Error: ${error}`, 'error')
          this.loadingMainPageTX = false;
        },
      })
  }

  async ngOnInit() {
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
  	await this.loadMainPageData();

    // ON route change
    this._userSettings.routeLangStream.subscribe(async (data) => {
      if (data != this.routeLang) {
        this.routeLang = data;
        if (this.routeLang) {
          await this.loadMainPageData();
        }  
      }
      
    });
  }

  /*
  *  @dev return an observable with the latest articles
  */
  getLatestArticles(numArticles: number, langCode: string): Observable<ArwikiPage[]> {
    let admins: string[] = [];
    let verifiedPages: string[] = [];
    let allApprovedPages: any = {};
    return this._arwikiTokenContract.getAdminList().pipe(
      switchMap((_adminList: string[]) => {
        admins = _adminList;
        return this._arwikiTokenContract.getCategories();
      }),
      switchMap((categories) => {
        return this._arwikiTokenContract.getApprovedPages(langCode, -1, true);
      }),
      switchMap((_approvedPages: ArwikiPageIndex) => {
        allApprovedPages = _approvedPages;
        // Sort desc
        verifiedPages = Array.prototype.sort.call(Object.keys(_approvedPages), (a, b) => {
          return _approvedPages[b].start! - _approvedPages[a].start!;
        });
        verifiedPages = Array.prototype.slice.call(verifiedPages, 0, numArticles);

        verifiedPages = verifiedPages.map((slug) => {
          return _approvedPages[slug].content!;
        });

        return this.arwikiQuery.getTXsData(verifiedPages);
      }),
      switchMap((pages: ArdbTransaction[]|ArdbBlock[]) => {
        const latestPages: ArwikiPage[] = [];
        for (let p of pages) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
          const slug = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
          const category = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category');
          const img = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img');
          const language = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang');
          const owner = pTX.owner.address;
          const id = pTX.id;
          const block = pTX.block;
          const sponsor = allApprovedPages[slug].sponsor;
          
          latestPages.push({
            title: title,
            slug: slug,
            category: category,
            img: img,
            owner: owner,
            id: id,
            block: block,
            language: language,
            start: allApprovedPages[slug].start,
            sponsor: sponsor
          });
        }
        return of(latestPages);
      })
      
    );
  }

  ngOnDestroy() {
  	if (this.categoriesSubscription) {
  		this.categoriesSubscription.unsubscribe();
  	}
  }

  getSkeletonLoaderAnimationType() {
  	let type = 'progress';
  	if (this.defaultTheme === 'arwiki-dark') {
  		type = 'progress-dark';
  	}
  	return type;
  }

  getSkeletonLoaderThemeNgStyle(width: string = '100%') {
  	let ngStyle: any = {
  		'height.px': '30',
  		'width': width
  	};
  	if (this.defaultTheme === 'arwiki-dark') {
  		ngStyle['background-color'] = '#3d3d3d';
  	}

  	return ngStyle;
  }

  getSkeletonLoaderThemeNgStyle2() {
    let ngStyle: any = {
      'height.px': '120',
      'width.px': '120',
      'float': 'left',
      'margin-right.px': '30'
    };
    if (this.defaultTheme === 'arwiki-dark') {
      ngStyle['background-color'] = '#3d3d3d';
    }

    return ngStyle;
  }


  getSkeletonLoaderThemeNgStyleTitleArticle() {
    let ngStyle: any = {
      'height.px': '36',
      'width': '70%',
    };
    if (this.defaultTheme === 'arwiki-dark') {
      ngStyle['background-color'] = '#3d3d3d';
    }

    return ngStyle;
  }

  getSkeletonLoaderThemeNgStylePLine(width: string = '100%') {
    let ngStyle: any = {
      'height.px': '20',
      'width': width,
    };
    if (this.defaultTheme === 'arwiki-dark') {
      ngStyle['background-color'] = '#3d3d3d';
    }

    return ngStyle;    
  }


  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }

  /*
  *  @dev return an observable with the latest N articles
  */
  getPagesByCategory(numArticles: number, langCode: string) {
    let verifiedPages: string[] = [];
    return this._arwikiTokenContract.getCategories().pipe(
      switchMap((categories: ArwikiCategoryIndex) => {
        this.categories = categories;
        this.categoriesSlugs = Object.keys(this.categories)
           .sort((f1: any, f2: any) => {
          return this.categories[f1].order - this.categories[f2].order;
        });

        return this._arwikiTokenContract.getApprovedPages(langCode, numArticles, true);
      }),
      switchMap((_approvedPages: ArwikiPageIndex) => {
        verifiedPages = Array.prototype.sort.call(Object.keys(_approvedPages), (a, b) => {
          return _approvedPages[a].start! - _approvedPages[b].start!;
        });

        verifiedPages = verifiedPages.map((slug) => {
          return _approvedPages[slug].content!;
        });

        return this.arwikiQuery.getTXsData(verifiedPages);
      })
    );
  }

  /*
  *  @dev Sanitize HTML
  */
  markdownToHTML(_markdown: string) {
    var html = marked(_markdown);
    var clean = DOMPurify.sanitize(html);
    return html;
  }

  /*
  *  @dev Get latest main page TX
  */
  getMainPageTX(langCode: string, height: number) {
    let admins: string[] = [];
    let numArticles = 1;
    const verifiedPagesDict: Record<string, boolean> = {};
    let allApprovedPages: any = {};
    return this._arwikiTokenContract.getAdminList().pipe(
      switchMap((adminList: string[]) => {
        admins = adminList;
        return this._arwikiTokenContract.getCategories();
      }),
      switchMap((categories: ArwikiCategoryIndex) => {
        this.categories = categories;
        return this._arwikiTokenContract.getApprovedPages(langCode, -1, true);
      }),
      switchMap((approvedPages: any) => {
        allApprovedPages = approvedPages;
        this.categoriesSlugs = Object.keys(this.categories)
           .sort((f1: any, f2: any) => {
          return this.categories[f1].order - this.categories[f2].order;
        });
        return this.arwikiQuery.getMainPageTX(
          admins, Object.keys(this.categories), langCode, numArticles, height
        );
      }),
      switchMap((verifiedMainPages: ArdbTransaction[]|ArdbBlock[]) => {
        const mainTX = [];
        for (let p of verifiedMainPages) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          // const vrfdPageId = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
          const slug = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
          if (allApprovedPages[slug] && allApprovedPages[slug].content) {
            mainTX.push(allApprovedPages[slug].content);
            break;
          }
        }

        return this.arwikiQuery.getTXsData(mainTX);
      })
      
    );
  }

  getDefaultTheme() {
    this.defaultTheme = this._userSettings.getDefaultTheme();
    this.mainLogo = this.getMainLogo();
    this._userSettings.defaultThemeStream.subscribe(
      (theme) => {
        this.defaultTheme = theme;
        this.mainLogo = this.getMainLogo();
      }
    );
  }

  getMainLogo() {
    if (this.defaultTheme === 'arwiki-light' && this.appLogoLight) {
      return this.appLogoLight;
    } else if (this.defaultTheme === 'arwiki-dark' && this.appLogoDark) {
      return this.appLogoDark;
    }

    return '';
  }

}
