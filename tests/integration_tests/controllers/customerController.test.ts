import request from 'supertest';
import { app } from '../../../src/index';
import { AppDataSource } from '../../../src/appDataSource';
import { Customer } from '../../../src/entity/Customer';
import { generateToken } from '../../../src/utils/tokenUtils';
import { JwtUser } from '../../../src/types/JwtUser';

describe('Customer Controller Integration Tests', () => {
  let authToken: string;
  const testUser: JwtUser = {
    id: '1',
    username: 'testuser',
  };

  // Track created objects for cleanup
  const createdCustomers: number[] = [];

  beforeAll(async () => {
    // Generate JWT token
    authToken = generateToken(testUser);
  });

  afterEach(async () => {
    // Clean up only the objects created during tests
    if (createdCustomers.length > 0) {
      // Use a more appropriate approach for deletion
      const customerRepo = AppDataSource.getRepository(Customer);
      for (const id of createdCustomers) {
        await customerRepo.delete({ id });
      }
      createdCustomers.length = 0; // Clear the array
    }
  });

  // Helper function to track created customers
  const trackCustomer = (customer: Customer) => {
    createdCustomers.push(customer.id);
    return customer;
  };

  describe('GET /api/customers', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get('/api/customers');
      expect(response.status).toBe(401);
    });

    it('should return 403 when invalid token is provided', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', 'Bearer invalid_token');
      expect(response.status).toBe(403);
    });

    it('should return all customers when they exist', async () => {
      // Get initial count of customers
      const customerRepo = AppDataSource.getRepository(Customer);
      const initialCount = await customerRepo.count();

      // Create test customers
      const customer1 = trackCustomer(
        await customerRepo.save({ name: 'Test Customer 1' }),
      );
      const customer2 = trackCustomer(
        await customerRepo.save({ name: 'Test Customer 2' }),
      );

      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(initialCount + 2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: customer1.id,
            name: 'Test Customer 1',
          }),
          expect.objectContaining({
            id: customer2.id,
            name: 'Test Customer 2',
          }),
        ]),
      );
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get('/api/customers/1');
      expect(response.status).toBe(401);
    });

    it('should return 404 when customer does not exist', async () => {
      const response = await request(app)
        .get('/api/customers/999')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Customer not found' });
    });

    it('should return customer when it exists', async () => {
      const customerRepo = AppDataSource.getRepository(Customer);
      const customer = trackCustomer(
        await customerRepo.save({ name: 'Test Customer' }),
      );

      const response = await request(app)
        .get(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: customer.id,
          name: 'Test Customer',
        }),
      );
    });
  });

  describe('POST /api/customers', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({ name: 'New Customer' });
      expect(response.status).toBe(401);
    });

    it('should return 400 when invalid data is provided', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' }); // Invalid empty name
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Invalid data' }),
      );
    });

    it('should create a new customer when valid data is provided', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Customer' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          name: 'New Customer',
        }),
      );
      expect(response.body.id).toBeDefined();

      // Track the created customer for cleanup
      createdCustomers.push(Number(response.body.id));

      // Verify customer was created in the database
      const customerRepo = AppDataSource.getRepository(Customer);
      const createdCustomer = await customerRepo.findOneBy({
        id: response.body.id,
      });
      expect(createdCustomer).not.toBeNull();
      expect(createdCustomer).toEqual(
        expect.objectContaining({
          id: response.body.id,
          name: 'New Customer',
        }),
      );
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .put('/api/customers/1')
        .send({ name: 'Updated Customer' });
      expect(response.status).toBe(401);
    });

    it('should return 404 when customer does not exist', async () => {
      const response = await request(app)
        .put('/api/customers/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Customer' });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Customer not found' });
    });

    it('should return 400 when invalid data is provided', async () => {
      const customerRepo = AppDataSource.getRepository(Customer);
      const customer = trackCustomer(
        await customerRepo.save({ name: 'Test Customer' }),
      );

      const response = await request(app)
        .put(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' }); // Invalid empty name
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Invalid data' }),
      );
    });

    it('should update customer when valid data is provided', async () => {
      const customerRepo = AppDataSource.getRepository(Customer);
      const customer = trackCustomer(
        await customerRepo.save({ name: 'Test Customer' }),
      );

      const response = await request(app)
        .put(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Customer' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: customer.id,
          name: 'Updated Customer',
        }),
      );

      // Verify customer was updated in the database
      const updatedCustomer = await customerRepo.findOneBy({ id: customer.id });
      expect(updatedCustomer).not.toBeNull();
      expect(updatedCustomer).toEqual(
        expect.objectContaining({
          id: customer.id,
          name: 'Updated Customer',
        }),
      );
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).delete('/api/customers/1');
      expect(response.status).toBe(401);
    });

    it('should return 404 when customer does not exist', async () => {
      const response = await request(app)
        .delete('/api/customers/999')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Customer not found' });
    });

    it('should delete customer when it exists', async () => {
      const customerRepo = AppDataSource.getRepository(Customer);
      const customer = trackCustomer(
        await customerRepo.save({ name: 'Test Customer' }),
      );

      const response = await request(app)
        .delete(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          affected: 1,
        }),
      );

      // Verify customer is deleted from the database
      const deletedCustomer = await customerRepo.findOneBy({ id: customer.id });
      expect(deletedCustomer).toBeNull();

      // Remove from tracking since it's already deleted
      const index = createdCustomers.indexOf(customer.id);
      if (index > -1) {
        createdCustomers.splice(index, 1);
      }
    });
  });
});
