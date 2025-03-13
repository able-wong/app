import { TeamMember } from '../../../src/entity/TeamMember';

describe('TeamMember Entity', () => {
  it('should create a team member', () => {
    const teamMember = new TeamMember();
    teamMember.name = 'Jane Doe';

    expect(teamMember.name).toBe('Jane Doe');
  });
});
