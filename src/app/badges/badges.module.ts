import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BadgesRoutingModule } from './badges-routing.module';
import { ExploreComponent } from './explore/explore.component';


@NgModule({
  declarations: [
    ExploreComponent
  ],
  imports: [
    CommonModule,
    BadgesRoutingModule
  ]
})
export class BadgesModule { }
