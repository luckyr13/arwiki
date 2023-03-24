import { TestBed } from '@angular/core/testing';

import { ArwikiPageTagsService } from './arwiki-page-tags.service';

describe('ArwikiPageTagsService', () => {
  let service: ArwikiPageTagsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiPageTagsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
