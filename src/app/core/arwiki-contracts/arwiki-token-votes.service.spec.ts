import { TestBed } from '@angular/core/testing';

import { ArwikiTokenVotesService } from './arwiki-token-votes.service';

describe('ArwikiTokenVotesService', () => {
  let service: ArwikiTokenVotesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiTokenVotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
