import { Request, Response } from 'express';
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getServiceRecord,
} from '../../../src/controllers/serviceController';
import { AppDataSource } from '../../../src/appDataSource';
import { Service } from '../../../src/entity/Service';
import { getLocationRecord } from '../../../src/controllers/locationController';
import { ServiceDto } from '../../../src/dto/ServiceDto';

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

describe('Service Controller', () => {
  let serviceRepository: jest.Mocked<
    ReturnType<typeof AppDataSource.getRepository>
  >;

  beforeAll(() => {
    serviceRepository = {} as jest.Mocked<
      ReturnType<typeof AppDataSource.getRepository>
    >;
    serviceRepository.find = jest.fn();
    serviceRepository.findOneBy = jest.fn();
    serviceRepository.findOne = jest.fn();
    serviceRepository.create = jest.fn();
    serviceRepository.save = jest.fn();
    serviceRepository.merge = jest.fn((entity, dto) => {
      Object.assign(entity, dto); // Simulate the merge behavior
      return entity;
    });
    serviceRepository.delete = jest.fn();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(
      serviceRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getServices should return all services', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1' });
    const res = mockResponse();
    const services = [{ id: 1, name: 'Service A' }];
    serviceRepository.find.mockResolvedValue(services);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await getServices(req, res);

    expect(serviceRepository.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(services);
  });

  test('getServices should return 404 if location not found', async () => {
    const req = mockRequest({ customerId: '999', locationId: '1' });
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await getServices(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Location not found',
    });
  });

  test('getService should return a service by id', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '1' });
    const res = mockResponse();
    const service = { id: 1, name: 'Service A' };
    serviceRepository.findOne.mockResolvedValue(service);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await getService(req, res);

    expect(serviceRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, location: { id: 1 } },
    });
    expect(res.json).toHaveBeenCalledWith(service);
  });

  test('getService should return 404 if service not found', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '999' });
    const res = mockResponse();
    serviceRepository.findOne.mockResolvedValue(null);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await getService(req, res);

    expect(serviceRepository.findOne).toHaveBeenCalledWith({
      where: { id: 999, location: { id: 1 } },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Service not found' });
  });

  test('getService should return 404 if location not found', async () => {
    const req = mockRequest({ customerId: '999', locationId: '1', id: '1' });
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await getService(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Location not found',
    });
  });

  test('createService should create a new service', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1' },
      { name: 'Service A' },
    );
    const res = mockResponse();
    const newService = { id: 1, name: 'Service A' };
    serviceRepository.create.mockReturnValue(newService);
    serviceRepository.save.mockResolvedValue(newService);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await createService(req, res);

    expect(serviceRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Service A',
        location: { id: 1 } as unknown as Location,
      } as unknown as ServiceDto),
    );
    expect(res.json).toHaveBeenCalledWith(newService);
  });

  test('createService should return 400 if data is invalid', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1' },
      { created_at: 'Invalid Data' },
    );
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await createService(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('createService should return 404 if location not found', async () => {
    const req = mockRequest(
      { customerId: '999', locationId: '1' },
      { name: 'Service A' },
    );
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await createService(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Location not found',
    });
  });

  test('updateService should update an existing service', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1', id: '1' },
      { name: 'Service B' },
    );
    const res = mockResponse();
    const service = new Service();
    service.id = 1;
    service.name = 'Service A';
    serviceRepository.findOne.mockResolvedValue(service);
    serviceRepository.save.mockResolvedValue({ ...service, ...req.body });
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await updateService(req, res);

    expect(serviceRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, location: { id: 1 } },
    });
    expect(serviceRepository.merge).toHaveBeenCalledWith(service, req.body);
    expect(serviceRepository.save).toHaveBeenCalledWith(service);
    expect(res.json).toHaveBeenCalledWith({ ...service, ...req.body });
  });

  test('updateService should return 404 if service not found', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1', id: '999' },
      { name: 'Service B' },
    );
    const res = mockResponse();
    serviceRepository.findOne.mockResolvedValue(null);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await updateService(req, res);

    expect(serviceRepository.findOne).toHaveBeenCalledWith({
      where: { id: 999, location: { id: 1 } },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Service not found' });
  });

  test('updateService should return 400 if data is invalid', async () => {
    const req = mockRequest(
      { customerId: '1', locationId: '1', id: '1' },
      { date: 'Invalid Date' },
    );
    const res = mockResponse();
    const service = { id: 1, date: '2023-10-09', time_period: '09:00-11:00' };
    serviceRepository.findOne.mockResolvedValue(service);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await updateService(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
  });

  test('updateService should return 404 if location not found', async () => {
    const req = mockRequest(
      { customerId: '999', locationId: '1', id: '1' },
      { name: 'Service B' },
    );
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await updateService(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Location not found',
    });
  });

  test('deleteService should delete a service by id', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '1' });
    const res = mockResponse();
    const deleteResult = { affected: 1, raw: {} };
    serviceRepository.delete.mockResolvedValue(deleteResult);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await deleteService(req, res);

    expect(serviceRepository.delete).toHaveBeenCalledWith(req.params.id);
    expect(res.json).toHaveBeenCalledWith(deleteResult);
  });

  test('deleteService should return 404 if location not found', async () => {
    const req = mockRequest({ customerId: '999', locationId: '1', id: '1' });
    const res = mockResponse();
    (getLocationRecord as jest.Mock).mockResolvedValue(null);

    await deleteService(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Location not found',
    });
  });

  test('deleteService should return 404 if service not found', async () => {
    const req = mockRequest({ customerId: '1', locationId: '1', id: '999' });
    const res = mockResponse();
    serviceRepository.findOne.mockResolvedValue(null);
    (getLocationRecord as jest.Mock).mockResolvedValue({ id: 1 });

    await deleteService(req, res);

    expect(serviceRepository.findOne).toHaveBeenCalledWith({
      where: { id: 999, location: { id: 1 } },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Service not found' });
  });

  test('getServiceRecord should return a service by id', async () => {
    const service = { id: 1, name: 'Service A' };
    serviceRepository.findOne.mockResolvedValue(service);

    const result = await getServiceRecord(1, 1, 1);

    expect(serviceRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 1,
        location: { id: 1, customer: { id: 1 } },
      },
    });
    expect(result).toEqual(service);
  });

  test('getServiceRecord should return null if service not found', async () => {
    serviceRepository.findOne.mockResolvedValue(null);

    const result = await getServiceRecord(1, 1, 999);

    expect(serviceRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 999,
        location: { id: 1, customer: { id: 1 } },
      },
    });
    expect(result).toBeNull();
  });
});
