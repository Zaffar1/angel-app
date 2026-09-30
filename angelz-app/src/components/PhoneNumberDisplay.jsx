import { displayUSPhoneNumber, cleanUSPhoneNumber } from '../utils/phoneUtils';

export function PhoneNumberDisplay({ phone, number, className = "" }) {
  const displayVal = phone || number;
  if (!displayVal) return null;

  const formattedPhone = displayUSPhoneNumber(displayVal);
  const phoneDigits = cleanUSPhoneNumber(displayVal);
  const isValid = phoneDigits.length === 10;

  if (!isValid) {
    return <span className={className}>{displayVal}</span>;
  }

  return (
    <a
      href={`tel:+1${phoneDigits}`}
      className={`text-blue-600 hover:text-blue-800 hover:underline ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {formattedPhone}
    </a>
  );
}