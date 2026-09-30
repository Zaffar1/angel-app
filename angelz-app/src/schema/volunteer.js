// src/schema/volunteer.js
import * as yup from "yup";
import { isStartBeforeEnd } from "../utils/dateUtils";
import { DAYS_OF_WEEK } from "../constant/DAYS_OF_WEEK";

export const editVolunteerProfileSchema = yup.object().shape({
  name: yup.string().required("First name is required"),
  last_name: yup.string().required("Last name is required"),
  contact_no: yup
    .string()
    .transform((value, originalValue) =>
      originalValue === "" ? null : value
    )
    .required("Contact number is required")
    .matches(/^\d{10,15}$/, "Invalid contact number"),
  address: yup.string().required("Address is required"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  zipcode: yup.string().nullable(),
  country: yup.string().required("Country is required"),
  image: yup.mixed().nullable(),
  preferences: yup.array().of(yup.string().nullable()).nullable(),
  expertise: yup.array().of(yup.string().nullable()).nullable(),
  available_timing: yup
    .array()
    .of(
      yup.object().shape({
        day: yup
          .string()
          .required("Day is required")
          .test(
            "is-valid-day",
            "Invalid day",
            (value) => !!value && DAYS_OF_WEEK.includes(value)
          ),
        start_time: yup
          .string()
          .required("Start time is required")
          .matches(
            /^([0-1]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
            "Invalid time format (expected HH:MM or HH:MM:SS)"
          ),
        end_time: yup
          .string()
          .required("End time is required")
          .matches(
            /^([0-1]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
            "Invalid time format (expected HH:MM or HH:MM:SS)"
          )
          .test(
            "is-after-start",
            "End time must be later than start time",
            function (value) {
              return isStartBeforeEnd(this.parent.start_time, value);
            }
          ),
      })
    )
    .min(1, "At least one available timing is required")
    .required(),
});