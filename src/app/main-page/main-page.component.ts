import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserSettingsService } from '../core/user-settings.service';
import { ArwikiCategoriesContract } from '../core/arwiki-contracts/arwiki-categories';
import { Subscription, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ArweaveService } from '../core/arweave.service';
import { ArwikiSettingsContract } from '../core/arwiki-contracts/arwiki-settings';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArwikiQuery } from '../core/arwiki-query';
import { AuthService } from '../auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ArwikiCategoryIndex } from '../core/interfaces/arwiki-category-index';
import { ArwikiAdminList } from '../core/interfaces/arwiki-admin-list';

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
  appName: string = '';
  // appLogoLight: string = './assets/img/arweave-light.png';
  appLogoLight: string = '';
  // appLogoDark: string = './assets/img/arweave-dark.png';
  appLogoDark: string = '';
  appSettingsSubscription: Subscription = Subscription.EMPTY;
  loadingLogo: boolean = false;
  loadingLatestArticles: boolean = false;
  latestArticles: any[] = [];
  latestArticlesData: any;
  arwikiQuery!: ArwikiQuery;
  pagesSubscription: Subscription = Subscription.EMPTY;
  routeLang: string = '';
  baseURL = this._arweave.baseURL;
  pagesByCategory: any = {};

  constructor(
    private _userSettings: UserSettingsService,
    private _categoriesContract: ArwikiCategoriesContract,
    private _arweave: ArweaveService,
    private _arwikiSettings: ArwikiSettingsContract,
    private _snackBar: MatSnackBar,
    private _auth: AuthService,
    private _route: ActivatedRoute,
    private _router: Router
  ) { }

  async loadMainPageData() {
    this.getDefaultTheme();

    this.loading = true;
    this.loadingLogo = true;
    this.loadingLatestArticles = true;
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
    let maxPagesByCategory = 10;
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
              block: block
            });

          }

          this.loading = false;
        },
        error: (error) => {
          this.message(`Error: ${error}`, 'error')
          this.loading = false;
        },
      })



    // Get logo 
    this.appSettingsSubscription = this._arwikiSettings
      .getState()
      .subscribe({
        next: (state) => {
          this.appName = state.app_name;
          this.appLogoLight = `${this._arweave.baseURL}${state.main_logo_light}`;
          this.appLogoDark = `${this._arweave.baseURL}${state.main_logo_dark}`;
          this.loadingLogo = false;
        },
        error: (error) => {
          this.message(error, 'error');
          this.loadingLogo = false;
        }
      });

    // Get latest articles 
    const numArticles = 10;

    this.pagesSubscription = this.getLatestArticles(
        numArticles, this.routeLang, maxHeight
      ).subscribe({
      next: async (pages) => {
        const latestPages: any = [];
        for (let p of pages) {
          const title = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title');
          const slug = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
          const category = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category');
          const img = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Img');
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
            block: block
          });
        }
        this.latestArticles = latestPages;
        this.loadingLatestArticles = false;
        this.latestArticlesData = {};

        for (let p of latestPages) {
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
  getLatestArticles(numArticles: number, langCode: string, height: number) {
    let admins: string[] = [];
    return this._arwikiSettings.getAdminList().pipe(
      switchMap((adminList: ArwikiAdminList) => {
        admins = Object.keys(adminList);
        admins = admins.filter((adminAddress) => {
          return adminList[adminAddress].active;
        });

        return this._categoriesContract.getState();
      }),
      switchMap((categories) => {
        return this.arwikiQuery.getVerifiedPagesByCategories(
          admins, Object.keys(categories), langCode, numArticles, height
        );
      }),
      switchMap((pages) => {
        const txIds: any = [];
        for (let p of pages) {
          const pageId = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');  
          txIds.push(pageId);
        }
        return this.arwikiQuery.getTXsData(txIds);
      })
      
    );
  }


  getDefaultTheme() {
  	this.defaultTheme = this._userSettings.getDefaultTheme();
    this._userSettings.defaultThemeStream.subscribe(
    	(theme) => {
    		this.defaultTheme = theme;
    	}
    );
  }

  ngOnDestroy() {
  	if (this.categoriesSubscription) {
  		this.categoriesSubscription.unsubscribe();
  	}
    if (this.appSettingsSubscription) {
      this.appSettingsSubscription.unsubscribe();
    }
  }

  getSkeletonLoaderAnimationType() {
  	let type = 'progress';
  	if (this.defaultTheme === 'arwiki-dark') {
  		type = 'progress-dark';
  	}
  	return type;
  }

  getSkeletonLoaderThemeNgStyle() {
  	let ngStyle: any = {
  		'height.px': '30',
  		'width': '100%'
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
      'margin-top.px': '40',
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

  getSkeletonLoaderThemeNgStylePLine() {
    let ngStyle: any = {
      'height.px': '20',
      'width': '100%',
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
    return this._arwikiSettings.getAdminList().pipe(
      switchMap((adminList: ArwikiAdminList) => {
        admins = Object.keys(adminList);
        admins = admins.filter((adminAddress) => {
          return adminList[adminAddress].active;
        });
        return this._categoriesContract.getState();
      }),
      switchMap((categories: ArwikiCategoryIndex) => {
        this.categories = categories;
        this.categoriesSlugs = Object.keys(this.categories)
           .sort((f1: any, f2: any) => {
          if (this.categories[f1].order < this.categories[f2].order) {
            return -1;
          }
          if (this.categories[f1].order > this.categories[f2].order) {
            return 1;
          }
          // a must be equal to b
          return 0;
        });

        return this.arwikiQuery.getVerifiedPagesByCategories(
          admins, Object.keys(categories), langCode, numArticles, height
        );
      }),
      switchMap((pages) => {
        const txIds: any = [];
        for (let p of pages) {
          const pageId = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');  
          txIds.push(pageId);
        }
        return this.arwikiQuery.getTXsData(txIds);
      })
      
    );
  }

}
