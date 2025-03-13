import { Request, Response } from 'express';
import { AppDataSource } from '../appDataSource';
import { Schedule } from '../entity/Schedule';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { getLocationRecord } from './locationController';
import { getServiceRecord } from './serviceController';
import { getUserRecord } from './userController';
import { getTeamMemberRecord } from './teamMemberController';
import { ScheduleDto } from '../dto/ScheduleDto';

const getRepository = function (): Repository<Schedule> {
  return AppDataSource.getRepository<Schedule>(Schedule);
};

const getRelatedRecords = async (
  customerId: number,
  locationId: number,
  serviceId: number,
  userId: number,
  teamMemberId: number,
) => {
  const service = await getServiceRecord(customerId, locationId, serviceId);
  const user = await getUserRecord(customerId, userId);
  const teamMember = await getTeamMemberRecord(
    customerId,
    locationId,
    teamMemberId,
  );
  return { service, user, teamMember };
};

export const getSchedules = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const schedules = await getRepository().find({
    where: { service: { location: { id: location.id } } },
  });
  res.json(schedules);
};

export const getSchedule = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const schedule = await getRepository().findOne({
    where: {
      id: parseInt(req.params.id),
      service: { location: { id: location.id } },
    },
  });
  if (schedule) {
    res.json(schedule);
  } else {
    res.status(404).json({ message: 'Schedule not found' });
  }
};

export const createSchedule = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const { service, user, teamMember } = await getRelatedRecords(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
    parseInt(req.body.serviceId),
    parseInt(req.body.userId),
    parseInt(req.body.teamMemberId),
  );
  if (!service || !user || !teamMember) {
    res.status(400).json({ message: 'Invalid service, user, or team member' });
    return;
  }
  const dto = plainToClass(ScheduleDto, req.body);
  const errors = await validate(dto, { skipMissingProperties: true });
  if (errors.length > 0) {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }
  const newSchedule = new Schedule();
  newSchedule.service = service;
  newSchedule.user = user;
  newSchedule.teamMember = teamMember;
  getRepository().merge(newSchedule, dto);
  const result = await getRepository().save(newSchedule);
  res.json(result);
};

export const updateSchedule = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const scheduleRepository = getRepository();
  const schedule = await scheduleRepository.findOne({
    where: {
      id: parseInt(req.params.id),
      service: { location: { id: location.id } },
    },
  });
  if (!schedule) {
    res.status(404).json({ message: 'Schedule not found' });
    return;
  }
  const { service, user, teamMember } = await getRelatedRecords(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
    parseInt(req.body.serviceId),
    parseInt(req.body.userId),
    parseInt(req.body.teamMemberId),
  );
  if (!service || !user || !teamMember) {
    res.status(400).json({ message: 'Invalid service, user, or team member' });
    return;
  }
  scheduleRepository.merge(schedule, plainToClass(ScheduleDto, req.body));
  const errors = await validate(schedule, { skipMissingProperties: true });
  if (errors.length > 0) {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }
  const result = await scheduleRepository.save(schedule);
  res.json(result);
};

export const deleteSchedule = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const schedule = await getRepository().findOne({
    where: {
      id: parseInt(req.params.id),
      service: { location: { id: location.id } },
    },
  });
  if (schedule) {
    const result = await getRepository().delete(req.params.id);
    res.json(result);
  } else {
    res.status(404).json({ message: 'Schedule not found' });
  }
};
