import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
	// Observable string sources
  private routePath = new Subject<string>();

  // Observable string streams
  public routePath$ = this.routePath.asObservable();

  updatePath(_path: string) {
  	this.routePath.next(_path);
  }

  constructor() { }
}
