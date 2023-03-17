import { TestBed } from '@angular/core/testing';

import { ArwikiVotesService } from './arwiki-votes.service';

describe('ArwikiVotesService', () => {
  let service: ArwikiVotesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiVotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
