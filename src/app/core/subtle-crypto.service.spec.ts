import { TestBed } from '@angular/core/testing';

import { SubtleCryptoService } from './subtle-crypto.service';

describe('SubtleCryptoService', () => {
  let service: SubtleCryptoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubtleCryptoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
