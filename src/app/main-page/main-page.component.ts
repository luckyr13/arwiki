import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserSettingsService } from '../auth/user-settings.service';
import { ArwikiCategoriesContract } from '../arwiki-contracts/arwiki-categories';
import { Subscription } from 'rxjs';
import { ArweaveService } from '../auth/arweave.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit, OnDestroy {
	categories: any = {};
	categoriesSlugs: string[] = [];
	categoriesSubscription: Subscription = Subscription.EMPTY;
	defaultTheme: string = '';
	loading: boolean = false;

  constructor(
    private _userSettings: UserSettingsService,
    private _categoriesContract: ArwikiCategoriesContract,
    private _arweave: ArweaveService
  ) { }

  ngOnInit(): void {
  	this.getDefaultTheme();
  	this.loading = true;

    // Get categories (portals)
    this.categoriesSubscription = this._categoriesContract.getState(
    	this._arweave.arweave
    ).subscribe({
    	next: (data) => {
    		this.categories = data.categories;
    		this.categoriesSlugs = Object.keys(this.categories);
    		this.loading = false;
    	},
    	error: (error) => {
    		console.log('error categories', error);
    		this.loading = false;
    	},
    	
  	});
  }

  getDefaultTheme() {
  	this.defaultTheme = this._userSettings.getDefaultTheme();
    this._userSettings.defaultThemeObservable$.subscribe(
    	(theme) => {
    		this.defaultTheme = theme;
    	}
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

}
