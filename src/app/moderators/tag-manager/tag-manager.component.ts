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

@Component({
  templateUrl: './tag-manager.component.html',
  styleUrls: ['./tag-manager.component.scss']
})
export class TagManagerComponent implements OnInit, OnDestroy {
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
  	const contractAddress = this.route.snapshot.paramMap.get('txId')!;
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    this.loadPageTXData(contractAddress);

    this.route.paramMap.subscribe(params => {
      const pageId = params.get('txId');
      
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
      next: (txData) => {
        if (txData && txData.length) {
          const p = txData[0];
          this.page = {
            id: p.node.id,
            title: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title'),
            slug: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug'),
            category: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category'),
            language: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Lang'),
            img: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Img'),
            owner: p.node.owner.address,
            block: p.node.block
          };
        }
        this.loadingPage = false;
      },
      error: (error) => {
        this.message(error, 'error');
        this.loadingPage = false;
      }
    });
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
