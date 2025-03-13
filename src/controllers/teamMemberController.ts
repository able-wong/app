import { Request, Response } from 'express';
import { AppDataSource } from '../appDataSource';
import { TeamMember } from '../entity/TeamMember';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { getLocationRecord } from './locationController';
import { TeamMemberDto } from '../dto/TeamMemberDto';

const getRepository = function (): Repository<TeamMember> {
  return AppDataSource.getRepository<TeamMember>(TeamMember);
};

export const getTeamMembers = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const teamMembers = await getRepository().find({
    where: { location: { id: location.id } },
  });
  res.json(teamMembers);
};

export const getTeamMember = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const teamMember = await getRepository().findOne({
    where: { id: parseInt(req.params.id), location: { id: location.id } },
  });
  if (teamMember) {
    res.json(teamMember);
  } else {
    res.status(404).json({ message: 'Team Member not found' });
  }
};

export const createTeamMember = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const dto = plainToClass(TeamMemberDto, req.body);
  const errors = await validate(dto);
  if (errors.length > 0) {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }

  const newTeamMember = new TeamMember();
  newTeamMember.location = location;
  getRepository().merge(newTeamMember, dto);
  const result = await getRepository().save(newTeamMember);
  res.json(result);
};

export const updateTeamMember = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const teamMemberRepository = getRepository();
  const teamMember = await teamMemberRepository.findOne({
    where: { id: parseInt(req.params.id), location: { id: location.id } },
  });
  if (!teamMember) {
    res.status(404).json({ message: 'Team Member not found' });
    return;
  }
  teamMemberRepository.merge(teamMember, plainToClass(TeamMemberDto, req.body));
  const errors = await validate(teamMember, {
    skipMissingProperties: true,
  });
  if (errors.length > 0) {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }
  const result = await teamMemberRepository.save(teamMember);
  res.json(result);
};

export const deleteTeamMember = async (req: Request, res: Response) => {
  const location = await getLocationRecord(
    parseInt(req.params.customerId),
    parseInt(req.params.locationId),
  );
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const teamMember = await getRepository().findOne({
    where: { id: parseInt(req.params.id), location: { id: location.id } },
  });
  if (!teamMember) {
    res.status(404).json({ message: 'Team Member not found' });
    return;
  }
  const result = await getRepository().delete(req.params.id);
  res.json(result);
};

export const getTeamMemberRecord = async (
  customer_id: number,
  location_id: number,
  teamMember_id: number,
): Promise<TeamMember | null> => {
  return await getRepository().findOne({
    where: {
      id: teamMember_id,
      location: { id: location_id, customer: { id: customer_id } },
    },
  });
};
