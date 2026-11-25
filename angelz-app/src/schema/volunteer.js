// src/schema/volunteer.js
import * as yup from "yup";
import { isStartBeforeEnd } from "../utils/dateUtils";
import { DAYS_OF_WEEK } from "../constant/DAYS_OF_WEEK";
import i18n from "../i18n";

export const editVolunteerProfileSchema = yup.object().shape({
  name: yup.string().required(() => i18n.t("volunteer:validation.firstNameRequired")),
  last_name: yup.string().required(() => i18n.t("volunteer:validation.lastNameRequired")),
  contact_no: yup
    .string()
    .transform((value, originalValue) =>
      originalValue === "" ? null : value
    )
    .required(() => i18n.t("volunteer:validation.contactRequired"))
    .matches(/^\d{10,15}$/, () => i18n.t("volunteer:validation.contactInvalid")),
  address: yup.string().required(() => i18n.t("volunteer:validation.addressRequired")),
  city: yup.string().required(() => i18n.t("volunteer:validation.cityRequired")),
  state: yup.string().required(() => i18n.t("volunteer:validation.stateRequired")),
  zipcode: yup.string().nullable(),
  country: yup.string().required(() => i18n.t("volunteer:validation.countryRequired")),
  image: yup.mixed().nullable(),
  preferences: yup.array().of(yup.string().nullable()).nullable(),
  expertise: yup.array().of(yup.string().nullable()).nullable(),
  available_timing: yup
    .array()
    .of(
      yup.object().shape({
        day: yup
          .string()
          .required(() => i18n.t("volunteer:validation.dayRequired"))
          .test(
            "is-valid-day",
            () => i18n.t("volunteer:validation.dayInvalid"),
            (value) => !!value && DAYS_OF_WEEK.includes(value)
          ),
        start_time: yup
          .string()
          .required(() => i18n.t("volunteer:validation.startRequired"))
          .matches(
            /^([0-1]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
            () => i18n.t("volunteer:validation.timeFormat")
          ),
        end_time: yup
          .string()
          .required(() => i18n.t("volunteer:validation.endRequired"))
          .matches(
            /^([0-1]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
            () => i18n.t("volunteer:validation.timeFormat")
          )
          .test(
            "is-after-start",
            () => i18n.t("volunteer:validation.endAfterStart"),
            function (value) {
              return isStartBeforeEnd(this.parent.start_time, value);
            }
          ),
      })
    )
    .min(1, () => i18n.t("volunteer:validation.timingMin"))
    .required(),
});