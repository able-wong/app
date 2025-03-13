import { Location } from '../../../src/entity/Location';

describe('Location Entity', () => {
  it('should create a location', () => {
    const location = new Location();
    location.address = '123 Main St';

    expect(location.address).toBe('123 Main St');
  });
});
