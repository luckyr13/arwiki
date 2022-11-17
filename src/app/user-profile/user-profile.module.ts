import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { UserProfileRoutingModule } from './user-profile-routing.module';
import { ViewDetailComponent } from './view-detail/view-detail.component';
import { PublishedPagesComponent } from './published-pages/published-pages.component';
import { PostedUpdatesComponent } from './posted-updates/posted-updates.component';
import { DonationsMadeComponent } from './donations-made/donations-made.component';
import { DonationsReceivedComponent } from './donations-received/donations-received.component';
import { SponsoredPagesComponent } from './sponsored-pages/sponsored-pages.component';
import { BadgesComponent } from './badges/badges.component';


@NgModule({
  declarations: [
    ViewDetailComponent,
    PublishedPagesComponent,
    PostedUpdatesComponent,
    DonationsMadeComponent,
    DonationsReceivedComponent,
    SponsoredPagesComponent,
    BadgesComponent
  ],
  imports: [
    CommonModule,
    UserProfileRoutingModule,
    SharedModule
  ]
})
export class UserProfileModule { }
