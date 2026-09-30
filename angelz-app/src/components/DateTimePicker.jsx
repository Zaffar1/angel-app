import { useState, useRef, useEffect } from 'react';
import { formatDate, formatTime } from '../utils/dateUtils';
import { FaCalendarAlt, FaClock, FaCheck, FaTimes } from 'react-icons/fa';

export function DateTimePicker({ value, onChange, label, error, minDate, required }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    const dateInputRef = useRef(null);
    const timeInputRef = useRef(null);

    useEffect(() => {
        if (value) {
            try {
                const dateObj = new Date(value);
                if (!isNaN(dateObj.getTime())) {
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
                    const day = String(dateObj.getDate()).padStart(2, "0");
                    const hours = String(dateObj.getHours()).padStart(2, "0");
                    const minutes = String(dateObj.getMinutes()).padStart(2, "0");

                    setDate(`${year}-${month}-${day}`);
                    setTime(`${hours}:${minutes}`);
                }
            } catch (error) {
                console.error("Date parse error:", error);
            }
        } else {
            setDate('');
            setTime('');
        }
    }, [value]);

    const handleInputClick = (inputRef) => {
        inputRef.current?.showPicker?.();
        inputRef.current?.focus();
    };

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setDate(newDate);
        if (newDate && time) onChange(`${newDate}T${time}:00`);
        else onChange(null);
    };

    const handleTimeChange = (e) => {
        const newTime = e.target.value;
        setTime(newTime);
        if (date && newTime) onChange(`${date}T${newTime}:00`);
        else onChange(null);
    };

    const handleClear = () => {
        setDate("");
        setTime("");
        onChange(null);
    };

    return (
        <div className="space-y-3">
            <label className="block text-gray-700 text-sm font-medium mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div className="flex gap-4">
                {/* DATE */}
                <div className="flex-1 relative">
                    <div
                        className={`w-full px-3 py-2 rounded-full border transition-all duration-200 cursor-pointer text-sm flex items-center gap-3 shadow-sm ${date ? 'border-[#4C95FF] bg-blue-50/50' : 'border-[#EBF1FF] bg-[#F8FAFF] hover:border-[#4C95FF]/50'
                            }`}
                        onClick={() => handleInputClick(dateInputRef)}
                    >
                        <FaCalendarAlt className={date ? 'text-[#4C95FF]' : 'text-[#4C95FF]/60'} />
                        <span className={`font-medium ${date ? 'text-gray-900' : 'text-gray-400'}`}>
                            {date ? formatDate(date) : 'Date'}
                        </span>
                    </div>
                    <input
                        ref={dateInputRef}
                        type="date"
                        value={date}
                        onChange={handleDateChange}
                        min={minDate}
                        className="absolute opacity-0 pointer-events-none w-0 h-0"
                    />
                </div>

                {/* TIME */}
                <div className="flex-1 relative">
                    <div
                        className={`w-full px-3 py-2 rounded-full border transition-all duration-200 cursor-pointer text-sm flex items-center gap-3 shadow-sm ${time ? 'border-purple-400 bg-purple-50/50' : 'border-[#EBF1FF] bg-[#F8FAFF] hover:border-purple-300'
                            }`}
                        onClick={() => handleInputClick(timeInputRef)}
                    >
                        <FaClock className={time ? 'text-purple-500' : 'text-purple-500/60'} />
                        <span className={`font-medium ${time ? 'text-gray-900' : 'text-gray-400'}`}>
                            {time ? formatTime(time) : 'Time'}
                        </span>
                    </div>
                    <input
                        ref={timeInputRef}
                        type="time"
                        value={time}
                        onChange={handleTimeChange}
                        className="absolute opacity-0 pointer-events-none w-0 h-0"
                    />
                </div>
            </div>

            {date && time && (
                <div className="bg-green-50/80 border border-green-100 rounded-2xl p-3 flex items-center justify-between animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center shadow-sm">
                            <FaCheck size={12} />
                        </div>
                        <div className="text-xs">
                            <p className="text-gray-500 font-medium">Selected Schedule</p>
                            <span className="font-bold text-green-900 capitalize">{formatDate(date)}</span>
                            <span className="text-green-700"> at {formatTime(time)}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        title="Clear selections"
                    >
                        <FaTimes size={14} />
                    </button>
                </div>
            )}

            {error && <p className="text-xs text-red-500 mt-1 px-4">{error}</p>}
        </div>
    );
}
