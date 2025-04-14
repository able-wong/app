import request from 'supertest';
import { app } from '../../../src/index';
import { AppDataSource } from '../../../src/appDataSource';
import { Location } from '../../../src/entity/Location';
import { Customer } from '../../../src/entity/Customer';
import { generateToken } from '../../../src/utils/tokenUtils';
import { JwtUser } from '../../../src/types/JwtUser';

describe('Location Controller Integration Tests', () => {
  let authToken: string;
  let testCustomer: Customer;
  const testUser: JwtUser = {
    id: '1',
    username: 'testuser',
  };

  // Track created objects for cleanup
  const createdLocations: Location[] = [];
  const createdCustomers: Customer[] = [];

  beforeAll(async () => {
    // Generate JWT token
    authToken = generateToken(testUser);

    // Create a test customer for location tests
    const customerRepo = AppDataSource.getRepository(Customer);
    testCustomer = await customerRepo.save({ name: 'Test Customer' });
    createdCustomers.push(testCustomer);
  });

  afterAll(async () => {
    // Clean up only the objects created during tests
    const locationRepo = AppDataSource.getRepository(Location);
    const customerRepo = AppDataSource.getRepository(Customer);

    // Delete locations first due to foreign key constraints
    for (const location of createdLocations) {
      await locationRepo.delete(location.id);
    }

    // Delete customers
    for (const customer of createdCustomers) {
      await customerRepo.delete(customer.id);
    }
  });

  describe('GET /api/customers/:customerId/locations', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get(
        `/api/customers/${testCustomer.id}/locations`,
      );
      expect(response.status).toBe(401);
    });

    it('should return 403 when invalid token is provided', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomer.id}/locations`)
        .set('Authorization', 'Bearer invalid_token');
      expect(response.status).toBe(403);
    });

    it('should return 404 when customer does not exist', async () => {
      const response = await request(app)
        .get('/api/customers/999/locations')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Customer not found' });
    });

    it('should return locations for the customer when they exist', async () => {
      // Create test locations
      const locationRepo = AppDataSource.getRepository(Location);
      const location1 = await locationRepo.save({
        name: 'Test Location 1',
        address: '123 Main St',
        customer: testCustomer,
      });
      createdLocations.push(location1);

      const location2 = await locationRepo.save({
        name: 'Test Location 2',
        address: '456 Oak Ave',
        customer: testCustomer,
      });
      createdLocations.push(location2);

      const response = await request(app)
        .get(`/api/customers/${testCustomer.id}/locations`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: location1.id,
            name: 'Test Location 1',
            address: '123 Main St',
          }),
          expect.objectContaining({
            id: location2.id,
            name: 'Test Location 2',
            address: '456 Oak Ave',
          }),
        ]),
      );
    });
  });

  describe('GET /api/customers/:customerId/locations/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get(
        `/api/customers/${testCustomer.id}/locations/1`,
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 when customer does not exist', async () => {
      const response = await request(app)
        .get('/api/customers/999/locations/1')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Customer not found' });
    });

    it('should return 404 when location does not exist', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomer.id}/locations/999`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Location not found' });
    });

    it('should return location when it exists', async () => {
      const locationRepo = AppDataSource.getRepository(Location);
      const location = await locationRepo.save({
        name: 'Test Location',
        address: '123 Main St',
        customer: testCustomer,
      });
      createdLocations.push(location);

      const response = await request(app)
        .get(`/api/customers/${testCustomer.id}/locations/${location.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: location.id,
          name: 'Test Location',
          address: '123 Main St',
        }),
      );
    });
  });

  describe('POST /api/customers/:customerId/locations', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post(`/api/customers/${testCustomer.id}/locations`)
        .send({ name: 'New Location', address: '789 Pine St' });
      expect(response.status).toBe(401);
    });

    it('should return 404 when customer does not exist', async () => {
      const response = await request(app)
        .post('/api/customers/999/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Location', address: '789 Pine St' });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Customer not found' });
    });

    it('should return 400 when invalid data is provided', async () => {
      const response = await request(app)
        .post(`/api/customers/${testCustomer.id}/locations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '', address: '789 Pine St' }); // Invalid empty name
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Invalid data' }),
      );
    });

    it('should create a new location when valid data is provided', async () => {
      const response = await request(app)
        .post(`/api/customers/${testCustomer.id}/locations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Location', address: '789 Pine St' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          name: 'New Location',
          address: '789 Pine St',
        }),
      );
      expect(response.body.id).toBeDefined();

      // Track the created location for cleanup
      const locationRepo = AppDataSource.getRepository(Location);
      const createdLocation = await locationRepo.findOne({
        where: { id: response.body.id, customer: { id: testCustomer.id } },
      });
      expect(createdLocation).not.toBeNull();
      if (createdLocation) {
        createdLocations.push(createdLocation);
      }

      expect(createdLocation).toEqual(
        expect.objectContaining({
          id: response.body.id,
          name: 'New Location',
          address: '789 Pine St',
        }),
      );
    });
  });

  describe('PUT /api/customers/:customerId/locations/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .put(`/api/customers/${testCustomer.id}/locations/1`)
        .send({ name: 'Updated Location', address: 'Updated Address' });
      expect(response.status).toBe(401);
    });

    it('should return 404 when customer does not exist', async () => {
      const response = await request(app)
        .put('/api/customers/999/locations/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Location', address: 'Updated Address' });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Customer not found' });
    });

    it('should return 404 when location does not exist', async () => {
      const response = await request(app)
        .put(`/api/customers/${testCustomer.id}/locations/999`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Location', address: 'Updated Address' });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Location not found' });
    });

    it('should return 400 when invalid data is provided', async () => {
      const locationRepo = AppDataSource.getRepository(Location);
      const location = await locationRepo.save({
        name: 'Test Location',
        address: '123 Main St',
        customer: testCustomer,
      });
      createdLocations.push(location);

      const response = await request(app)
        .put(`/api/customers/${testCustomer.id}/locations/${location.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '', address: 'Updated Address' }); // Invalid empty name
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Invalid data' }),
      );
    });

    it('should update location when valid data is provided', async () => {
      const locationRepo = AppDataSource.getRepository(Location);
      const location = await locationRepo.save({
        name: 'Test Location',
        address: '123 Main St',
        customer: testCustomer,
      });
      createdLocations.push(location);

      const response = await request(app)
        .put(`/api/customers/${testCustomer.id}/locations/${location.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Location', address: 'Updated Address' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: location.id,
          name: 'Updated Location',
          address: 'Updated Address',
        }),
      );

      // Verify location was updated in the database
      const updatedLocation = await locationRepo.findOne({
        where: { id: location.id, customer: { id: testCustomer.id } },
      });
      expect(updatedLocation).not.toBeNull();
      expect(updatedLocation).toEqual(
        expect.objectContaining({
          id: location.id,
          name: 'Updated Location',
          address: 'Updated Address',
        }),
      );
    });
  });

  describe('DELETE /api/customers/:customerId/locations/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).delete(
        `/api/customers/${testCustomer.id}/locations/1`,
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 when customer does not exist', async () => {
      const response = await request(app)
        .delete('/api/customers/999/locations/1')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Customer not found' });
    });

    it('should return 404 when location does not exist', async () => {
      const response = await request(app)
        .delete(`/api/customers/${testCustomer.id}/locations/999`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Location not found' });
    });

    it('should delete location when it exists', async () => {
      const locationRepo = AppDataSource.getRepository(Location);
      const location = await locationRepo.save({
        name: 'Test Location',
        address: '123 Main St',
        customer: testCustomer,
      });
      // Don't add to createdLocations since we're deleting it

      const response = await request(app)
        .delete(`/api/customers/${testCustomer.id}/locations/${location.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          affected: 1,
        }),
      );

      // Verify location is deleted from the database
      const deletedLocation = await locationRepo.findOne({
        where: { id: location.id, customer: { id: testCustomer.id } },
      });
      expect(deletedLocation).toBeNull();
    });
  });
});
