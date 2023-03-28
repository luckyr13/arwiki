import { ArwikiPage } from '../../core/interfaces/arwiki-page';

export interface ArwikiPendingPage {
  page: ArwikiPage;
  status:'accepted'|'rejected'|'pending';
}