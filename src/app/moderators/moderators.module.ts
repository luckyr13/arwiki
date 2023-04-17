import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { ModeratorsRoutingModule } from './moderators-routing.module';
import { PendingListComponent } from './pending-list/pending-list.component';
import { MenuComponent } from './menu/menu.component';
import { AddAdminComponent } from './add-admin/add-admin.component';
import { ViewAdminListComponent } from './view-admin-list/view-admin-list.component';
import { ApprovedListComponent } from './approved-list/approved-list.component';
import { TagManagerComponent } from './tag-manager/tag-manager.component';
import { DeletedListComponent } from './deleted-list/deleted-list.component';
import { PageUpdatesComponent } from './page-updates/page-updates.component';
import { DialogSearchPageUpdateComponent } from './dialog-search-page-update/dialog-search-page-update.component';
import { ActivityHistoryComponent } from './activity-history/activity-history.component';
import { HistoryPagesRejectedComponent } from './history-pages-rejected/history-pages-rejected.component';
import { HistoryUpdatesApprovedComponent } from './history-updates-approved/history-updates-approved.component';
import { LanguagesComponent } from './languages/languages.component';
import { DialogNewLanguageComponent } from './dialog-new-language/dialog-new-language.component';
import { DialogEditLanguageComponent } from './dialog-edit-language/dialog-edit-language.component';
import { CategoriesComponent } from './categories/categories.component';
import { PagesComponent } from './pages/pages.component';
import { DialogNewCategoryComponent } from './dialog-new-category/dialog-new-category.component';
import { DialogEditCategoryComponent } from './dialog-edit-category/dialog-edit-category.component';
import { DialogEditPagePropertiesComponent } from './dialog-edit-page-properties/dialog-edit-page-properties.component';


@NgModule({
  declarations: [PendingListComponent, MenuComponent, AddAdminComponent, ViewAdminListComponent, ApprovedListComponent, TagManagerComponent, DeletedListComponent, PageUpdatesComponent, DialogSearchPageUpdateComponent, ActivityHistoryComponent, HistoryPagesRejectedComponent, HistoryUpdatesApprovedComponent, LanguagesComponent, DialogNewLanguageComponent, DialogEditLanguageComponent, CategoriesComponent, PagesComponent, DialogNewCategoryComponent, DialogEditCategoryComponent, DialogEditPagePropertiesComponent],
  imports: [
    CommonModule,
    ModeratorsRoutingModule,
    SharedModule
  ]
})
export class ModeratorsModule { }
