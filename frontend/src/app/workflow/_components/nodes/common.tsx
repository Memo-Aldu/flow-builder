import { TaskParamType } from "@/types/task";

export const ColorForHandle: Record<TaskParamType, string> = {
    BROWSER_INSTANCE: '!bg-sky-400',
    STRING: '!bg-amber-400',
    CREDENTIAL: "!bg-rose-400",
    NUMBER: "!bg-emerald-400",
    SELECT: "!bg-violet-400",
    CONDITIONAL: "!bg-purple-400",
}