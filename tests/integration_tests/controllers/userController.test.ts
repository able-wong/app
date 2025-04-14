import request from 'supertest';
import { app } from '../../../src/index';
import { AppDataSource } from '../../../src/appDataSource';
import { User } from '../../../src/entity/User';
import { Customer } from '../../../src/entity/Customer';
import { generateToken } from '../../../src/utils/tokenUtils';
import { JwtUser } from '../../../src/types/JwtUser';

describe('User Controller Integration Tests', () => {
  let authToken: string;
  let testCustomer: Customer;
  const testUser: JwtUser = {
    id: '1',
    username: 'testuser',
  };

  // Arrays to track created entities
  const createdUsers: User[] = [];
  const createdCustomers: Customer[] = [];

  beforeAll(async () => {
    // Generate JWT token
    authToken = generateToken(testUser);

    // Create a test customer for user tests
    const customerRepo = AppDataSource.getRepository(Customer);
    testCustomer = await customerRepo.save({ name: 'Test Customer' });
    createdCustomers.push(testCustomer);
  });

  afterAll(async () => {
    // Clean up only the entities created during tests
    const userRepo = AppDataSource.getRepository(User);
    const customerRepo = AppDataSource.getRepository(Customer);

    // Delete users first (due to foreign key constraints)
    for (const user of createdUsers) {
      await userRepo.delete(user.id);
    }

    // Then delete customers
    for (const customer of createdCustomers) {
      await customerRepo.delete(customer.id);
    }
  });

  describe('GET /api/customers/:customerId/users', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get(
        `/api/customers/${testCustomer.id}/users`,
      );
      expect(response.status).toBe(401);
    });

    it('should return 403 when invalid token is provided', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomer.id}/users`)
        .set('Authorization', 'Bearer invalid_token');
      expect(response.status).toBe(403);
    });

    it('should return 404 when customer does not exist', async () => {
      const response = await request(app)
        .get('/api/customers/999/users')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Customer not found' });
    });

    it('should return users for the specific customer', async () => {
      // Create test users
      const userRepo = AppDataSource.getRepository(User);
      const user1 = await userRepo.save({
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        customer_id: testCustomer.id,
      });
      createdUsers.push(user1);

      const user2 = await userRepo.save({
        firstName: 'Jane',
        lastName: 'Smith',
        age: 25,
        customer_id: testCustomer.id,
      });
      createdUsers.push(user2);

      const response = await request(app)
        .get(`/api/customers/${testCustomer.id}/users`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: user1.id,
            firstName: 'John',
            lastName: 'Doe',
            age: 30,
          }),
          expect.objectContaining({
            id: user2.id,
            firstName: 'Jane',
            lastName: 'Smith',
            age: 25,
          }),
        ]),
      );
    });
  });

  describe('GET /api/customers/:customerId/users/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get(
        `/api/customers/${testCustomer.id}/users/1`,
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomer.id}/users/999`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'User not found' });
    });

    it('should return user when it exists', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.save({
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        customer_id: testCustomer.id,
      });
      createdUsers.push(user);

      const response = await request(app)
        .get(`/api/customers/${testCustomer.id}/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: user.id,
          firstName: 'John',
          lastName: 'Doe',
          age: 30,
        }),
      );
    });
  });

  describe('POST /api/customers/:customerId/users', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post(`/api/customers/${testCustomer.id}/users`)
        .send({
          firstName: 'New',
          lastName: 'User',
          age: 25,
        });
      expect(response.status).toBe(401);
    });

    it('should return 400 when invalid data is provided', async () => {
      const response = await request(app)
        .post(`/api/customers/${testCustomer.id}/users`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: '',
          lastName: '',
          age: 'invalid',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Invalid data' }),
      );
    });

    it('should create a new user when valid data is provided', async () => {
      const response = await request(app)
        .post(`/api/customers/${testCustomer.id}/users`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'New',
          lastName: 'User',
          age: 25,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          firstName: 'New',
          lastName: 'User',
          age: 25,
        }),
      );
      expect(response.body.id).toBeDefined();

      // Track the created user for cleanup
      const userRepo = AppDataSource.getRepository(User);
      const createdUser = await userRepo.findOne({
        where: { id: response.body.id, customer_id: testCustomer.id },
      });
      if (createdUser) {
        createdUsers.push(createdUser);
      }

      expect(createdUser).not.toBeNull();
      expect(createdUser).toEqual(
        expect.objectContaining({
          id: response.body.id,
          firstName: 'New',
          lastName: 'User',
          age: 25,
        }),
      );
    });
  });

  describe('PUT /api/customers/:customerId/users/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .put(`/api/customers/${testCustomer.id}/users/1`)
        .send({
          firstName: 'Updated',
          lastName: 'User',
          age: 26,
        });
      expect(response.status).toBe(401);
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app)
        .put(`/api/customers/${testCustomer.id}/users/999`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'User',
          age: 26,
        });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'User not found' });
    });

    it('should return 400 when invalid data is provided', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.save({
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        customer_id: testCustomer.id,
      });
      createdUsers.push(user);

      const response = await request(app)
        .put(`/api/customers/${testCustomer.id}/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: '',
          lastName: '',
          age: 'invalid',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Invalid data' }),
      );
    });

    it('should update user when valid data is provided', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.save({
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        customer_id: testCustomer.id,
      });
      createdUsers.push(user);

      const response = await request(app)
        .put(`/api/customers/${testCustomer.id}/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'User',
          age: 26,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: user.id,
          firstName: 'Updated',
          lastName: 'User',
          age: 26,
        }),
      );

      // Verify user was updated in the database
      const updatedUser = await userRepo.findOne({
        where: { id: user.id, customer_id: testCustomer.id },
      });
      expect(updatedUser).not.toBeNull();
      expect(updatedUser).toEqual(
        expect.objectContaining({
          id: user.id,
          firstName: 'Updated',
          lastName: 'User',
          age: 26,
        }),
      );
    });
  });

  describe('DELETE /api/customers/:customerId/users/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).delete(
        `/api/customers/${testCustomer.id}/users/1`,
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app)
        .delete(`/api/customers/${testCustomer.id}/users/999`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'User not found' });
    });

    it('should delete user when it exists', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.save({
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        customer_id: testCustomer.id,
      });
      // Don't add to createdUsers since we're deleting it in this test

      const response = await request(app)
        .delete(`/api/customers/${testCustomer.id}/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          affected: 1,
        }),
      );

      // Verify user is deleted from the database
      const deletedUser = await userRepo.findOne({
        where: { id: user.id, customer_id: testCustomer.id },
      });
      expect(deletedUser).toBeNull();
    });
  });
});
