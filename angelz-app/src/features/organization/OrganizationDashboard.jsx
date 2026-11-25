import useLocale from "../../hooks/useLocale";
import EditOrganizationForm from './EditOrganizationForm'

const OrganizationDashboard = () => {
    const { t } = useLocale('organization')
    return (
        <>
            <h2>{t('profile.title')}</h2>
            <EditOrganizationForm />
        </>
    )
}

export default OrganizationDashboard
