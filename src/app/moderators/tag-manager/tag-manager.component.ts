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
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import { DialogConfirmComponent } from '../../shared/dialog-confirm/dialog-confirm.component';
import { AuthService } from '../../auth/auth.service';
import { Arwiki } from '../../core/arwiki';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token';
import { switchMap } from 'rxjs/operators';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';

@Component({
  templateUrl: './tag-manager.component.html',
  styleUrls: ['./tag-manager.component.scss']
})
export class TagManagerComponent implements OnInit, OnDestroy {
	pageSubscription: Subscription = Subscription.EMPTY;
  tagsSubscription: Subscription = Subscription.EMPTY;
  page: any;
  loadingPage: boolean = false;
  arwikiQuery!: ArwikiQuery;
  baseURL: string = this._arweave.baseURL;
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  tags: any[] = [];
  currentTags: string[] = [];
  frmTags: FormGroup = new FormGroup({
    newTags: new FormControl('')
  });
  loadingSavingTags: boolean = false;
  savingTagsTX: string[] = [];
  routeLang: string = '';
  private _arwiki!: Arwiki;

  constructor(
    private route: ActivatedRoute,
  	private _arweave: ArweaveService,
  	private _snackBar: MatSnackBar,
    private _location: Location,
    private _dialog: MatDialog,
    private _auth: AuthService,
    private _arwikiToken: ArwikiTokenContract
  ) { }

  get newTags() {
    return this.frmTags.get('tags');
  }

  async ngOnInit() {
    this.routeLang = this.route.snapshot.paramMap.get('lang')!;
     // Init arwiki 
    this._arwiki = new Arwiki(this._arweave.arweave);

  	const slug = this.route.snapshot.paramMap.get('slug')!;
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    this.loadPageTXData(slug);
    await this.loadTags(slug);

  	
  }

  ngOnDestroy() {
  	if (this.pageSubscription) {
      this.pageSubscription.unsubscribe();
    }
    if (this.tagsSubscription) {
      this.tagsSubscription.unsubscribe();
    }
  }

  loadPageTXData(slug: string) {
    this.loadingPage = true;
    this.pageSubscription = this._arwikiToken.getApprovedPages(this.routeLang).
      pipe(switchMap((approvedPages) => {
        const address: string = approvedPages && approvedPages[slug] ? approvedPages[slug].content! : '';
        return this.arwikiQuery.getTXsData([address]);
      })).subscribe({
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
        }
        this.loadingPage = false;
      },
      error: (error) => {
        this.message(error, 'error');
        this.loadingPage = false;
      }
    });
  }

  async loadTags(slug: string) {
    const maxTags = 100;
    let networkInfo;
    let maxHeight = 0;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height;
    } catch (error) {
      this.message(error, 'error');
      return;
    }

    this.tagsSubscription = this.arwikiQuery.getVerifiedTagsFromSlug(
      this._auth.getAdminList(), 
      slug,
      maxTags,
      maxHeight,
    ).subscribe({
      next: (tags: ArdbTransaction[]|ArdbBlock[]) => {
        this.currentTags = [];
        for (let p of tags) {
          const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
          this.currentTags.push(
            this.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Tag')
          );
        }
        
      },
      error: (error) => {
        this.message(error, 'error');
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


  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our tag
    if ((value || '').trim()) {
      this.tags.push({name: value.trim()});
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(tag: any): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  onSubmit() {
    this.confirmSaveTags(
      this.tags,
      this.page.category,
      this.page.id,
      this.page.language,
      this.page.slug
    );
  }


  confirmSaveTags(
    _tags: any[],
    _category: string,
    _content_id: string,
    _lang: string,
    _slug: string
  ) {
    const tagsList = _tags.map(t => t.name);
    const msg = `You are about to create the next tags: ${ tagsList.join() }. Do you want to proceed?`;
    const dialogRef = this._dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Are you sure?',
        content: msg
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        // Create arwiki page
        this.loadingSavingTags = true;
        try {
          this.savingTagsTX = [];

          for (let tag of tagsList) {
            const tx = await this._arwiki.createTagTXForArwikiPage(
              _content_id,
              tag,
              _category,
              this.routeLang,
              _slug,
              this._auth.getPrivateKey()
            );
            
            this.savingTagsTX.push(tx);
          }
          this.message('Success!', 'success');
        } catch (error) {
          this.message(error, 'error');
        }
        this.loadingSavingTags = false;

      }
    });
  }
}
