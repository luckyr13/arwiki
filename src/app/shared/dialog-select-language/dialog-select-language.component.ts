import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { Subscription, Observable } from 'rxjs'; 
import { ArweaveService } from '../../core/arweave.service';
import { UtilsService } from '../../core/utils.service';
import { UserSettingsService } from '../../core/user-settings.service';
import { ArwikiLangIndex } from '../../core/interfaces/arwiki-lang-index';
import { ArwikiLangsService } from '../../core/arwiki-contracts/arwiki-langs.service';

@Component({
  templateUrl: './dialog-select-language.component.html',
  styleUrls: ['./dialog-select-language.component.scss']
})
export class DialogSelectLanguageComponent implements OnInit, OnDestroy {
	langs: ArwikiLangIndex = {};
	langCodes: string[] = [];
	langsSubscription: Subscription = Subscription.EMPTY;
	loading: boolean = false;
	error: string = '';
  defaultTheme: string = '';

  constructor(
  	private _arwikiToken: ArwikiTokenContract,
  	private _arweave: ArweaveService,
  	private _utils: UtilsService,
    private _userSettings: UserSettingsService,
    private _arwikiTokenLangs: ArwikiLangsService
  ) { }

  ngOnInit(): void {
  	this.loading = true;
    this.getDefaultTheme();

  	this.langsSubscription = this._arwikiTokenLangs
  		.getLanguages()
  		.subscribe({
  			next: (state: ArwikiLangIndex) => {
	  			this.langs = {};
	  			for (let s of Object.keys(state)) {
            if (state[s].active) {
              this.langs[s] = state[s];
              this.langCodes.push(s);
            }
	  			}
	  			this.langCodes = Array.prototype.sort.call(this.langCodes);
	  			this.loading = false;
	  		},
	  		error: (error) => {
	  			this.error = error;
	  			this.loading = false;
	  			this._utils.message(error, 'error');
	  		}
	  	});
  }

  ngOnDestroy() {
  	if (this.langsSubscription) {
  		this.langsSubscription.unsubscribe();
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

  getDefaultTheme() {
    this.defaultTheme = this._userSettings.getDefaultTheme();
    this._userSettings.defaultThemeStream.subscribe(
      (theme) => {
        this.defaultTheme = theme;
      }
    );
  }
}
