import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MainPageComponent } from './main-page/main-page.component';
import { AuthGuard } from './auth/auth.guard';
import { InitPlatformGuard } from './auth/init-platform.guard';
import { ErrorComponent } from './error/error.component';
import { PreloadAllModules } from '@angular/router';

const routes: Routes = [
  {
    path: 'error',
    component: ErrorComponent
  },
  {
    path: '',
    canActivateChild: [InitPlatformGuard],
    children: [
      {
        path: '', component: HomeComponent, pathMatch: 'full',
      },
      {
        path: ':lang', redirectTo: ':lang/main', pathMatch: 'full',
      },
      {
        path: ':lang/main', component: MainPageComponent,
      },  
      {
        path: ':lang/category',
        loadChildren: () => import('./category/category.module').then(m => m.CategoryModule),
      },
      { path: ':lang/search', loadChildren: () => import('./search/search.module').then(m => m.SearchModule) },
      {
        path: ':lang/dashboard',
        loadChildren: () => import('./user-panel/user-panel.module').then(m => m.UserPanelModule),
      },
      {
        path: ':lang/moderators',
        loadChildren: () => import('./moderators/moderators.module').then(m => m.ModeratorsModule),
      },
      {
        path: ':lang/user',
        loadChildren: () => import('./user-profile/user-profile.module').then(m => m.UserProfileModule)
      }
    ]
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes,
      {useHash: true, preloadingStrategy: PreloadAllModules},
    )
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
