import { TestBed } from '@angular/core/testing';

import { SeoResolverService } from './seo-resolver.service';

describe('SeoResolverService', () => {
  let service: SeoResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
