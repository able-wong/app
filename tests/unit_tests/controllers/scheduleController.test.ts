import { Request, Response } from 'express';
import {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../../../src/controllers/scheduleController';
import { AppDataSource } from '../../../src/appDataSource';
import { getLocationRecord } from '../../../src/controllers/locationController';
import { getServiceRecord } from '../../../src/controllers/serviceController';
import { getTeamMemberRecord } from '../../../src/controllers/teamMemberController';
import { getUserRecord } from '../../../src/controllers/userController';
import { Service } from '../../../src/entity/Service';
import { Schedule } from '../../../src/entity/Schedule';
import { User } from '../../../src/entity/User';
import { TeamMember } from '../../../src/entity/TeamMember';

jest.mock('../../../src/appDataSource');
jest.mock('../../../src/controllers/locationController');
jest.mock('../../../src/controllers/serviceController');
jest.mock('../../../src/controllers/teamMemberController');
jest.mock('../../../src/controllers/userController');

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

describe('Schedule Controller', () => {
  let scheduleRepository: jest.Mocked<
    ReturnType<typeof AppDataSource.getRepository>
  >;

  beforeAll(() => {
    scheduleRepository = {} as jest.Mocked<
      ReturnType<typeof AppDataSource.getRepository>
    >;
    scheduleRepository.find = jest.fn();
    scheduleRepository.findOne = jest.fn();
    scheduleRepository.findOneBy = jest.fn();
    scheduleRepository.create = jest.fn();
    scheduleRepository.save = jest.fn();
    scheduleRepository.merge = jest.fn((entity, dto) => {
      Object.assign(entity, dto); // Simulate the merge behavior
      return entity;
    });
    scheduleRepository.delete = jest.fn();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(
      scheduleRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getSchedules should return all schedules', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1' });
    const res = mockResponse();
    const schedules = [{ id: 1, name: 'Schedule 1' }];
    scheduleRepository.find.mockResolvedValue(schedules);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await getSchedules(req, res);

    expect(scheduleRepository.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(schedules);
  });

  test('getSchedules should return 404 if location not found', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1' });
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await getSchedules(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  test('getSchedule should return a schedule by id', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '1' });
    const res = mockResponse();
    const schedule = { id: 1, name: 'Schedule 1' };
    scheduleRepository.findOne.mockResolvedValue(schedule);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await getSchedule(req, res);

    expect(scheduleRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 1,
        service: { location: { id: 1 } },
      },
    });
    expect(res.json).toHaveBeenCalledWith(schedule);
  });

  test('getSchedule should return 404 if location not found', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '1' });
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await getSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  test('getSchedule should return 404 if schedule not found', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '1' });
    const res = mockResponse();
    scheduleRepository.findOne.mockResolvedValue(null);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await getSchedule(req, res);

    expect(scheduleRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 1,
        service: { location: { id: 1 } },
      },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Schedule not found' });
  });

  test('createSchedule should create a new schedule', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1' },
      { serviceId: '1', userId: '1', teamMemberId: '1' },
    );
    const res = mockResponse();
    const newSchedule = new Schedule();
    newSchedule.date = '2023-10-10';
    newSchedule.time_period = '10:00-12:00';
    newSchedule.service = { id: 1 } as Service;
    newSchedule.user = { id: 1 } as User;
    newSchedule.teamMember = { id: 1 } as TeamMember;
    scheduleRepository.save.mockResolvedValue(newSchedule);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getServiceRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getTeamMemberRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getUserRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await createSchedule(req, res);

    expect(scheduleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining(req.body),
    );
    expect(res.json).toHaveBeenCalledWith(newSchedule);
  });

  test('createSchedule should return 404 for invalid location', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1' },
      { serviceId: '1', userId: '1', teamMemberId: '1' },
    );
    const res = mockResponse();
    const newSchedule = new Schedule();
    newSchedule.date = '2023-10-10';
    newSchedule.time_period = '10:00-12:00';
    newSchedule.service = { id: 1 } as Service;
    newSchedule.user = { id: 1 } as User;
    newSchedule.teamMember = { id: 1 } as TeamMember;
    scheduleRepository.save.mockResolvedValue(newSchedule);
    (getLocationRecord as jest.Mock).mockResolvedValue(null);
    (getServiceRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getTeamMemberRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getUserRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await createSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  test('createSchedule should return 400 for invalid service', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1' },
      { serviceId: '1', userId: '1', teamMemberId: '1' },
    );
    const res = mockResponse();
    const newSchedule = new Schedule();
    newSchedule.date = '2023-10-10';
    newSchedule.time_period = '10:00-12:00';
    newSchedule.service = { id: 1 } as Service;
    newSchedule.user = { id: 1 } as User;
    newSchedule.teamMember = { id: 1 } as TeamMember;
    scheduleRepository.save.mockResolvedValue(newSchedule);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getServiceRecord as jest.Mock).mockResolvedValue(null);
    (getTeamMemberRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getUserRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await createSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid service, user, or team member',
    });
  });

  test('createSchedule should return 400 for invalid team member', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1' },
      { serviceId: '1', userId: '1', teamMemberId: '1' },
    );
    const res = mockResponse();
    const newSchedule = new Schedule();
    newSchedule.date = '2023-10-10';
    newSchedule.time_period = '10:00-12:00';
    newSchedule.service = { id: 1 } as Service;
    newSchedule.user = { id: 1 } as User;
    newSchedule.teamMember = { id: 1 } as TeamMember;
    scheduleRepository.save.mockResolvedValue(newSchedule);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getServiceRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getTeamMemberRecord as jest.Mock).mockResolvedValue(null);
    (getUserRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await createSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid service, user, or team member',
    });
  });

  test('createSchedule should return 400 for invalid user', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1' },
      { serviceId: '1', userId: '1', teamMemberId: '1' },
    );
    const res = mockResponse();
    const newSchedule = new Schedule();
    newSchedule.date = '2023-10-10';
    newSchedule.time_period = '10:00-12:00';
    newSchedule.service = { id: 1 } as Service;
    newSchedule.user = { id: 1 } as User;
    newSchedule.teamMember = { id: 1 } as TeamMember;
    scheduleRepository.save.mockResolvedValue(newSchedule);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getServiceRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getTeamMemberRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getUserRecord as jest.Mock).mockResolvedValue(null);

    await createSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid service, user, or team member',
    });
  });

  test('createSchedule should return 404 if location not found', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1' },
      { serviceId: '1', userId: '1', teamMemberId: '1' },
    );
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await createSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  test('createSchedule should return 400 for invalid data', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1' },
      { serviceId: '1', userId: '1', teamMemberId: '1', date: ['invaliddata'] },
    );
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getServiceRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getTeamMemberRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getUserRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await createSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('updateSchedule should update an existing schedule', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1', id: '1' },
      {
        date: '2023-10-10',
        time_period: '10:00-12:00',
        serviceId: '1',
        userId: '1',
        teamMemberId: '1',
      },
    );
    const res = mockResponse();
    const schedule = new Schedule();
    schedule.id = 1;
    schedule.date = '2023-10-09';
    schedule.time_period = '09:00-11:00';
    scheduleRepository.findOne.mockResolvedValue(schedule);
    scheduleRepository.save.mockResolvedValue({ ...schedule, ...req.body });
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getServiceRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getTeamMemberRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getUserRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await updateSchedule(req, res);

    expect(scheduleRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 1,
        service: { location: { id: 1 } },
      },
    });
    expect(scheduleRepository.merge).toHaveBeenCalledWith(schedule, req.body);
    expect(scheduleRepository.save).toHaveBeenCalledWith(schedule);
    expect(res.json).toHaveBeenCalledWith({ ...schedule, ...req.body });
  });

  test('updateSchedule should return 400 for invalid data', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1', id: '1' },
      { date: 'Invalid Date' },
    );
    const res = mockResponse();
    const schedule = { id: 1, date: '2023-10-09', time_period: '09:00-11:00' };
    scheduleRepository.findOne.mockResolvedValue(schedule);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await updateSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('updateSchedule should return 404 if schedule not found', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1', id: '1' },
      { name: 'Updated Schedule' },
    );
    const res = mockResponse();
    scheduleRepository.findOne.mockResolvedValue(null);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await updateSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Schedule not found' });
  });

  test('updateSchedule should return 400 for invalid service', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1', id: '1' },
      { serviceId: '1', userId: '1', teamMemberId: '1' },
    );
    const res = mockResponse();
    const schedule = new Schedule();
    schedule.id = 1;
    schedule.date = '2023-10-09';
    schedule.time_period = '09:00-11:00';
    scheduleRepository.findOne.mockResolvedValue(schedule);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getServiceRecord as jest.Mock).mockResolvedValue(null);
    (getTeamMemberRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getUserRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await updateSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid service, user, or team member',
    });
  });

  test('updateSchedule should return 400 for invalid user', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1', id: '1' },
      { serviceId: '1', userId: '1', teamMemberId: '1' },
    );
    const res = mockResponse();
    const schedule = new Schedule();
    schedule.id = 1;
    schedule.date = '2023-10-09';
    schedule.time_period = '09:00-11:00';
    scheduleRepository.findOne.mockResolvedValue(schedule);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getServiceRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getTeamMemberRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getUserRecord as jest.Mock).mockResolvedValue(null);

    await updateSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid service, user, or team member',
    });
  });

  test('updateSchedule should return 400 for invalid team member', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1', id: '1' },
      { serviceId: '1', userId: '1', teamMemberId: '1' },
    );
    const res = mockResponse();
    const schedule = new Schedule();
    schedule.id = 1;
    schedule.date = '2023-10-09';
    schedule.time_period = '09:00-11:00';
    scheduleRepository.findOne.mockResolvedValue(schedule);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getServiceRecord as jest.Mock).mockResolvedValue({ id: 1 });
    (getTeamMemberRecord as jest.Mock).mockResolvedValue(null);
    (getUserRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await updateSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid service, user, or team member',
    });
  });

  test('updateSchedule should return 404 if location not found', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1', id: '1' },
      { serviceId: '1', userId: '1', teamMemberId: '1' },
    );
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await updateSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  test('deleteSchedule should delete a schedule by id', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '1' });
    const res = mockResponse();
    const deleteResult = { affected: 1, raw: {} };
    scheduleRepository.findOne.mockResolvedValue({ id: 1 });
    scheduleRepository.delete.mockResolvedValue(deleteResult);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await deleteSchedule(req, res);

    expect(scheduleRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 1,
        service: { location: { id: 1 } },
      },
    });
    expect(scheduleRepository.delete).toHaveBeenCalledWith(req.params.id);
    expect(res.json).toHaveBeenCalledWith(deleteResult);
  });

  test('deleteSchedule should return 404 if schedule not found', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '1' });
    const res = mockResponse();
    scheduleRepository.findOne.mockResolvedValue(null);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await deleteSchedule(req, res);

    expect(scheduleRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 1,
        service: { location: { id: 1 } },
      },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Schedule not found' });
  });

  test('deleteSchedule should return 404 if location not found', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '1' });
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await deleteSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });
});
