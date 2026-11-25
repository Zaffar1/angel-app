import * as yup from "yup";
import i18n from "../i18n";

export const editVolunteerGroupProfileSchema = yup.object().shape({
    name: yup.string().required(() => i18n.t("volunteerGroup:validation.nameRequired")),
    description: yup.string().required(() => i18n.t("volunteerGroup:validation.descriptionRequired")),
    contact_no: yup
        .string()
        .transform((value, originalValue) =>
            originalValue === "" ? null : value
        )
        .nullable()
        .matches(/^\d{10,15}$/, () => i18n.t("volunteerGroup:validation.invalidContact")),
    address: yup.string().required(() => i18n.t("volunteerGroup:validation.addressRequired")),
    city: yup.string().required(() => i18n.t("volunteerGroup:validation.cityRequired")),
    state: yup.string().required(() => i18n.t("volunteerGroup:validation.stateRequired")),
    country: yup.string().required(() => i18n.t("volunteerGroup:validation.countryRequired")),
    image: yup.mixed().nullable(),
});

export const inviteVolunteerSchema = yup.object().shape({
    name: yup.string().required(() => i18n.t("volunteerGroup:validation.inviteNameRequired")),
    email: yup.string().email(() => i18n.t("volunteerGroup:validation.invalidEmail")).required(() => i18n.t("volunteerGroup:validation.emailRequired")),
    contact_no: yup
        .string()
        .transform((value, originalValue) =>
            originalValue === "" ? null : value
        )
        .nullable()
        .optional()
        .matches(/^\d{10,15}$/, () => i18n.t("volunteerGroup:validation.invalidContact")),
    description: yup.string().nullable().optional(),
});
