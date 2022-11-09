import { TestBed } from '@angular/core/testing';

import { VouchDaoService } from './vouch-dao.service';

describe('VouchDaoService', () => {
  let service: VouchDaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VouchDaoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
