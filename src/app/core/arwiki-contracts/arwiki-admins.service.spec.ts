import { TestBed } from '@angular/core/testing';

import { ArwikiAdminsService } from './arwiki-admins.service';

describe('ArwikiAdminsService', () => {
  let service: ArwikiAdminsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiAdminsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
