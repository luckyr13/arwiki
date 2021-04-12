import { TestBed } from '@angular/core/testing';

import { ModeratorGuard } from './moderator.guard';

describe('ModeratorGuard', () => {
  let guard: ModeratorGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(ModeratorGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
