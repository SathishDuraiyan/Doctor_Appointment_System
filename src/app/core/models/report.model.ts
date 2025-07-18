// report.model.ts
export interface Doctor {
  id: string;
  name: string;
  department: string;
  email: string;
  phone: string;
  specialization: string;
  experience: string;
  qualifications: string;
  status: string;
}

export interface Patient {
  id: string;
  name: string;
  gender: string;
  bloodGroup: string;
  doctor: string;
  reason: string;
  status: string;
  admissionDate: string;
  contact: string;
  address: string;
  age: string;
  medicalHistory: string;
}
