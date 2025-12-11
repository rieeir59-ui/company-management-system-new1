import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

const statusConfig = {
    'completed': { icon: CheckCircle2, color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
    'pending-approval': { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending Approval' },
    'in-progress': { icon: Clock, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'In Progress' },
    'not-started': { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200', label: 'Not Started' },
};

export const StatusBadge = ({ status }: { status: keyof typeof statusConfig }) => {
    const { icon: Icon, color, label } = statusConfig[status] || statusConfig['not-started'];
    return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", color)}>
            <Icon className="h-3.5 w-3.5" />
            {label}
        </span>
    );
};


export { Badge, badgeVariants }
