import { Customer } from '../../../src/entity/Customer';

describe('Customer Entity', () => {
  it('should create a customer', () => {
    const customer = new Customer();
    customer.name = 'Acme Corp';

    expect(customer.name).toBe('Acme Corp');
  });
});
