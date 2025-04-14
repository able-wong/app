import request from 'supertest';
import { app } from '../../../src/index';
import { AppDataSource } from '../../../src/appDataSource';
import { TeamMember } from '../../../src/entity/TeamMember';
import { Location } from '../../../src/entity/Location';
import { Customer } from '../../../src/entity/Customer';
import { generateToken } from '../../../src/utils/tokenUtils';
import { JwtUser } from '../../../src/types/JwtUser';

describe('Team Member Controller Integration Tests', () => {
  let authToken: string;
  let testCustomer: Customer;
  let testLocation: Location;
  const testUser: JwtUser = {
    id: '1',
    username: 'testuser',
  };

  // Arrays to track created objects for cleanup
  const createdTeamMembers: TeamMember[] = [];

  beforeAll(async () => {
    // Generate JWT token
    authToken = generateToken(testUser);

    // Create a test customer for team member tests
    const customerRepo = AppDataSource.getRepository(Customer);
    testCustomer = await customerRepo.save({ name: 'Test Customer' });

    // Create a test location for team member tests
    const locationRepo = AppDataSource.getRepository(Location);
    testLocation = await locationRepo.save({
      name: 'Test Location',
      address: '123 Test Street',
      customer: testCustomer,
    });
  });

  beforeEach(async () => {
    // Clear only the team members created in previous tests
    if (createdTeamMembers.length > 0) {
      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      for (const teamMember of createdTeamMembers) {
        await teamMemberRepo.delete(teamMember.id);
      }
      createdTeamMembers.length = 0; // Clear the array
    }
  });

  afterAll(async () => {
    // Clean up all created objects
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);
    for (const teamMember of createdTeamMembers) {
      await teamMemberRepo.delete(teamMember.id);
    }

    // Clean up location and customer
    const locationRepo = AppDataSource.getRepository(Location);
    await locationRepo.delete(testLocation.id);

    const customerRepo = AppDataSource.getRepository(Customer);
    await customerRepo.delete(testCustomer.id);
  });

  describe('GET /api/customers/:customerId/locations/:locationId/team-members', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get(
        `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members`,
      );
      expect(response.status).toBe(401);
    });

    it('should return 403 when invalid token is provided', async () => {
      const response = await request(app)
        .get(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members`,
        )
        .set('Authorization', 'Bearer invalid_token');
      expect(response.status).toBe(403);
    });

    it('should return 404 when location does not exist', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomer.id}/locations/999/team-members`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Location not found' });
    });

    it('should return empty array when no team members exist for this location', async () => {
      const response = await request(app)
        .get(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members`,
        )
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all team members when they exist', async () => {
      // Create test team members
      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      const teamMember1 = await teamMemberRepo.save({
        name: 'John Doe',
        location: testLocation,
      });
      createdTeamMembers.push(teamMember1);

      const teamMember2 = await teamMemberRepo.save({
        name: 'Jane Smith',
        location: testLocation,
      });
      createdTeamMembers.push(teamMember2);

      const response = await request(app)
        .get(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members`,
        )
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: teamMember1.id,
            name: 'John Doe',
          }),
          expect.objectContaining({
            id: teamMember2.id,
            name: 'Jane Smith',
          }),
        ]),
      );
    });
  });

  describe('GET /api/customers/:customerId/locations/:locationId/team-members/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get(
        `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members/1`,
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 when team member does not exist', async () => {
      const response = await request(app)
        .get(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members/999`,
        )
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Team Member not found' });
    });

    it('should return team member when it exists', async () => {
      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      const teamMember = await teamMemberRepo.save({
        name: 'John Doe',
        location: testLocation,
      });
      createdTeamMembers.push(teamMember);

      const response = await request(app)
        .get(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members/${teamMember.id}`,
        )
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: teamMember.id,
          name: 'John Doe',
        }),
      );
    });
  });

  describe('POST /api/customers/:customerId/locations/:locationId/team-members', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members`,
        )
        .send({
          name: 'New Team Member',
        });
      expect(response.status).toBe(401);
    });

    it('should return 400 when invalid data is provided', async () => {
      const response = await request(app)
        .post(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Invalid data' }),
      );
    });

    it('should create a new team member when valid data is provided', async () => {
      const response = await request(app)
        .post(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Team Member',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          name: 'New Team Member',
        }),
      );
      expect(response.body.id).toBeDefined();

      // Track the created team member for cleanup
      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      const createdTeamMember = await teamMemberRepo.findOne({
        where: { id: response.body.id, location: { id: testLocation.id } },
      });
      expect(createdTeamMember).not.toBeNull();
      expect(createdTeamMember).toEqual(
        expect.objectContaining({
          id: response.body.id,
          name: 'New Team Member',
        }),
      );

      if (createdTeamMember) {
        createdTeamMembers.push(createdTeamMember);
      }
    });
  });

  describe('PUT /api/customers/:customerId/locations/:locationId/team-members/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .put(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members/1`,
        )
        .send({
          name: 'Updated Team Member',
        });
      expect(response.status).toBe(401);
    });

    it('should return 404 when team member does not exist', async () => {
      const response = await request(app)
        .put(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members/999`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Team Member',
        });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Team Member not found' });
    });

    it('should return 400 when invalid data is provided', async () => {
      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      const teamMember = await teamMemberRepo.save({
        name: 'John Doe',
        location: testLocation,
      });
      createdTeamMembers.push(teamMember);

      const response = await request(app)
        .put(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members/${teamMember.id}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Invalid data' }),
      );
    });

    it('should update team member when valid data is provided', async () => {
      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      const teamMember = await teamMemberRepo.save({
        name: 'John Doe',
        location: testLocation,
      });
      createdTeamMembers.push(teamMember);

      const response = await request(app)
        .put(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members/${teamMember.id}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Team Member',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: teamMember.id,
          name: 'Updated Team Member',
        }),
      );

      // Verify team member was updated in the database
      const updatedTeamMember = await teamMemberRepo.findOne({
        where: { id: teamMember.id, location: { id: testLocation.id } },
      });
      expect(updatedTeamMember).not.toBeNull();
      expect(updatedTeamMember).toEqual(
        expect.objectContaining({
          id: teamMember.id,
          name: 'Updated Team Member',
        }),
      );
    });
  });

  describe('DELETE /api/customers/:customerId/locations/:locationId/team-members/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).delete(
        `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members/1`,
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 when team member does not exist', async () => {
      const response = await request(app)
        .delete(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members/999`,
        )
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Team Member not found' });
    });

    it('should delete team member when it exists', async () => {
      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      const teamMember = await teamMemberRepo.save({
        name: 'John Doe',
        location: testLocation,
      });
      // Don't add to createdTeamMembers since we're deleting it in this test

      const response = await request(app)
        .delete(
          `/api/customers/${testCustomer.id}/locations/${testLocation.id}/team-members/${teamMember.id}`,
        )
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          affected: 1,
        }),
      );

      // Verify team member is deleted from the database
      const deletedTeamMember = await teamMemberRepo.findOne({
        where: { id: teamMember.id, location: { id: testLocation.id } },
      });
      expect(deletedTeamMember).toBeNull();
    });
  });
});
