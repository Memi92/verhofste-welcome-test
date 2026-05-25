export type Employee = {
  id: string;
  name: string;
  department: string;
  function: string;
  phone_extension: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export type EmployeeFormValues = {
  name: string;
  department: string;
  function: string;
  phone_extension: string;
  image_url?: string | null;
};

export type EventLog = {
  id: string;
  event_type: string;
  employee_id: Employee["id"] | null;
  message: string;
  created_at: string;
};
