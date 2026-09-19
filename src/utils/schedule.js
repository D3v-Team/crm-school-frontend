export const toMinutes = (time) => {
    const [hours, minutes] = (time || '0:0').split(':').map(Number);
    return hours * 60 + minutes;
};

export const getParallelIds = (items) => {
    const parallelIds = new Set();

    items.forEach((item, index) => {
        const start = toMinutes(item.start_time);
        const end = toMinutes(item.end_time);

        items.slice(index + 1).forEach(other => {
            if (item.day_of_week !== other.day_of_week) return;

            const otherStart = toMinutes(other.start_time);
            const otherEnd = toMinutes(other.end_time);
            if (start < otherEnd && otherStart < end) {
                parallelIds.add(item.id);
                parallelIds.add(other.id);
            }
        });
    });

    return parallelIds;
};

export const mergeParallelItems = (items) => {
    const groups = [];

    items.forEach(item => {
        const start = toMinutes(item.start_time);
        const end = toMinutes(item.end_time);
        const matchingGroups = groups.filter(group => group.some(other => (
            item.day_of_week === other.day_of_week
            && start < toMinutes(other.end_time)
            && toMinutes(other.start_time) < end
        )));

        if (matchingGroups.length === 0) {
            groups.push([item]);
            return;
        }

        const merged = matchingGroups.reduce((all, group) => all.concat(group), [item]);
        matchingGroups.forEach(group => groups.splice(groups.indexOf(group), 1));
        groups.push(merged);
    });

    return groups;
};