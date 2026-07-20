import { TestBed } from '@angular/core/testing';
import { BROWSER_STORAGE } from './storage';

describe('BROWSER_STORAGE', () => {
  it('supports an injected browser storage implementation', () => {
    const storage = {} as Storage;
    TestBed.configureTestingModule({
      providers: [{ provide: BROWSER_STORAGE, useValue: storage }]
    });

    expect(TestBed.inject(BROWSER_STORAGE)).toBe(storage);
  });
});
