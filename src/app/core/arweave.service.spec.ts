import { TestBed } from '@angular/core/testing';

import { ArweaveService } from './arweave.service';

describe('ArweaveService', () => {
  let service: ArweaveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArweaveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
