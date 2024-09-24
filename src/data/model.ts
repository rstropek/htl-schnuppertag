export type Department = 'informatik' | 'medientechnik';

export type Appointments = {
  appointments: [
    {
      department: Department;
      isoDate: string; // Date in ISO 8601 format
      maxAttendees: number;
    }
  ],
  rateGirls: number;
};

export type AppointmentsWithId = Appointments & { id: string };
