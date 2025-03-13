import { Request, Response } from 'express';
import {
  getTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getTeamMemberRecord,
} from '../../../src/controllers/teamMemberController';
import { AppDataSource } from '../../../src/appDataSource';
import { TeamMember } from '../../../src/entity/TeamMember';
import { getLocationRecord } from '../../../src/controllers/locationController';

jest.mock('../../../src/appDataSource');
jest.mock('../../../src/controllers/locationController');

const mockRequest = (params = {}, body = {}) =>
  ({
    params,
    body,
  } as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('TeamMember Controller', () => {
  let teamMemberRepository: jest.Mocked<
    ReturnType<typeof AppDataSource.getRepository>
  >;

  beforeAll(() => {
    teamMemberRepository = {} as jest.Mocked<
      ReturnType<typeof AppDataSource.getRepository>
    >;
    teamMemberRepository.find = jest.fn();
    teamMemberRepository.findOneBy = jest.fn();
    teamMemberRepository.findOne = jest.fn();
    teamMemberRepository.create = jest.fn();
    teamMemberRepository.save = jest.fn();
    teamMemberRepository.merge = jest.fn((entity, dto) => {
      Object.assign(entity, dto); // Simulate the merge behavior
      return entity;
    });
    teamMemberRepository.delete = jest.fn();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(
      teamMemberRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getTeamMembers should return all team members', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1' });
    const res = mockResponse();
    const teamMembers = [{ id: 1, name: 'John Doe' }];
    teamMemberRepository.find.mockResolvedValue(teamMembers);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await getTeamMembers(req, res);

    expect(teamMemberRepository.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(teamMembers);
  });

  test('getTeamMembers should return 404 if location not found', async () => {
    const req = mockRequest({ customerId: '1', locationId: '999' });
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await getTeamMembers(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  test('getTeamMember should return a team member by id', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '1' });
    const res = mockResponse();
    const teamMember = { id: 1, name: 'John Doe' };
    teamMemberRepository.findOne.mockResolvedValue(teamMember);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await getTeamMember(req, res);

    expect(teamMemberRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, location: { id: 1 } },
    });
    expect(res.json).toHaveBeenCalledWith(teamMember);
  });

  test('getTeamMember should return 404 if team member not found', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '999' });
    const res = mockResponse();
    teamMemberRepository.findOne.mockResolvedValue(null);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await getTeamMember(req, res);

    expect(teamMemberRepository.findOne).toHaveBeenCalledWith({
      where: { id: 999, location: { id: 1 } },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Team Member not found' });
  });

  test('getTeamMember should return 404 if location not found', async () => {
    const req = mockRequest({ customerId: '1', locationId: '999', id: '1' });
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await getTeamMember(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  test('createTeamMember should create a new team member', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1' },
      { name: 'John Doe' },
    );
    const res = mockResponse();
    const newTeamMember = {
      id: 1,
      name: 'John Doe',
    } as TeamMember;
    teamMemberRepository.create.mockReturnValue(newTeamMember);
    teamMemberRepository.save.mockResolvedValue(newTeamMember);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await createTeamMember(req, res);

    expect(teamMemberRepository.save).toHaveBeenCalledWith({
      name: 'John Doe',
      location: { id: 1 } as unknown as Location,
    } as unknown as TeamMember);
    expect(res.json).toHaveBeenCalledWith(newTeamMember);
  });

  test('createTeamMember should return 400 if data is invalid', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1' },
      { created_at: 'invalid data !!' },
    ); // Invalid data
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await createTeamMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('createTeamMember should return 404 if location not found', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '999' },
      { name: 'John Doe' },
    );
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await createTeamMember(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  test('updateTeamMember should update an existing team member', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1', id: '1' },
      { name: 'Jane Doe' },
    );
    const res = mockResponse();
    const teamMember = new TeamMember();
    teamMember.id = 1;
    teamMember.name = 'John Doe';
    teamMemberRepository.findOne.mockResolvedValue(teamMember);
    teamMemberRepository.save.mockResolvedValue({ ...teamMember, ...req.body });
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await updateTeamMember(req, res);

    expect(teamMemberRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, location: { id: 1 } },
    });
    expect(teamMemberRepository.merge).toHaveBeenCalledWith(
      teamMember,
      req.body,
    );
    expect(teamMemberRepository.save).toHaveBeenCalledWith(teamMember);
    expect(res.json).toHaveBeenCalledWith({ ...teamMember, ...req.body });
  });

  test('updateTeamMember should return 400 if data is invalid', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1', id: '1' },
      { name: '' },
    ); // Invalid data
    const res = mockResponse();
    const teamMember = { id: 1, name: 'John Doe' };
    teamMemberRepository.findOne.mockResolvedValue(teamMember);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await updateTeamMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('updateTeamMember should return 404 if team member not found', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1', id: '999' },
      { name: 'Jane Doe' },
    );
    const res = mockResponse();
    teamMemberRepository.findOne.mockResolvedValue(null);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await updateTeamMember(req, res);

    expect(teamMemberRepository.findOne).toHaveBeenCalledWith({
      where: { id: 999, location: { id: 1 } },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Team Member not found' });
  });

  test('updateTeamMember should return 404 if location not found', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '999', id: '1' },
      { name: 'Jane Doe' },
    );
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await updateTeamMember(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  test('deleteTeamMember should delete a team member by id', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '1' });
    const res = mockResponse();
    const deleteResult = { affected: 1, raw: {} };
    teamMemberRepository.findOne.mockResolvedValue({
      customerId: 1,
      id: 1,
    } as unknown as TeamMember);
    teamMemberRepository.delete.mockResolvedValue(deleteResult);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await deleteTeamMember(req, res);

    expect(teamMemberRepository.delete).toHaveBeenCalledWith(req.params.id);
    expect(res.json).toHaveBeenCalledWith(deleteResult);
  });

  test('deleteTeamMember should return 404 if location not found', async () => {
    const req = mockRequest({ customerId: '1', locationId: '999', id: '1' });
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await deleteTeamMember(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  test('deleteTeamMember should return 404 if team member not found', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '999' });
    const res = mockResponse();
    teamMemberRepository.findOne.mockResolvedValue(null);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await deleteTeamMember(req, res);

    expect(teamMemberRepository.findOne).toHaveBeenCalledWith({
      where: { id: 999, location: { id: 1 } },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Team Member not found' });
  });
});

describe('getTeamMemberRecord', () => {
  let teamMemberRepository: jest.Mocked<
    ReturnType<typeof AppDataSource.getRepository>
  >;

  beforeAll(() => {
    teamMemberRepository = {} as jest.Mocked<
      ReturnType<typeof AppDataSource.getRepository>
    >;
    teamMemberRepository.findOne = jest.fn();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(
      teamMemberRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return a team member record by id', async () => {
    const teamMember = { id: 1, name: 'John Doe' };
    teamMemberRepository.findOne.mockResolvedValue(teamMember);

    const result = await getTeamMemberRecord(1, 1, 1);

    expect(teamMemberRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 1,
        location: { id: 1, customer: { id: 1 } },
      },
    });
    expect(result).toEqual(teamMember);
  });

  test('should return null if team member record not found', async () => {
    teamMemberRepository.findOne.mockResolvedValue(null);

    const result = await getTeamMemberRecord(1, 1, 999);

    expect(teamMemberRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 999,
        location: { id: 1, customer: { id: 1 } },
      },
    });
    expect(result).toBeNull();
  });
});
