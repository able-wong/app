import request from 'supertest';
import { app } from '../../../src/index';
import { AppDataSource } from '../../../src/appDataSource';
import { Customer } from '../../../src/entity/Customer';
import { Location } from '../../../src/entity/Location';
import { Service } from '../../../src/entity/Service';
import { generateToken } from '../../../src/utils/tokenUtils';
import { JwtUser } from '../../../src/types/JwtUser';

describe('Service Controller Integration Tests', () => {
  let authToken: string;
  let testCustomer: Customer;
  let testLocation: Location;
  let createdServices: Service[] = [];
  const testUser: JwtUser = {
    id: '1',
    username: 'testuser',
  };

  beforeAll(async () => {
    // Generate JWT token
    authToken = generateToken(testUser);

    // Create test customer and location for service tests
    const customerRepo = AppDataSource.getRepository(Customer);
    const locationRepo = AppDataSource.getRepository(Location);

    testCustomer = await customerRepo.save({ name: 'Test Customer' });
    testLocation = await locationRepo.save({
      name: 'Test Location',
      address: '123 Test Street',
      customer: testCustomer,
    });
  });

  afterAll(async () => {
    // Clean up only the objects created during these tests
    const serviceRepo = AppDataSource.getRepository(Service);
    for (const service of createdServices) {
      await serviceRepo.delete(service.id);
    }

    // Clean up test location and customer
    const locationRepo = AppDataSource.getRepository(Location);
    const customerRepo = AppDataSource.getRepository(Customer);
    await locationRepo.delete(testLocation.id);
    await customerRepo.delete(testCustomer.id);
  });

  describe('GET /api/customers/:customerId/locations/:locationId/services', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get(
        `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services`,
      );
      expect(response.status).toBe(401);
    });

    it('should return services for the specific location', async () => {
      // Create test services
      const serviceRepo = AppDataSource.getRepository(Service);
      const service1 = await serviceRepo.save({
        name: 'Test Service 1',
        location: testLocation,
      });
      createdServices.push(service1);

      const service2 = await serviceRepo.save({
        name: 'Test Service 2',
        location: testLocation,
      });
      createdServices.push(service2);

      const response = await request(app)
        .get(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services`,
        )
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: service1.id,
            name: 'Test Service 1',
          }),
          expect.objectContaining({
            id: service2.id,
            name: 'Test Service 2',
          }),
        ]),
      );
    });
  });

  describe('GET /api/customers/:customerId/locations/:locationId/services/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get(
        `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services/1`,
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 when service does not exist', async () => {
      const response = await request(app)
        .get(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services/999`,
        )
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Service not found' });
    });

    it('should return service when it exists', async () => {
      const serviceRepo = AppDataSource.getRepository(Service);
      const service = await serviceRepo.save({
        name: 'Test Service',
        location: testLocation,
      });
      createdServices.push(service);

      const response = await request(app)
        .get(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services/${service.id}`,
        )
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: service.id,
          name: 'Test Service',
        }),
      );
    });
  });

  describe('POST /api/customers/:customerId/locations/:locationId/services', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services`,
        )
        .send({ name: 'New Service' });
      expect(response.status).toBe(401);
    });

    it('should return 400 when invalid data is provided', async () => {
      const response = await request(app)
        .post(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' }); // Invalid empty name
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Invalid data' }),
      );
    });

    it('should create a new service when valid data is provided', async () => {
      const response = await request(app)
        .post(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Service' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          name: 'New Service',
        }),
      );
      expect(response.body.id).toBeDefined();

      // Track the created service for cleanup
      const serviceRepo = AppDataSource.getRepository(Service);
      const createdService = await serviceRepo.findOneBy({
        id: response.body.id,
      });
      if (createdService) {
        createdServices.push(createdService);
      }

      // Verify service was created in the database
      expect(createdService).not.toBeNull();
      expect(createdService).toEqual(
        expect.objectContaining({
          id: response.body.id,
          name: 'New Service',
        }),
      );
    });
  });

  describe('PUT /api/customers/:customerId/locations/:locationId/services/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .put(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services/1`,
        )
        .send({ name: 'Updated Service' });
      expect(response.status).toBe(401);
    });

    it('should return 404 when service does not exist', async () => {
      const response = await request(app)
        .put(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services/999`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Service' });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Service not found' });
    });

    it('should return 400 when invalid data is provided', async () => {
      const serviceRepo = AppDataSource.getRepository(Service);
      const service = await serviceRepo.save({
        name: 'Test Service',
        location: testLocation,
      });
      createdServices.push(service);

      const response = await request(app)
        .put(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services/${service.id}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' }); // Invalid empty name
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Invalid data' }),
      );
    });

    it('should update service when valid data is provided', async () => {
      const serviceRepo = AppDataSource.getRepository(Service);
      const service = await serviceRepo.save({
        name: 'Test Service',
        location: testLocation,
      });
      createdServices.push(service);

      const response = await request(app)
        .put(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services/${service.id}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Service' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: service.id,
          name: 'Updated Service',
        }),
      );

      // Verify service was updated in the database
      const updatedService = await serviceRepo.findOneBy({ id: service.id });
      expect(updatedService).not.toBeNull();
      expect(updatedService).toEqual(
        expect.objectContaining({
          id: service.id,
          name: 'Updated Service',
        }),
      );
    });
  });

  describe('DELETE /api/customers/:customerId/locations/:locationId/services/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).delete(
        `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services/1`,
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 when service does not exist', async () => {
      const response = await request(app)
        .delete(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services/999`,
        )
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Service not found' });
    });

    it('should delete service when it exists', async () => {
      const serviceRepo = AppDataSource.getRepository(Service);
      const service = await serviceRepo.save({
        name: 'Test Service',
        location: testLocation,
      });
      createdServices.push(service);

      const response = await request(app)
        .delete(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/services/${service.id}`,
        )
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          affected: 1,
        }),
      );

      // Remove the service from our tracking list since it's been deleted
      createdServices = createdServices.filter((s) => s.id !== service.id);

      // Verify service is deleted from the database
      const deletedService = await serviceRepo.findOneBy({ id: service.id });
      expect(deletedService).toBeNull();
    });
  });
});
