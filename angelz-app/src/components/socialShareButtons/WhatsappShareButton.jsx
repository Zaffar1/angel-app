import useLocale from "../../hooks/useLocale";
import { WhatsappShareButton, WhatsappIcon } from "react-share"

const WhatsappShare = ({ post }) => {
    const { t } = useLocale("feed")
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/organization/feed/all`;
    const title = post?.name || t("whatsapp.defaultTitle")
    const description = post?.description ? post.description.substring(0, 100) + '...' : ''

    return (
        <WhatsappShareButton
            url={shareUrl}
            title={t("whatsapp.message", { title, description, interpolation: { escapeValue: false } })}
            separator=": ">
            <WhatsappIcon size={32} round />
        </WhatsappShareButton>
    )
}

export default WhatsappShare