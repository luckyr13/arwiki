import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title, MetaDefinition } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  constructor(
    private _pageTitle: Title,
    private _metaTag: Meta) {
  }

  public set title(title: string) {
  	this._pageTitle.setTitle(title);
  }

  public get title(): string {
  	return this._pageTitle.getTitle();
  }

  public updateMetaTag(tag: MetaDefinition) {
		this._metaTag.updateTag(tag)
  }

  public getMetaTag(name: string): HTMLMetaElement {
  	return this._metaTag.getTag(name)!;
  }
}
