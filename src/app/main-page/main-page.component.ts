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

  constructor(
    private _userSettings: UserSettingsService,
    private _categoriesContract: ArwikiCategoriesContract,
    private _arweave: ArweaveService
  ) { }

  ngOnInit(): void {
  	this.defaultTheme = this._userSettings.getDefaultTheme();
    this._userSettings.defaultThemeObservable$.subscribe(
    	(theme) => {
    		this.defaultTheme = theme;
    	}
    );

    // Get categories (portals)
    this.categoriesSubscription = this._categoriesContract.getState(
    	this._arweave.arweave
    ).subscribe({
    	next: (data) => {
    		this.categories = data.categories;
    		this.categoriesSlugs = Object.keys(this.categories);
    	},
    	error: (error) => {
    		console.log('error categories', error);
    	},
    	
  	});
  }

  ngOnDestroy() {
  	if (this.categoriesSubscription) {
  		this.categoriesSubscription.unsubscribe();
  	}
  }

}
