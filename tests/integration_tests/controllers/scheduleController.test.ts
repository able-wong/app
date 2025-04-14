import request from 'supertest';
import { app } from '../../../src/index';
import { AppDataSource } from '../../../src/appDataSource';
import { Customer } from '../../../src/entity/Customer';
import { Location } from '../../../src/entity/Location';
import { Service } from '../../../src/entity/Service';
import { User } from '../../../src/entity/User';
import { TeamMember } from '../../../src/entity/TeamMember';
import { Schedule } from '../../../src/entity/Schedule';
import { generateToken } from '../../../src/utils/tokenUtils';
import { JwtUser } from '../../../src/types/JwtUser';

describe('Schedule Controller Integration Tests', () => {
  let authToken: string;
  let testCustomer: Customer;
  let testLocation: Location;
  let testService: Service;
  let testUser: User;
  let testTeamMember: TeamMember;
  const jwtUser: JwtUser = {
    id: '1',
    username: 'testuser',
  };

  // Arrays to track created objects for cleanup
  const createdSchedules: Schedule[] = [];
  const createdServices: Service[] = [];
  const createdTeamMembers: TeamMember[] = [];
  const createdUsers: User[] = [];
  const createdLocations: Location[] = [];
  const createdCustomers: Customer[] = [];

  beforeAll(async () => {
    // Generate JWT token
    authToken = generateToken(jwtUser);

    // Create test customer and location for schedule tests
    const customerRepo = AppDataSource.getRepository(Customer);
    const locationRepo = AppDataSource.getRepository(Location);
    const serviceRepo = AppDataSource.getRepository(Service);
    const userRepo = AppDataSource.getRepository(User);
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);

    testCustomer = await customerRepo.save({ name: 'Test Customer' });
    createdCustomers.push(testCustomer);

    testLocation = await locationRepo.save({
      name: 'Test Location',
      address: '123 Test Street',
      customer: testCustomer,
    });
    createdLocations.push(testLocation);

    testService = await serviceRepo.save({
      name: 'Test Service',
      location: testLocation,
    });
    createdServices.push(testService);

    testUser = await userRepo.save({
      firstName: 'Test',
      lastName: 'User',
      age: 30,
      customer_id: testCustomer.id,
    });
    createdUsers.push(testUser);

    testTeamMember = await teamMemberRepo.save({
      name: 'Test Team Member',
      location: testLocation,
    });
    createdTeamMembers.push(testTeamMember);
  });

  afterAll(async () => {
    // Clean up only the objects created during the test
    const scheduleRepo = AppDataSource.getRepository(Schedule);
    const serviceRepo = AppDataSource.getRepository(Service);
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);
    const userRepo = AppDataSource.getRepository(User);
    const locationRepo = AppDataSource.getRepository(Location);
    const customerRepo = AppDataSource.getRepository(Customer);

    // Delete in reverse order to handle foreign key constraints
    for (const schedule of createdSchedules) {
      await scheduleRepo.delete(schedule.id);
    }

    for (const service of createdServices) {
      await serviceRepo.delete(service.id);
    }

    for (const teamMember of createdTeamMembers) {
      await teamMemberRepo.delete(teamMember.id);
    }

    for (const user of createdUsers) {
      await userRepo.delete(user.id);
    }

    for (const location of createdLocations) {
      await locationRepo.delete(location.id);
    }

    for (const customer of createdCustomers) {
      await customerRepo.delete(customer.id);
    }
  });

  describe('GET /api/customers/:customerId/locations/:locationId/schedules', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get(
        `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules`,
      );
      expect(response.status).toBe(401);
    });

    it('should return schedules for the specific customer and location', async () => {
      // Create test schedules
      const scheduleRepo = AppDataSource.getRepository(Schedule);
      const schedule1 = await scheduleRepo.save({
        date: '2023-01-01',
        time_period: '9:00-10:00',
        service: testService,
        user: testUser,
        teamMember: testTeamMember,
      });
      createdSchedules.push(schedule1);

      const schedule2 = await scheduleRepo.save({
        date: '2023-01-02',
        time_period: '10:00-11:00',
        service: testService,
        user: testUser,
        teamMember: testTeamMember,
      });
      createdSchedules.push(schedule2);

      const response = await request(app)
        .get(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules`,
        )
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Check that our created schedules are in the response
      const responseSchedules = response.body;
      expect(responseSchedules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: schedule1.id,
            date: '2023-01-01',
            time_period: '9:00-10:00',
          }),
          expect.objectContaining({
            id: schedule2.id,
            date: '2023-01-02',
            time_period: '10:00-11:00',
          }),
        ]),
      );
    });
  });

  describe('GET /api/customers/:customerId/locations/:locationId/schedules/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get(
        `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules/1`,
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 when schedule does not exist', async () => {
      const response = await request(app)
        .get(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules/999`,
        )
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Schedule not found' });
    });

    it('should return schedule when it exists', async () => {
      const scheduleRepo = AppDataSource.getRepository(Schedule);
      const schedule = await scheduleRepo.save({
        date: '2023-01-01',
        time_period: '9:00-10:00',
        service: testService,
        user: testUser,
        teamMember: testTeamMember,
      });
      createdSchedules.push(schedule);

      const response = await request(app)
        .get(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules/${schedule.id}`,
        )
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: schedule.id,
          date: '2023-01-01',
          time_period: '9:00-10:00',
        }),
      );
    });
  });

  describe('POST /api/customers/:customerId/locations/:locationId/schedules', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules`,
        )
        .send({
          date: '2023-01-01',
          time_period: '9:00-10:00',
          serviceId: testService.id,
          userId: testUser.id,
          teamMemberId: testTeamMember.id,
        });
      expect(response.status).toBe(401);
    });

    it('should return 400 when invalid data is provided', async () => {
      const response = await request(app)
        .post(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '',
          time_period: '',
          serviceId: testService.id,
          userId: testUser.id,
          teamMemberId: testTeamMember.id,
        }); // Invalid empty fields
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Invalid data' }),
      );
    });

    it('should create a new schedule when valid data is provided', async () => {
      const response = await request(app)
        .post(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2023-01-01',
          time_period: '9:00-10:00',
          serviceId: testService.id,
          userId: testUser.id,
          teamMemberId: testTeamMember.id,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          date: '2023-01-01',
          time_period: '9:00-10:00',
        }),
      );
      expect(response.body.id).toBeDefined();

      // Add the created schedule to our tracking array
      const scheduleRepo = AppDataSource.getRepository(Schedule);
      const createdSchedule = await scheduleRepo.findOneBy({
        id: response.body.id,
      });
      if (createdSchedule) {
        createdSchedules.push(createdSchedule);
      }

      // Verify schedule was created in the database
      expect(createdSchedule).not.toBeNull();
      expect(createdSchedule).toEqual(
        expect.objectContaining({
          id: response.body.id,
          date: '2023-01-01',
          time_period: '9:00-10:00',
        }),
      );
    });
  });

  describe('PUT /api/customers/:customerId/locations/:locationId/schedules/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .put(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules/1`,
        )
        .send({
          date: '2023-01-02',
          time_period: '10:00-11:00',
          serviceId: testService.id,
          userId: testUser.id,
          teamMemberId: testTeamMember.id,
        });
      expect(response.status).toBe(401);
    });

    it('should return 404 when schedule does not exist', async () => {
      const response = await request(app)
        .put(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules/999`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2023-01-02',
          time_period: '10:00-11:00',
          serviceId: testService.id,
          userId: testUser.id,
          teamMemberId: testTeamMember.id,
        });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Schedule not found' });
    });

    it('should return 400 when invalid data is provided', async () => {
      const scheduleRepo = AppDataSource.getRepository(Schedule);
      const schedule = await scheduleRepo.save({
        date: '2023-01-01',
        time_period: '9:00-10:00',
        service: testService,
        user: testUser,
        teamMember: testTeamMember,
      });
      createdSchedules.push(schedule);

      const response = await request(app)
        .put(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules/${schedule.id}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '',
          time_period: '',
          serviceId: testService.id,
          userId: testUser.id,
          teamMemberId: testTeamMember.id,
        }); // Invalid empty fields
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Invalid data' }),
      );
    });

    it('should update schedule when valid data is provided', async () => {
      const scheduleRepo = AppDataSource.getRepository(Schedule);
      const schedule = await scheduleRepo.save({
        date: '2023-01-01',
        time_period: '9:00-10:00',
        service: testService,
        user: testUser,
        teamMember: testTeamMember,
      });
      createdSchedules.push(schedule);

      const response = await request(app)
        .put(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules/${schedule.id}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2023-01-02',
          time_period: '10:00-11:00',
          serviceId: testService.id,
          userId: testUser.id,
          teamMemberId: testTeamMember.id,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: schedule.id,
          date: '2023-01-02',
          time_period: '10:00-11:00',
        }),
      );

      // Verify schedule was updated in the database
      const updatedSchedule = await scheduleRepo.findOneBy({ id: schedule.id });
      expect(updatedSchedule).not.toBeNull();
      expect(updatedSchedule).toEqual(
        expect.objectContaining({
          id: schedule.id,
          date: '2023-01-02',
          time_period: '10:00-11:00',
        }),
      );
    });
  });

  describe('DELETE /api/customers/:customerId/locations/:locationId/schedules/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).delete(
        `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules/1`,
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 when schedule does not exist', async () => {
      const response = await request(app)
        .delete(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules/999`,
        )
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Schedule not found' });
    });

    it('should delete schedule when it exists', async () => {
      const scheduleRepo = AppDataSource.getRepository(Schedule);
      const schedule = await scheduleRepo.save({
        date: '2023-01-01',
        time_period: '9:00-10:00',
        service: testService,
        user: testUser,
        teamMember: testTeamMember,
      });
      // We don't add this to createdSchedules since we're deleting it

      const response = await request(app)
        .delete(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/schedules/${schedule.id}`,
        )
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          affected: 1,
        }),
      );

      // Verify schedule is deleted from the database
      const deletedSchedule = await scheduleRepo.findOneBy({ id: schedule.id });
      expect(deletedSchedule).toBeNull();
    });
  });
});
