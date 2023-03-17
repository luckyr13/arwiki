import { TestBed } from '@angular/core/testing';

import { ArwikiTokenContract } from './arwiki-token.service';

describe('ArwikiTokenContract', () => {
  let service: ArwikiTokenContract;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiTokenContract);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
