import { Period } from "@/types/base";
import { endOfMonth, interval, intervalToDuration, startOfMonth } from "date-fns";

export const DatesToDurationString = (start: Date | null | undefined, end: Date | null | undefined) => {
    if (!start || !end) return 'N/A';
    const timeElapsed = end.getTime() - start.getTime()

    if (timeElapsed < 1000) {
        return `${timeElapsed}ms`;
    }

    const duration = intervalToDuration({ start: 0, end: timeElapsed });

    return `${duration.minutes ?? 0}m ${duration.seconds ?? 0}s`;
}

export const PeriodToDateRange = (period: Period) => {
    const offset = -300; // EST offset in minutes
    const startDate = startOfMonth(new Date(period.year, period.month - 1, 1));
    startDate.setTime(startDate.getTime()+startDate.getTimezoneOffset()*60*1000);
    const estStartDate = new Date(startDate.getTime() + offset*60*1000);

    const endDate = endOfMonth(new Date(period.year, period.month - 1, 1));
    endDate.setTime(endDate.getTime()+endDate.getTimezoneOffset()*60*1000);
    const estEndDate = new Date(endDate.getTime() + offset*60*1000);
    return { start: estStartDate, end: estEndDate };
}