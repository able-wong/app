import { User } from '../../../src/entity/User';

describe('User Entity', () => {
  it('should create a user', () => {
    const user = new User();
    user.firstName = 'John';
    user.lastName = 'Doe';
    user.age = 30;

    expect(user.firstName).toBe('John');
    expect(user.lastName).toBe('Doe');
    expect(user.age).toBe(30);
  });
});
