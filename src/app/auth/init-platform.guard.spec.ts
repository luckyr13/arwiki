import { TestBed } from '@angular/core/testing';

import { InitPlatformGuard } from './init-platform.guard';

describe('InitPlatformGuard', () => {
  let guard: InitPlatformGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(InitPlatformGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
