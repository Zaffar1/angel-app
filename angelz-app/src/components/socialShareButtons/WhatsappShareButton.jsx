import { WhatsappShareButton, WhatsappIcon } from "react-share"

const WhatsappShare = ({ post }) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/organization/feed/all`;
    const title = post?.name || 'Check out this post'
    const description = post?.description ? post.description.substring(0, 100) + '...' : ''

    return (
        <WhatsappShareButton
            url={shareUrl}
            title={`Title: ${title}\n Description: ${description}\n`}
            separator=": ">
            <WhatsappIcon size={32} round />
        </WhatsappShareButton>
    )
}

export default WhatsappShare