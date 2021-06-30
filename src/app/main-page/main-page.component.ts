import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';
import { ArwikiCategoriesContract } from '../core/arwiki-contracts/arwiki-categories';
import { Subscription, of, Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { ArweaveService } from '../core/arweave.service';
import { ArwikiTokenContract } from '../core/arwiki-contracts/arwiki-token';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArwikiQuery } from '../core/arwiki-query';
import { AuthService } from '../auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ArwikiCategoryIndex } from '../core/interfaces/arwiki-category-index';
import { ArwikiPage } from '../core/interfaces/arwiki-page';
import * as marked from 'marked';
import DOMPurify from 'dompurify';
import gsap from 'gsap';

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
  @ViewChild('mainLogo1') mainLogo1!: ElementRef;

  constructor(
    private _userSettings: UserSettingsService,
    private _categoriesContract: ArwikiCategoriesContract,
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

    window.setTimeout(() => {
      this.animateFlipLogo(this.mainLogo1);
    }, 200);

    // Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);

    let networkInfo;
    let maxHeight = 0;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height;
    } catch (error) {
      this.message(error, 'error');
      return;
    }

    // Get categories (portals)
    let maxPagesByCategory = 20;
    this.categoriesSubscription = this.getPagesByCategory(
        maxPagesByCategory, this.routeLang, maxHeight
      )
      .subscribe({
        next: (txs: any[]) => {
          this.pagesByCategory = {};
          for (let p of txs) {
            const title = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title');
            const slug = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
            const category = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category');
            const img = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Img');
            const owner = p.node.owner.address;
            const id = p.node.id;
            const block = p.node.block;
            const language = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Lang');
            
            
            if (!Array.isArray(this.pagesByCategory[category])) {
              this.pagesByCategory[category] = [];
            }
            this.pagesByCategory[category].push({
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

          this.loading = false;
        },
        error: (error: string) => {
          this.message(`Error: ${error}`, 'error')
          this.loading = false;
        },
      })


    // Get latest articles 
    const numArticles = 6;

    this.pagesSubscription = this.getLatestArticles(
        numArticles, this.routeLang, maxHeight
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
          let data = await this._arweave.arweave.transactions.getData(
            p.id, 
            {decode: true, string: true}
          );
          this.latestArticlesData[p.id] = data;
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
        next: async (txs: any[]) => {
          this.mainPage = null!;
          for (let p of txs) {
            const title = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title');
            const slug = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
            const category = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category');
            const img = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Img');
            const owner = p.node.owner.address;
            const id = p.node.id;
            const block = p.node.block;
            const language = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Lang');
            
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
  getLatestArticles(numArticles: number, langCode: string, height: number): Observable<ArwikiPage[]> {
    let admins: string[] = [];
    let verifiedPages: string[] = [];
    let allApprovedPages: any = {};
    return this._arwikiTokenContract.getAdminList().pipe(
      switchMap((_adminList: string[]) => {
        admins = _adminList;
        return this._categoriesContract.getState();
      }),
      switchMap((categories) => {
        return this._arwikiTokenContract.getApprovedPages(langCode, -1);
      }),
      switchMap((_approvedPages) => {
        allApprovedPages = _approvedPages;
        // Sort desc
        verifiedPages = Array.prototype.sort.call(Object.keys(_approvedPages), (a, b) => {
          return _approvedPages[b].start - _approvedPages[a].start;
        });
        verifiedPages = Array.prototype.slice.call(verifiedPages, 0, numArticles);

        verifiedPages = verifiedPages.map((slug) => {
          return _approvedPages[slug].content;
        });

        return this.arwikiQuery.getDeletedPagesTX(
          admins,
          verifiedPages,
          langCode,
          numArticles,
          height
        );
      }),
      switchMap((deletedPagesTX) => {
        const deletedPagesDict: Record<string,boolean> = {};
        for (const p of deletedPagesTX) {
          const arwikiId = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
          deletedPagesDict[arwikiId] = true;
        }

        let finalList = verifiedPages.filter((vpId) => {
          return !deletedPagesDict[vpId];
        });
        
        return this.arwikiQuery.getTXsData(finalList);
      }),
      switchMap((pages: any) => {
        const latestPages: ArwikiPage[] = [];
        for (let p of pages) {
          const title = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title');
          const slug = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
          const category = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category');
          const img = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Img');
          const language = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Lang');
          const owner = p.node.owner.address;
          const id = p.node.id;
          const block = p.node.block;
          
          latestPages.push({
            title: title,
            slug: slug,
            category: category,
            img: img,
            owner: owner,
            id: id,
            block: block,
            language: language,
            start: allApprovedPages[slug].start
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
  getPagesByCategory(numArticles: number, langCode: string, height: number) {
    let admins: string[] = [];
    let verifiedPages: string[] = [];
    return this._arwikiTokenContract.getAdminList().pipe(
      switchMap((adminList: string[]) => {
        admins = adminList;
        return this._categoriesContract.getState();
      }),
      switchMap((categories: ArwikiCategoryIndex) => {
        this.categories = categories;
        this.categoriesSlugs = Object.keys(this.categories)
           .sort((f1: any, f2: any) => {
          return this.categories[f1].order - this.categories[f2].order;
        });

        return this._arwikiTokenContract.getApprovedPages(langCode, numArticles);
      }),
      switchMap((_approvedPages) => {
        verifiedPages = Array.prototype.sort.call(Object.keys(_approvedPages), (a, b) => {
          return _approvedPages[a].start - _approvedPages[b].start;
        });

        verifiedPages = verifiedPages.map((slug) => {
          return _approvedPages[slug].content;
        });

        return this.arwikiQuery.getDeletedPagesTX(
          admins,
          verifiedPages,
          langCode,
          numArticles,
          height
        );
      }),
      switchMap((deletedPagesTX) => {
        const deletedPagesDict: Record<string,boolean> = {};
        for (const p of deletedPagesTX) {
          const arwikiId = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
          deletedPagesDict[arwikiId] = true;
        }

        let finalList = verifiedPages.filter((vpId) => {
          return !deletedPagesDict[vpId];
        });
        
        return this.arwikiQuery.getTXsData(finalList);
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
    let numArticles = 10;
    const verifiedPagesDict: Record<string, boolean> = {};
    let allApprovedPages: any = {};
    return this._arwikiTokenContract.getAdminList().pipe(
      switchMap((adminList: string[]) => {
        admins = adminList;
        return this._categoriesContract.getState();
      }),
      switchMap((categories: ArwikiCategoryIndex) => {
        this.categories = categories;
        return this._arwikiTokenContract.getApprovedPages(langCode);
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
      switchMap((verifiedPages) => {
        for (let p of verifiedPages) {
          const vrfdPageId = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
          const slug = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');

          if (allApprovedPages[slug] && allApprovedPages[slug].content === vrfdPageId) {
            verifiedPagesDict[vrfdPageId] = true;
          }

        }

        return this.arwikiQuery.getDeletedPagesTX(
          admins,
          Object.keys(verifiedPagesDict),
          langCode,
          numArticles,
          height
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

        finalList = finalList.length ? [finalList[0]] : [];
        
        return this.arwikiQuery.getTXsData(finalList);
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

  animateFlipLogo(_logo: ElementRef) {
    gsap.to(_logo.nativeElement, {rotationY: 360, repeat: -1, duration: 2});
  }

}
