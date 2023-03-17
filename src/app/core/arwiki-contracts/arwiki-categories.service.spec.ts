import { TestBed } from '@angular/core/testing';

import { ArwikiCategoriesService } from './arwiki-categories.service';

describe('ArwikiCategoriesService', () => {
  let service: ArwikiCategoriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiCategoriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
