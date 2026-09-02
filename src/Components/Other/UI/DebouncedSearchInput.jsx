export default function DebouncedSearchInput({ value, onChange, onSearch, ...props }) {
    const handleChange = (event) => {
        const nextValue = event.target.value;
        onChange(nextValue);
        onSearch(nextValue);
    };

    return <input {...props} value={value} onChange={handleChange} />;
}
