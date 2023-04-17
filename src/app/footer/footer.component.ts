import { Component, OnInit, OnDestroy } from '@angular/core';
import { arwikiVersion, arwikiAppVersion } from '../core/arwiki';
import { ActivatedRoute } from '@angular/router';
import { UserSettingsService } from '../core/user-settings.service';
import { ArwikiPagesService } from '../core/arwiki-contracts/arwiki-pages.service';
import { Subscription, switchMap, of, map } from 'rxjs';
import { ArwikiPage } from '../core/interfaces/arwiki-page';
import { ArwikiQuery } from '../core/arwiki-query';
import { ArweaveService } from '../core/arweave.service';
import ArdbTransaction from 'ardb/lib/models/transaction';
import ArdbBlock from 'ardb/lib/models/block';
import { ArwikiMenuService } from '../core/arwiki-contracts/arwiki-menu.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
	arwikiProtocolV: string = arwikiVersion[0];
  arwikiV: string = arwikiAppVersion;
  routerLang = '';
  footerLinks: Array<{label:string, url:string[]}> = [];
  footerLinksSubscription = Subscription.EMPTY;
  arwikiQuery!: ArwikiQuery;

  constructor(
    private _userSettings: UserSettingsService,
    private _arwikiPages: ArwikiPagesService,
    private _arweave: ArweaveService,
    private _arwikiMenu: ArwikiMenuService) { }

  ngOnInit(): void {
    let defaultLang = this._userSettings.getDefaultLang();
    if (defaultLang && defaultLang.code) {
      this.routerLang = defaultLang.code;
    }

    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);

    this._userSettings.routeLangStream.subscribe(async (data) => {
      if (data != this.routerLang) {
        this.routerLang = data;
        this.loadFooterLinks(this.routerLang);
      }
    });

    this.loadFooterLinks(this.routerLang);
  }

  ngOnDestroy() {
    this.footerLinksSubscription.unsubscribe();
  }

  loadFooterLinks(langCode: string) {
    this.footerLinks = [];
    const finalPages: Record<string, ArwikiPage> = {};
    this.footerLinksSubscription = this._arwikiPages.getApprovedPages(
      langCode, -1
    ).pipe(
      switchMap((pages) => {
        const finalIds: string[] = [];
        for (const slug in pages) {
          if (pages[slug].showInFooter) {
            finalPages[slug] = pages[slug];
            finalIds.push(pages[slug].id);
          }
        }

        return this.arwikiQuery.getTXsData(finalIds);
      }),
      map((pagesTX: ArdbTransaction[]|ArdbBlock[]) => {
        for (let p of pagesTX) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
            const id = pTX.id;
            const tmpSlug = Object.keys(finalPages).find((s) => {
              return finalPages[s].id === id;
            });
            const slug = tmpSlug ? tmpSlug : '';
            if (Object.prototype.hasOwnProperty.call(finalPages, slug)) {
              finalPages[slug].title = title;
            }
        }
        return finalPages;
      })
    ).subscribe({
      next: (pages: Record<string, ArwikiPage>) => {
        const links: Array<{label:string, url:string[]}> = [];
        const pagesArr: ArwikiPage[] = Object.values(pages);
        this._arwikiMenu.sortPages(pagesArr);
        
        for (const p of pagesArr) {
          links.push({
            label: p.title,
            url: ['/', langCode, p.slug]
          });
        }
        this.footerLinks = links;
      },
      error: (error) => {
        console.error('loadFooterLinks', error);
      }
    });
  }

}
