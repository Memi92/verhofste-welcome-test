import type { Employee } from "@/types";

export const mockEmployees: Employee[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Pieter Van Lokeren",
    department: "ICT",
    function: "IT Manager",
    phone_extension: "201",
    image_url: null,
    is_active: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Simon Steels",
    department: "Management",
    function: "Chief Operations Officer",
    phone_extension: "214",
    image_url: null,
    is_active: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Marc verhofsté",
    department: "Management",
    function: "Chief Executive Officer",
    phone_extension: "228",
    image_url: null,
    is_active: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Bart Wiels",
    department: "Management",
    function: "Director of Operations",
    phone_extension: "237",
    image_url: null,
    is_active: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    name: "Laura Willems",
    department: "Sales",
    function: "Sales Representative",
    phone_extension: "246",
    image_url: null,
    is_active: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    name: "Pieter Maes",
    department: "Logistics",
    function: "Logistics Coordinator",
    phone_extension: "253",
    image_url: null,
    is_active: false,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: null,
  },
];

export const activeMockEmployees = mockEmployees.filter(
  (employee) => employee.is_active
);
