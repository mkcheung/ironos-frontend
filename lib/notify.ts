import { toast } from "sonner";

export const notify = {
  success: (message: string) =>
    toast.success(message, {
      style: {
        background: "var(--slate)",
        color: "var(--bone)",
        border: "1px solid var(--ash)",
        borderLeft: "2px solid var(--bronze)",
      },
    }),
  error: (message: string) =>
    toast.error(message, {
      style: {
        background: "var(--slate)",
        color: "var(--bone)",
        border: "1px solid var(--ash)",
        borderLeft: "2px solid var(--cordovan)",
      },
    }),
  warning: (message: string) =>
    toast.warning(message, {
      style: {
        background: "var(--slate)",
        color: "var(--bone)",
        border: "1px solid var(--ash)",
        borderLeft: "2px solid var(--warning)",
      },
    }),
  info: (message: string) =>
    toast(message, {
      style: {
        background: "var(--slate)",
        color: "var(--bone)",
        border: "1px solid var(--ash)",
      },
    }),
};
