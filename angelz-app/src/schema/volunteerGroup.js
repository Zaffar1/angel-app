import * as yup from "yup";

export const editVolunteerGroupProfileSchema = yup.object().shape({
    name: yup.string().required("Group name is required"),
    description: yup.string().required("Description is required"),
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
    country: yup.string().required("Country is required"),
    image: yup.mixed().nullable(),
});

export const inviteVolunteerSchema = yup.object().shape({
    name: yup.string().required("Name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    contact_no: yup
        .string()
        .transform((value, originalValue) =>
            originalValue === "" ? null : value
        )
        .nullable()
        .optional()
        .matches(/^\d{10,15}$/, "Invalid contact number"),
    description: yup.string().nullable().optional(),
});
