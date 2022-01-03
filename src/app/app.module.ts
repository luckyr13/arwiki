import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './home/home.component';
import { SharedModule } from './shared/shared.module';
import { SearchEngineComponent } from './search-engine/search-engine.component';
import { FooterComponent } from './footer/footer.component';
import { MainToolbarComponent } from './main-toolbar/main-toolbar.component';
import { MainPageComponent } from './main-page/main-page.component';
import { MainMenuComponent } from './main-menu/main-menu.component';

import {HttpClientModule, HttpClient} from '@angular/common/http';
import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import { SearchComponent } from './search/search.component';
import { CategoryModule } from './category/category.module';
import { PageModule } from './page/page.module';
import { ModeratorsModule } from './moderators/moderators.module';
import { ErrorComponent } from './error/error.component';
import { UserPanelModule } from './user-panel/user-panel.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';


// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SearchEngineComponent,
    FooterComponent,
    MainToolbarComponent,
    MainPageComponent,
    MainMenuComponent,
    SearchComponent,
    ErrorComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      defaultLanguage: 'en'
    }),
    CategoryModule,
    UserPanelModule,
    ModeratorsModule,
    AppRoutingModule,
    PageModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
