// src/schema/organization.js
import * as yup from "yup";

export const editOrganizationProfileSchema = yup.object().shape({
    name: yup.string().required("First name is required"),
    last_name: yup.string().required("Last name is required"),
    description: yup.string().required("Description is required"),
    company_name: yup.string().required("Organization name is required"),
    organization_website: yup.string()
        .url('Please provide a full URL (e.g., https://example.com)')
        .test('https-prefix', 'invalid format, use with https://', function(value) {
            if (!value) return true; // allow empty
            return value.toLowerCase().startsWith('https://');
        })
        .nullable(),
    company_type: yup.array().of(yup.string().nullable()).nullable(),
    contact_no: yup
        .string()
        .transform((value, originalValue) =>
            originalValue === "" ? null : value
        )
        .nullable()
        .matches(/^\d{10,15}$/, "Invalid contact number"),
    address: yup.string().required("Address is required"),
    city: yup.string().required("City is required"),
    state: yup.string().required("State is required"),
    zipcode: yup.string().nullable(),
    country: yup.string().required("Country is required"),
    image: yup.mixed().nullable(),
    services: yup.string().required("Organization type is required")
});
