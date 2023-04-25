import { TestBed } from '@angular/core/testing';

import { ArwikiAtomicNftService } from './arwiki-atomic-nft.service';

describe('ArwikiAtomicNftService', () => {
  let service: ArwikiAtomicNftService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiAtomicNftService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
