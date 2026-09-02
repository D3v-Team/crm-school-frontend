import { useEffect, useRef } from 'react';

export default function DebouncedSearchInput({ value, onChange, onSearch, delay = 3000, onKeyDown, ...props }) {
    const timerRef = useRef(null);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const scheduleSearch = (nextValue) => {
        clearTimeout(timerRef.current);
        if (!nextValue.trim()) return;
        timerRef.current = setTimeout(() => onSearch(nextValue), delay);
    };

    const handleChange = (event) => {
        const nextValue = event.target.value;
        onChange(nextValue);
        scheduleSearch(nextValue);
    };

    const handleKeyDown = (event) => {
        if (event.key !== 'Enter') return;
        clearTimeout(timerRef.current);
        onSearch(value);
        onKeyDown?.(event);
    };

    return <input {...props} value={value} onChange={handleChange} onKeyDown={handleKeyDown} />;
}
