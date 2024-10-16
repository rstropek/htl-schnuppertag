export function addWorkdays(dateInIso8601: string, days: number): string {
    let date = new Date(dateInIso8601);
    let addedDays = 0;
    const direction = Math.sign(days);  // Determine the direction based on the sign of 'days'

    // Loop until the required number of workdays are added (positive or negative)
    while (addedDays < Math.abs(days)) {
        // Move the date forward or backward based on the direction
        date.setUTCDate(date.getUTCDate() + direction);
        const dayOfWeek = date.getUTCDay();

        // Workdays are Monday to Friday (1-5 in UTC context), skip Saturday (6) and Sunday (0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            addedDays++;
        }
    }

    // Return the date in ISO format (YYYY-MM-DD)
    return date.toISOString().split('T')[0]!;
}

export function isWorkdaysInThePast(dateInIso8601: string, today: Date, days: number): boolean {
    const date = new Date(dateInIso8601);
    const pastDate = new Date(addWorkdays(today.toISOString().split('T')[0]!, days));
    return date < pastDate;
}
