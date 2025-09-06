import { faker } from '@faker-js/faker';
import { College, Student, Event, Registration, Attendance, Feedback } from '../types';

// Generate mock colleges
export const colleges: College[] = Array.from({ length: 10 }, () => ({
  id: faker.string.uuid(),
  name: faker.company.name() + ' College',
}));

// Generate mock students
export const students: Student[] = Array.from({ length: 200 }, () => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  collegeId: faker.helpers.arrayElement(colleges).id,
}));

// Generate mock events
export const events: Event[] = Array.from({ length: 50 }, () => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
  type: faker.helpers.arrayElement(['Workshop', 'Fest', 'Seminar', 'Conference', 'Sports', 'Cultural'] as const),
  date: faker.date.future().toISOString(),
  collegeId: faker.helpers.arrayElement(colleges).id,
  description: faker.lorem.paragraph(),
  location: faker.location.streetAddress(),
  maxAttendees: faker.number.int({ min: 50, max: 500 }),
}));

// Generate mock registrations
export const registrations: Registration[] = Array.from({ length: 300 }, () => ({
  id: faker.string.uuid(),
  studentId: faker.helpers.arrayElement(students).id,
  eventId: faker.helpers.arrayElement(events).id,
  timestamp: faker.date.recent().toISOString(),
}));

// Generate mock attendance
export const attendance: Attendance[] = registrations
  .filter(() => faker.datatype.boolean({ probability: 0.7 }))
  .map(reg => ({
    id: faker.string.uuid(),
    registrationId: reg.id,
    checkInTime: faker.date.recent().toISOString(),
  }));

// Generate mock feedback
export const feedback: Feedback[] = attendance
  .filter(() => faker.datatype.boolean({ probability: 0.6 }))
  .map(att => {
    const registration = registrations.find(r => r.id === att.registrationId)!;
    return {
      id: faker.string.uuid(),
      registrationId: registration.id,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.sentence(),
    };
  });
