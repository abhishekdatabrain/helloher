import { FormField } from "@/hooks/types";
import { includes } from "@/hooks/polyfills";

export const userFormType: FormField[] = [
  {
    type: "text",
    required: true,
    name: "username",
    label: "Employee Name",
    placeholder: "Enter employee name",
  },
  {
    name: "email",
    type: "email",
    label: "Email",
    required: true,
    placeholder: "Enter your email",
    validation: (value) => (includes(value, "@") ? null : "Invalid email"),
  },
  {
    name: "role",
    type: "select",
    required: true,
    label: "Employee Role",
    placeholder: "Select user role",
    options: []
  },
  {
    type: "text",
    name: "password",
    label: "Enter Password",
    placeholder: "Enter password",
  },
  {
    type: "choose",
    name: "status",
    label: "Do you want to activate this employee?",
    required: false,
  },
];
