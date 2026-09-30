import React, { useState } from 'react';
import { IoCloseCircleOutline } from 'react-icons/io5';

export const TagInput = ({ value = [], onChange, error, label = "Tags", placeholder = "Press enter to add tags" }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = inputValue.trim();
            if (tag && !value.includes(tag)) {
                onChange([...value, tag]);
                setInputValue('');
            }
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            const newTags = [...value];
            newTags.pop();
            onChange(newTags);
        }
    };

    const removeTag = (tagToRemove) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <div className={`flex flex-wrap gap-2 p-2 min-h-[48px] bg-white/50 backdrop-blur-sm border rounded-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${error ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'}`}>
                {value.map((tag, index) => (
                    <span 
                        key={index} 
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium animate-in fade-in zoom-in duration-200"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-blue-800 transition-colors"
                        >
                            <IoCloseCircleOutline className="w-4 h-4" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : ""}
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 py-1"
                />
            </div>
            {error && (
                <p className="mt-1.5 text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
};
