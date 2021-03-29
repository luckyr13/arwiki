import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './home/home.component';
import { SharedModule } from './shared/shared.module';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { SearchEngineComponent } from './search-engine/search-engine.component';
import { FooterComponent } from './footer/footer.component';
import { MainToolbarComponent } from './main-toolbar/main-toolbar.component';
import { PageComponent } from './page/page.component';
import { MainPageComponent } from './main-page/main-page.component';
import { MainMenuComponent } from './main-menu/main-menu.component';

import {HttpClientModule, HttpClient} from '@angular/common/http';
import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import { SearchComponent } from './search/search.component';
import { FeaturedArticleComponent } from './featured-article/featured-article.component';
import { TopArticlesComponent } from './top-articles/top-articles.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    PageNotFoundComponent,
    SearchEngineComponent,
    FooterComponent,
    MainToolbarComponent,
    PageComponent,
    MainPageComponent,
    MainMenuComponent,
    SearchComponent,
    FeaturedArticleComponent,
    TopArticlesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
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
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
