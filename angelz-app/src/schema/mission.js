import * as yup from "yup";
import { isStartBeforeEnd } from "../utils/dateUtils";
import i18n from "../i18n";

export const createMissionSchema = yup.object().shape({
  name: yup.string().required(() => i18n.t("mission:validation.nameRequired")).nullable(),
  description: yup.string().nullable().notRequired(),
  status: yup
    .string()
    // .oneOf(["pending", "completed", "rejected"])
    .default("pending")
    .nullable(),
  lat: yup.number().typeError(() => i18n.t("mission:validation.selectLocation")),
  lng: yup.number().typeError(() => i18n.t("mission:validation.longitudeNumber")),
  file: yup.mixed().nullable(),
  start_time: yup
    .date()
    .typeError(() => i18n.t("mission:validation.invalidStart"))
    .required(() => i18n.t("mission:validation.startRequired")),
  end_time: yup
    .date()
    .typeError(() => i18n.t("mission:validation.invalidEnd"))
    .required(() => i18n.t("mission:validation.endRequired"))
    .test(
      "is-after-start",
      () => i18n.t("mission:validation.endAfterStart"),
      function (value) {
        const { start_time } = this.parent;
        if (!value || !start_time) return true;
        return isStartBeforeEnd(start_time, value);
      }
    ),
  relevant_distance: yup
    .string()
    .transform((val, orig) => (orig === "" || val === "" ? null : val))
    .oneOf(
      ["local", "city wide", "country wide", "global"],
      () => i18n.t("mission:validation.validDistance")
    )
    .nullable(),
  work_type: yup
    .string()
    .transform((val, orig) => (orig === "" || val === "" ? null : val))
    .oneOf(["tutor", "staff", "cleaning", "watchman"], () => i18n.t("mission:validation.validWorkType"))
    .nullable(),
  mission_type: yup
    .string()
    .transform((val, orig) => (orig === "" || val === "" ? null : val))
    .oneOf(["virtual", "on-site"], () => i18n.t("mission:validation.validMissionType"))
    .nullable(),
  volunteer_required: yup
    .number()
    .transform((val, orig) => (orig === "" || orig == null || isNaN(val) ? null : Number(val)))
    .typeError(() => i18n.t("mission:validation.volunteerNumber"))
    .min(0, () => i18n.t("mission:validation.volunteerNegative"))
    .nullable(),
  points: yup
    .number()
    .transform((val, orig) => (orig === "" || orig == null || isNaN(val) ? null : Number(val)))
    .typeError(() => i18n.t("mission:validation.pointsNumber"))
    .min(0, () => i18n.t("mission:validation.pointsNegative"))
    .nullable(),
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
            () => i18n.t("mission:validation.timingStartBeforeEnd"),
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
  name: yup.string().required(() => i18n.t("mission:validation.nameRequired")),
  description: yup.string().nullable(),
  start_time: yup
    .date()
    .typeError(() => i18n.t("mission:validation.invalidStart"))
    .required(() => i18n.t("mission:validation.startRequired")),
  end_time: yup
    .date()
    .typeError(() => i18n.t("mission:validation.invalidEnd"))
    .required(() => i18n.t("mission:validation.endRequired"))
    .test("is-after-start", () => i18n.t("mission:validation.endAfterStart"), function (value) {
      const { start_time } = this.parent;
      return !value || !start_time || isStartBeforeEnd(start_time, value);
    }),
  relevant_distance: yup
    .string()
    .transform((val, orig) => (orig === "" || val === "" ? null : val))
    .oneOf(["local", "city wide", "country wide", "global"], () => i18n.t("mission:validation.validDistance"))
    .nullable(),
  work_type: yup
    .string()
    .transform((val, orig) => (orig === "" || val === "" ? null : val))
    .oneOf(["tutor", "staff", "cleaning", "watchman"], () => i18n.t("mission:validation.validWorkType"))
    .nullable(),
  mission_type: yup
    .string()
    .transform((val, orig) => (orig === "" || val === "" ? null : val))
    .oneOf(["virtual", "on-site"], () => i18n.t("mission:validation.validMissionType"))
    .nullable(),
  volunteer_required: yup
    .number()
    .transform((val, orig) => (orig === "" || orig == null || isNaN(val) ? null : Number(val)))
    .typeError(() => i18n.t("mission:validation.volunteerNumber"))
    .min(0, () => i18n.t("mission:validation.volunteerNegative"))
    .nullable(),
  points: yup
    .number()
    .transform((val, orig) => (orig === "" || orig == null || isNaN(val) ? null : Number(val)))
    .typeError(() => i18n.t("mission:validation.pointsNumber"))
    .min(0, () => i18n.t("mission:validation.pointsNegative"))
    .nullable(),
  allow_interaction: yup
    .object({
      comments: yup.boolean(),
      likes: yup.boolean(),
      share: yup.boolean(),
    })
    .nullable(),
  lat: yup
    .number()
    .transform((val, orig) => (orig === "" || orig == null || isNaN(val) ? null : Number(val)))
    .nullable(),
  lng: yup
    .number()
    .transform((val, orig) => (orig === "" || orig == null || isNaN(val) ? null : Number(val)))
    .nullable(),
  file: yup.mixed().nullable(),
  status: yup.string().nullable(),
  images: yup.mixed().nullable(),
});
