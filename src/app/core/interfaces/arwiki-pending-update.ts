import { ArwikiPageUpdate } from '../../core/interfaces/arwiki-page-update';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';

export interface ArwikiPendingUpdate {
  page: ArwikiPage;
  status:'accepted'|'rejected'|'pending';
  updateInfo: ArwikiPageUpdate|null;
}