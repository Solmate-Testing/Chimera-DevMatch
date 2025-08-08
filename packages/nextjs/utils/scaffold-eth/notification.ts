import { toast } from "react-hot-toast";

type NotificationProps = {
  content: React.ReactNode;
  status: "success" | "info" | "loading" | "error" | "warning";
  duration?: number;
  icon?: string;
  position?: 
    | "top-center"
    | "top-right"  
    | "top-left"
    | "bottom-center"
    | "bottom-right"
    | "bottom-left";
};

const ENUM_STATUSES = {
  success: { color: "#10B981", icon: "✅" },
  loading: { color: "#3B82F6", icon: "🔄" },
  error: { color: "#EF4444", icon: "❌" },
  info: { color: "#3B82F6", icon: "ℹ️" },
  warning: { color: "#F59E0B", icon: "⚠️" },
};

const DEFAULT_DURATION = 3000;
const POSITION_MAP = {
  "top-center": "top-center",
  "top-right": "top-right", 
  "top-left": "top-left",
  "bottom-center": "bottom-center",
  "bottom-right": "bottom-right",
  "bottom-left": "bottom-left",
} as const;

/**
 * Custom notification function
 */
function createNotification({ content, status, duration = DEFAULT_DURATION, icon, position = "top-center" }: NotificationProps) {
  const statusConfig = ENUM_STATUSES[status];
  const displayIcon = icon || statusConfig.icon;

  return toast(
    `${displayIcon} ${typeof content === 'string' ? content : 'Notification'}`,
    {
      duration,
      position: POSITION_MAP[position] as any,
      style: {
        borderRadius: '8px',
        background: statusConfig.color,
        color: '#fff',
      },
    }
  );
}

/**
 * Utility object for different notification types
 */
export const notification = {
  success: (content: React.ReactNode, options?: Partial<NotificationProps>) => 
    createNotification({ content, status: "success", ...options }),
  
  info: (content: React.ReactNode, options?: Partial<NotificationProps>) => 
    createNotification({ content, status: "info", ...options }),
    
  warning: (content: React.ReactNode, options?: Partial<NotificationProps>) => 
    createNotification({ content, status: "warning", ...options }),
    
  error: (content: React.ReactNode, options?: Partial<NotificationProps>) => 
    createNotification({ content, status: "error", ...options }),
    
  loading: (content: React.ReactNode, options?: Partial<NotificationProps>) => 
    createNotification({ content, status: "loading", duration: 0, ...options }),

  remove: (toastId: string) => toast.dismiss(toastId),
};