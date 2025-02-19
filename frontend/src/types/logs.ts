
export interface ExecutionLog {
    execution_phase_id: string;
    log_level: "debug" | "info" | "warning" | "error";
    message: string;
    timestamp: string;
    id: string;
}
  