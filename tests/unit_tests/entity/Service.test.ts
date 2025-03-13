import { Service } from '../../../src/entity/Service';

describe('Service Entity', () => {
  it('should create a service', () => {
    const service = new Service();
    service.name = 'Cleaning';

    expect(service.name).toBe('Cleaning');
  });
});
