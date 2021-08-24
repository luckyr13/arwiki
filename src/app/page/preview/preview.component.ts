import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { ArwikiQuery } from '../../core/arwiki-query';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';

@Component({
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss']
})
export class PreviewComponent implements OnInit, OnDestroy {
	htmlContent: string = '';
	pageSubscription: Subscription = Subscription.EMPTY;
  page: any;
  loadingPage: boolean = false;
  arwikiQuery: ArwikiQuery|null = null;
  baseURL: string = this._arweave.baseURL;

  constructor(
    private route: ActivatedRoute,
  	private _arweave: ArweaveService,
  	private _snackBar: MatSnackBar,
    private _location: Location
  ) { }

  ngOnInit(): void {
  	const contractAddress = this.route.snapshot.paramMap.get('id')!;
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    this.loadPageTXData(contractAddress);

    this.route.paramMap.subscribe(params => {
      const pageId = params.get('id');
      
      if (pageId) {
        this.loadPageTXData(contractAddress);
      }

    });
  	
  }

  ngOnDestroy() {
  	if (this.pageSubscription) {
      this.pageSubscription.unsubscribe();
    }
  }

  loadPageTXData(contractAddress: string) {
    this.loadingPage = true;
    this.pageSubscription = this.arwikiQuery!.getTXsData([contractAddress]).subscribe({
      next: (txData: ArdbTransaction[]|ArdbBlock[]) => {
        if (txData && txData.length) {
          const p = txData[0];
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          this.page = {
            id: pTX.id,
            title: this.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title'),
            slug: this.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug'),
            category: this.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category'),
            language: this.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang'),
            img: this.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img'),
            owner: pTX.owner.address,
            block: pTX.block
          };
          // Load content
          this.loadPageData(contractAddress);

        }
      },
      error: (error) => {
        this.message(error, 'error');
      }
    });
  }

  loadPageData(contractAddress: string) {
    this._arweave.getDataAsString(contractAddress!)
      .then((data) => {
        this.htmlContent = this.markdownToHTML(data);
        this.loadingPage = false;
      }).catch((error) => {
        this.message(error, 'error');
        this.loadingPage = false;
      });
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


  searchKeyNameInTags(_arr: any[], _key: string) {
    let res = '';
    for (const a of _arr) {
      if (a.name.toUpperCase() === _key.toUpperCase()) {
        return a.value;
      }
    }
    return res;
  }
}
