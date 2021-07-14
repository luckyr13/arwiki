import { Component, OnInit, Inject } from '@angular/core';
import {MAT_BOTTOM_SHEET_DATA} from '@angular/material/bottom-sheet';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
declare const window: any;

@Component({
  selector: 'app-bottom-sheet-share',
  templateUrl: './bottom-sheet-share.component.html',
  styleUrls: ['./bottom-sheet-share.component.scss']
})
export class BottomSheetShareComponent implements OnInit {
	fullURL: string = '';
	windowObjectReference: any;
	previousURL: string = '';

  constructor(
  	@Inject(MAT_BOTTOM_SHEET_DATA) public data: {title: string, img: string, content: string},
    private _clipboard: Clipboard,
    private _snackBar: MatSnackBar) { }

  ngOnInit(): void {
  	this.fullURL = `${window.location.href}`;
  }

  private _copyLinkToClipboard() {
    this._clipboard.copy(this.fullURL);
    this.message('Link copied!', 'success', 'top');
  }

  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }

  shareInSocialMedia(_socialMediaOption: string) {
		const urlencodeddesc = encodeURIComponent(`${this.data.title}: ${this.data.content} Read full article: ${this.fullURL}`);
		const urlencodedimg = encodeURIComponent(`${this.data.img}`);
		const urlencodedtitle = encodeURIComponent(`${this.data.title}`);
		const urlencodedurl = encodeURIComponent(`${this.fullURL}`);
  	switch (_socialMediaOption) {
  		case 'facebook':
  			const facebookURL = `https://www.facebook.com/share.php?u=${urlencodedurl}&quote=${urlencodeddesc}&picture=${urlencodedimg}`;
  			this.openWindowPopup(facebookURL);
  		break;
  		case 'twitter':
  			const tweet = `${urlencodedtitle}: ${this.data.content}`.substr(0, 240);
  			const twitterURL = `https://twitter.com/share?url=${urlencodedurl}&text=${tweet}`;
  			this.openWindowPopup(twitterURL);
  		break;
  		case 'whatsapp':
  			const whatsappURL = `https://wa.me/?text=${urlencodeddesc}`;
  			this.openWindowPopup(whatsappURL);
  		break;
  		case 'copyLink':
  			this._copyLinkToClipboard();
  		break;
  		default:
  			this.message('Option not found!', 'error');
  		break;
  	}
  }

  /*
  * From: https://developer.mozilla.org/en-US/docs/Web/API/Window/open
  */
  openWindowPopup(url: string) {
  	const windowFeatures = "resizable,scrollbars,status";
  	const windowFeaturesNew = "resizable=yes,scrollbars=yes,status=yes";
  	if(this.windowObjectReference == null || this.windowObjectReference.closed) {
  		this. windowObjectReference = window.open(url, "_SOCIALWINDOW", windowFeatures);
  	} else if (this.previousURL !== url) {
  		this. windowObjectReference = window.open(url, "_SOCIALWINDOW", windowFeaturesNew);
  		this.windowObjectReference.focus();
  	} else {
  		this.windowObjectReference.focus();
  	}

  	this.previousURL = url;
	}

}
