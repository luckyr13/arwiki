import { TestBed } from '@angular/core/testing';

import { RedstoneSmartweaveService } from './redstone-smartweave.service';

describe('RedstoneSmartweaveService', () => {
  let service: RedstoneSmartweaveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RedstoneSmartweaveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
