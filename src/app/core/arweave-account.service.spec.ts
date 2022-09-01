import { TestBed } from '@angular/core/testing';

import { ArweaveAccountService } from './arweave-account.service';

describe('ArweaveAccountService', () => {
  let service: ArweaveAccountService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArweaveAccountService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
