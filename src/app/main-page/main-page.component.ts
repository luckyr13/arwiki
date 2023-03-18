import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';
import { Subscription, of, Observable } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { ArweaveService } from '../core/arweave.service';
import { ArwikiTokenContract } from '../core/arwiki-contracts/arwiki-token.service';
import { UtilsService } from '../core/utils.service';
import { ArwikiQuery } from '../core/arwiki-query';
import { AuthService } from '../auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ArwikiCategoryIndex } from '../core/interfaces/arwiki-category-index';
import { ArwikiPage } from '../core/interfaces/arwiki-page';
import { ArwikiPageIndex } from '../core/interfaces/arwiki-page-index';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import { ArwikiMenuCategory } from '../core/interfaces/arwiki-menu-category';
import { ArwikiMenuService } from '../core/arwiki-contracts/arwiki-menu.service';
import { ArwikiPagesService } from '../core/arwiki-contracts/arwiki-pages.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit, OnDestroy {
	categories: ArwikiCategoryIndex = {};
	categoriesSubscription: Subscription = Subscription.EMPTY;
	defaultTheme: string = '';
	loadingSubmenu: boolean = false;
  appName: string = 'Arweave';
  appLogoLight: string = './assets/img/arweave-dark.png';
  appLogoDark: string = './assets/img/arweave-light.png';
  loadingLatestArticles: boolean = false;
  latestArticles: ArwikiPage[] = [];
  allLatestArticles: string[] = [];
  arwikiQuery!: ArwikiQuery;
  pagesSubscription: Subscription = Subscription.EMPTY;
  routeLang: string = '';
  baseURL = this._arweave.baseURL;
  pagesByCategory: Record<string, ArwikiPage[]> = {};
  mainPage: ArwikiPage|null = null;
  mainPageSubscription: Subscription = Subscription.EMPTY;
  loadingMainPageTX: boolean = false;
  mainLogo: string = '';
  partners: any[] = [
    { img: './assets/img/partners/arweaveAppBalancedHGrayF.png', alt: 'Arweave.app', href:'https://arweave.app' },
    { img: './assets/img/partners/arconnectGray2.png', alt: 'ArConnect', href:'https://arconnect.io' },
    { img: './assets/img/partners/warpGray.png', alt: 'Warp Contracts', href:'https://warp.cc' },
    { img: './assets/img/partners/arIOGray.png', alt: 'Ar.io', href:'https://ar.io' },
    { img: './assets/img/partners/permaDAOGray.png', alt: 'PermaDAO', href:'https://permadao.com' },
    { img: './assets/img/partners/spheronGray.png', alt: 'Spheron', href:'https://spheron.network' },
    { img: './assets/img/partners/communityLogoGray.png', alt: 'Community.XYZ', href:'https://community.xyz' },

    { img: './assets/img/partners/pn-1kx.png', alt: '1kx', href:'' },
    { img: './assets/img/partners/pn-a16z.png', alt: 'a16z', href:'' },
    { img: './assets/img/partners/pn-usv.png', alt: 'USV', href:'' },
    { img: './assets/img/partners/pn-coinbase.png', alt: 'Coinbase', href:'' },
  ];
  numLatestArticles = 8;
  allApprovedPages: ArwikiPageIndex = {};
  nextLatestArticlesSubscription = Subscription.EMPTY;
  loadingNextLatestArticles = false;
  hideBtnMoreArticles = false;

  menuSubscription: Subscription = Subscription.EMPTY;
  menu: ArwikiMenuCategory[] = [];

  constructor(
    private _userSettings: UserSettingsService,
    private _arweave: ArweaveService,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _utils: UtilsService,
    private _auth: AuthService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _arwikiMenu: ArwikiMenuService,
    private _arwikiPages: ArwikiPagesService
  ) { }

  loadMainPageData() {
    this.loadingSubmenu = true;

    // Get categories (portals)
    this.getSubmenu();

    // Load latest articles
    this.numLatestArticles = 8;
    this.getLatestArticles(this.numLatestArticles);

    // Load main article
    this.getMainArticle();
  }

  getMainArticle() {
    this.loadingMainPageTX = true;

    // Get main page tx
    this.mainPageSubscription = this._arwikiPages.getApprovedPages(
      this.routeLang, -1).pipe(
      switchMap((approvedPages: ArwikiPageIndex) => {
        let mainTX = '';
        const pages: ArwikiPage[] = Object.values(approvedPages);
        const mainPage: ArwikiPage|undefined = pages.find((p: ArwikiPage) => {
          return p.showInMainPage;
        });
        if (mainPage) {
          this.mainPage = mainPage;
          mainTX = this.mainPage.id;
        } else {
          this.mainPage = null;
          throw Error('mainPage not defined');
        }

        return this.arwikiQuery.getTXsData([mainTX]);
      })
    ).subscribe({
        next: async (txs: ArdbTransaction[]|ArdbBlock[]) => {
          for (let p of txs) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
            const img = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img');
            const id = pTX.id;
            const block = pTX.block;
            const language = this.routeLang;
           
            this.mainPage!.title = title;
            this.mainPage!.img = img;
            this.mainPage!.block = block;
            this.mainPage!.rawContent = await this._arweave.getTxContent(id);

            break;
          }

          this.loadingMainPageTX = false;
        },
        error: (error: string) => {
          this.loadingMainPageTX = false;
          console.error(`Error MainPage: ${error}`);
         
        },
      })
  }

  ngOnInit() {
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    // Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    // Get default theme
    this.getDefaultTheme();
    // Load data
  	this.loadMainPageData();

    // ON route change
    this._userSettings.routeLangStream.subscribe(async (data) => {
      if (data != this.routeLang) {
        this.routeLang = data;
        if (this.routeLang) {
          this.loadMainPageData();
        }  
      }
      
    });
  }

  /*
  *  @dev return an observable with the latest articles
  */
  getLatestArticles(numArticles: number) {    
    this.loadingLatestArticles = true;
    this.latestArticles = [];
    this.allLatestArticles = [];
    this.allApprovedPages = {};
    this.hideBtnMoreArticles = false;
    this.pagesSubscription = this._arwikiPages.getApprovedPages(this.routeLang, -1).pipe(
      switchMap((_approvedPages: ArwikiPageIndex) => {
        this.allApprovedPages = _approvedPages;
        let verifiedPages: string[] = [];

        // Sort desc
        verifiedPages = Array.prototype.sort.call(Object.keys(_approvedPages), (a, b) => {
          return _approvedPages[b].lastUpdateAt! - _approvedPages[a].lastUpdateAt!;
        });
        // Get a copy
        this.allLatestArticles = [...verifiedPages];

        // Slice array
        verifiedPages = Array.prototype.slice.call(verifiedPages, 0, numArticles);

        verifiedPages = verifiedPages.map((slug) => {
          return _approvedPages[slug].id!;
        });

        return this.arwikiQuery.getTXsData(verifiedPages);
      }),
      switchMap((pages: ArdbTransaction[]|ArdbBlock[]) => {
        const latestPages: ArwikiPage[] = [];
        for (let p of pages) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
          // const slug = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
          // const category = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category');
          const img = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img');
          //const language = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang');
          const id = pTX.id;
          const block = pTX.block;
          const tmpSlug = Object.keys(this.allApprovedPages).find((s) => {
            return this.allApprovedPages[s].id === id;
          });
          const slug = tmpSlug ? tmpSlug : '';
          const category = this.allApprovedPages[slug].category;

          const sponsor = this.allApprovedPages[slug].sponsor;
          
          latestPages.push({
            title: title,
            slug: slug,
            category: category,
            img: img,
            id: id,
            block: block,
            language: this.routeLang,
            lastUpdateAt: this.allApprovedPages[slug].lastUpdateAt,
            sponsor: sponsor
          });
        }
        return of(latestPages);
      })
    ).subscribe({
      next: async (pages: ArwikiPage[]) => {
        // Sort desc
        this.latestArticles = pages;
        
        this.loadingLatestArticles = false;
      },
      error: (error) => {
        this._utils.message(error, 'error');
        this.loadingLatestArticles = false;
      }
    });
  }

  ngOnDestroy() {
		this.categoriesSubscription.unsubscribe();
    this.mainPageSubscription.unsubscribe();
    this.pagesSubscription.unsubscribe();
    this.nextLatestArticlesSubscription.unsubscribe();
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
  *  @dev Sanitize HTML
  */
  markdownToHTML(_markdown: string) {
    return this._utils.markdownToHTML(_markdown);
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
    if ((this.defaultTheme === 'arwiki-light' || 
      this.defaultTheme === 'arwiki-orange' || 
      this.defaultTheme === 'arwiki-yellow' || 
      this.defaultTheme === 'arwiki-peach') && this.appLogoLight) {
      return this.appLogoLight;
    } else if (this.defaultTheme === 'arwiki-dark' && this.appLogoDark) {
      return this.appLogoDark;
    }

    return '';
  }

  sortedPartners() {
    return this.partners.sort((a, b) => {
      return a.alt.localeCompare(b.alt);
    });
  }


  nextLatestArticles(increment: number) {
    const from = this.numLatestArticles;
    this.numLatestArticles += increment;
    this.loadingNextLatestArticles = true;

    // Slice array
    let verifiedPages = Array.prototype.slice.call(
      this.allLatestArticles, from, this.numLatestArticles
    );
    verifiedPages = verifiedPages.map((slug) => {
      return this.allApprovedPages[slug].id!;
    });

    if (!verifiedPages || !verifiedPages.length) {
      this.hideBtnMoreArticles = true;
    }

    this.nextLatestArticlesSubscription = this.arwikiQuery.getTXsData(verifiedPages).pipe(
      switchMap((pages: ArdbTransaction[]|ArdbBlock[]) => {
        const latestPages: ArwikiPage[] = [];
        for (let p of pages) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
          //const slug = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
          //const category = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category');
          const img = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img');
          //const language = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang');
          const owner = pTX.owner.address;
          const id = pTX.id;
          const block = pTX.block;
          const tmpSlug = Object.keys(this.allApprovedPages).find((s) => {
            return this.allApprovedPages[s].id === id;
          });
          const slug = tmpSlug ? tmpSlug : '';
          const category = this.allApprovedPages[slug].category;

          const sponsor = this.allApprovedPages[slug].sponsor;
          
          latestPages.push({
            title: title,
            slug: slug,
            category: category,
            img: img,
            id: id,
            block: block,
            language: this.routeLang,
            lastUpdateAt: this.allApprovedPages[slug].lastUpdateAt,
            sponsor: sponsor
          });
        }
        return of(latestPages);
      })
    ).subscribe({
      next: async (pages: ArwikiPage[]) => {
        // Sort desc
        this.latestArticles.push(...pages);
        
        this.loadingNextLatestArticles = false;
      },
      error: (error) => {
        this._utils.message(error, 'error');
        this.loadingNextLatestArticles = false;
      }
    });
  }

  getSubmenu() {
    this.loadingSubmenu = true;
    this.menu = [];
    this.menuSubscription = this._arwikiMenu.getMainMenu(
      this.routeLang
    ).subscribe({
      next: (data) => {
        this.loadingSubmenu = false;
        this.categories = data.categories;

        const pages = data.catPages;
        

        this.menu = this._arwikiMenu.generateMenu(this.categories, pages);
        
      },
      error: (error) => {
        this.loadingSubmenu = false;
        this._utils.message(error, 'error');
      }
    })
  }

}
