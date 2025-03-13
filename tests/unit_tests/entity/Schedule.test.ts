import { Schedule } from '../../../src/entity/Schedule';

describe('Schedule Entity', () => {
  it('should create a schedule', () => {
    const schedule = new Schedule();
    schedule.date = '2023-10-10';
    schedule.time_period = 'Morning';

    expect(schedule.date).toBe('2023-10-10');
    expect(schedule.time_period).toBe('Morning');
  });
});
