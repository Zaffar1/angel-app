import { CgSpinner } from "react-icons/cg"

const Loader = ({ fullPage = true }) => {
  return (
    <div className={`${fullPage ? 'min-h-screen' : ''} flex items-center justify-center`}>
      <p className="flex gap-2">
        <span className="animate-spin">
          <CgSpinner size={fullPage ? 36 : 24} className="text-blue-500" />
        </span>
      </p>
    </div>
  )
}
export default Loader;