import { TestBed } from '@angular/core/testing';

import { ArwikiPageVotesService } from './arwiki-page-votes.service';

describe('ArwikiPageVotesService', () => {
  let service: ArwikiPageVotesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiPageVotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
