/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";

/**
 * Qidiruv inputi: `onChange` darhol chaqiriladi (input qiymati uchun),
 * `onSearch` esa yozish to'xtagach `delay` ms o'tib chaqiriladi.
 * Enter bosilsa kutmasdan darhol qidiradi.
 */
export default function DebouncedSearchInput({ value, onChange, onSearch, delay = 400, onKeyDown, ...props }) {
    const timerRef = useRef(null);
    const onSearchRef = useRef(onSearch);
    onSearchRef.current = onSearch;

    const typedRef = useRef(value);

    useEffect(() => () => window.clearTimeout(timerRef.current), []);
    // Qiymat tashqaridan o'zgarsa (masalan "Tozalash"), kutayotgan qidiruv bekor qilinadi.
    useEffect(() => {
        if (value !== typedRef.current) window.clearTimeout(timerRef.current);
    }, [value]);

    const handleChange = (event) => {
        const nextValue = event.target.value;
        typedRef.current = nextValue;
        onChange(nextValue);
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => onSearchRef.current?.(nextValue), delay);
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            window.clearTimeout(timerRef.current);
            onSearchRef.current?.(event.currentTarget.value);
        }
        onKeyDown?.(event);
    };

    return <input {...props} value={value} onChange={handleChange} onKeyDown={handleKeyDown} />;
}
