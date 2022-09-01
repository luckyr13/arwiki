import { TestBed } from '@angular/core/testing';

import { WarpContractsService } from './warp-contracts.service';

describe('WarpContractsService', () => {
  let service: WarpContractsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WarpContractsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
