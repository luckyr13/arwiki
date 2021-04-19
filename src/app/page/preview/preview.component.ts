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

@Component({
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss']
})
export class PreviewComponent implements OnInit, OnDestroy {
	htmlContent: string = '';
	pageSubscription: Subscription = Subscription.EMPTY;
  loadingPage: boolean = false;

  constructor(
    private route: ActivatedRoute,
  	private _arweave: ArweaveService,
  	private _snackBar: MatSnackBar,
    private _location: Location
  ) { }

  ngOnInit(): void {
  	const contractAddress = this.route.snapshot.paramMap.get('id');
    this.loadingPage = true;

  	this._arweave.getDataAsString(contractAddress!)
  		.then((data) => {
				this.htmlContent = this.markdownToHTML(data);
        this.loadingPage = false;
			}).catch((error) => {
				this.message(error, 'error');
        this.loadingPage = false;
			});

    this.route.paramMap.subscribe(params => {
      const pageId = params.get('id');
      
      if (pageId) {
        this._arweave.getDataAsString(pageId)
          .then((data) => {
            this.htmlContent = this.markdownToHTML(data);
            this.loadingPage = false;
          }).catch((error) => {
            this.message(error, 'error');
            this.loadingPage = false;
          });
      }

    });
  	
  }

  ngOnDestroy() {
  	
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
}
