// src/schema/organization.js
import * as yup from "yup";
import i18n from "../i18n";

export const editOrganizationProfileSchema = yup.object().shape({
    name: yup.string().required(() => i18n.t("organization:validation.firstNameRequired")),
    last_name: yup.string().required(() => i18n.t("organization:validation.lastNameRequired")),
    description: yup.string().required(() => i18n.t("organization:validation.descriptionRequired")),
    company_name: yup.string().required(() => i18n.t("organization:validation.organizationNameRequired")),
    organization_website: yup.string()
        .url(() => i18n.t("organization:validation.urlInvalid"))
        .test('https-prefix', () => i18n.t("organization:validation.httpsPrefix"), function(value) {
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
        .matches(/^\d{10,15}$/, () => i18n.t("organization:validation.contactInvalid")),
    address: yup.string().required(() => i18n.t("organization:validation.addressRequired")),
    city: yup.string().required(() => i18n.t("organization:validation.cityRequired")),
    state: yup.string().required(() => i18n.t("organization:validation.stateRequired")),
    zipcode: yup.string().nullable(),
    country: yup.string().required(() => i18n.t("organization:validation.countryRequired")),
    image: yup.mixed().nullable(),
    services: yup.string().required(() => i18n.t("organization:validation.typeRequired"))
});
