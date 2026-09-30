import * as yup from "yup";
import { isStartBeforeEnd } from "../utils/dateUtils";

export const createMissionSchema = yup.object().shape({
  name: yup.string().required("Mission name is required").nullable(),
  description: yup.string().nullable().notRequired(),
  status: yup
    .string()
    // .oneOf(["pending", "completed", "rejected"])
    .default("pending")
    .nullable(),
  lat: yup.number().typeError("Select Your location"),
  lng: yup.number().typeError("Longitude must be a number"),
  file: yup.mixed().nullable(),
  start_time: yup
    .date()
    .typeError("Invalid start time")
    .required("Start time is required"),
  end_time: yup
    .date()
    .typeError("Invalid end time")
    .required("End time is required")
    .test(
      "is-after-start",
      "End time must be after start time",
      function (value) {
        const { start_time } = this.parent;
        if (!value || !start_time) return true;
        return isStartBeforeEnd(start_time, value);
      }
    ),
  relevant_distance: yup
    .string()
    .oneOf(
      ["local", "city wide", "country wide", "global"],
      "Select a valid distance"
    )
    .nullable(),
  work_type: yup
    .string()
    .oneOf(["tutor", "staff", "cleaning", "watchman"], "Select a valid work type")
    .nullable(),
  mission_type: yup
    .string()
    .oneOf(["virtual", "on-site"], "Select a valid mission type")
    .nullable(),
  volunteer_required: yup
    .number()
    .typeError("Volunteer count must be a number")
    .nullable(),
  points: yup.number().typeError("Points must be a number").nullable(),
  allow_interaction: yup
    .object()
    .shape({
      comments: yup.boolean().default(false),
      likes: yup.boolean().default(false),
      share: yup.boolean().default(false),
    })
    .nullable(),
  assignedvolunteers: yup.array().of(yup.number().nullable()).nullable(),
  pendingRequests: yup.array().of(yup.number().nullable()).nullable(),
  images: yup.array().of(yup.string().nullable()).nullable(),
  available_timing: yup
    .array()
    .of(
      yup.object().shape({
        day: yup.string().nullable(),
        from: yup
          .string()
          .nullable()
          .test(
            "is-before-end",
            "Start time must be earlier than end time",
            function (value) {
              const { to } = this.parent;
              if (!value || !to) return true;
              return isStartBeforeEnd(value, to);
            }
          ),
        to: yup.string().nullable(),
      })
    )
    .nullable(),
});

export const editMissionSchema = yup.object({
  name: yup.string().required("Mission name is required"),
  description: yup.string().nullable(),
  start_time: yup
    .date()
    .typeError("Invalid start time")
    .required("Start time is required"),
  end_time: yup
    .date()
    .typeError("Invalid end time")
    .required("End time is required")
    .test("is-after-start", "End time must be after start time", function (value) {
      const { start_time } = this.parent;
      return !value || !start_time || isStartBeforeEnd(start_time, value);
    }),
  relevant_distance: yup
    .string()
    .oneOf(["local", "city wide", "country wide", "global"])
    .nullable(),
  work_type: yup
    .string()
    .oneOf(["tutor", "staff", "cleaning", "watchman"])
    .nullable(),
  mission_type: yup.string().oneOf(["virtual", "on-site"]).nullable(),
  volunteer_required: yup
    .number()
    .typeError("Volunteer count must be a number")
    .nullable(),
  points: yup.number().typeError("Points must be a number").nullable(),
  allow_interaction: yup
    .object({
      comments: yup.boolean(),
      likes: yup.boolean(),
      share: yup.boolean(),
    })
    .nullable(),
  lat: yup.number().nullable(),
  lng: yup.number().nullable(),
  images: yup.mixed().nullable(),
});
