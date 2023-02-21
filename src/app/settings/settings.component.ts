import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  routeLang = '';
  
  constructor(
    private _router: Router,
    private _route: ActivatedRoute) { }

  ngOnInit(): void {
    const routeLang = this._route.snapshot.paramMap.get('lang')!;
    
    if (routeLang) {
      this.routeLang = routeLang;
    }

    this._route.paramMap.subscribe((params) => {
      const routeLang = params.get('lang');
      
      if (routeLang) {
        this.routeLang = routeLang;
      }
    });

  }

}
