import { Request, Response } from 'express';
import { AppDataSource } from '../appDataSource';
import { Service } from '../entity/Service';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { getLocationRecord } from './locationController';
import { ServiceDto } from '../dto/ServiceDto';

const getRepository = function (): Repository<Service> {
  return AppDataSource.getRepository<Service>(Service);
};

export const getServiceRecord = async (
  customer_id: number,
  location_id: number,
  service_id: number,
): Promise<Service | null> => {
  return await getRepository().findOne({
    where: {
      id: service_id,
      location: { id: location_id, customer: { id: customer_id } },
    },
  });
};

export const getServices = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const services = await getRepository().find({
    where: { location: { id: location.id } },
  });
  res.json(services);
};

export const getService = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const service = await getRepository().findOne({
    where: {
      id: parseInt(req.params.id),
      location: { id: location.id },
    },
  });
  if (service) {
    res.json(service);
  } else {
    res.status(404).json({ message: 'Service not found' });
  }
};

export const createService = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const newService = new Service();
  newService.location = location;
  getRepository().merge(newService, plainToClass(ServiceDto, req.body));
  const errors = await validate(newService, { skipMissingProperties: true });
  if (errors.length > 0) {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }
  const result = await getRepository().save(newService);
  res.json(result);
};

export const updateService = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const serviceRepository = getRepository();
  const service = await serviceRepository.findOne({
    where: {
      id: parseInt(req.params.id),
      location: { id: location.id },
    },
  });
  if (!service) {
    res.status(404).json({ message: 'Service not found' });
    return;
  }
  serviceRepository.merge(service, plainToClass(ServiceDto, req.body));
  const errors = await validate(service, { skipMissingProperties: true });
  if (errors.length > 0) {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }
  const result = await serviceRepository.save(service);
  res.json(result);
};

export const deleteService = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const service = await getRepository().findOne({
    where: {
      id: parseInt(req.params.id),
      location: { id: location.id },
    },
  });
  if (!service) {
    res.status(404).json({ message: 'Service not found' });
    return;
  }
  const result = await getRepository().delete(req.params.id);
  res.json(result);
};
