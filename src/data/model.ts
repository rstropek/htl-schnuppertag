export type Department = "informatik" | "medientechnik";

export type Appointments = {
  appointments: {
    department: Department;
    isoDate: string; // Date in ISO 8601 format
    maxAttendees: number;
  }[];
  rateGirls: number;
};

export type AppointmentsWithId = Appointments & { id: string };

export type Registration = {
  first_name: string;
  last_name: string;
  gender: string;
  email: string;
  phone_number: string;
  residence: string;
  current_school: string;
  current_class: string;
  department: string;
  appointment: string;
};

export type RegistrationWithId = Registration & { id: string };
