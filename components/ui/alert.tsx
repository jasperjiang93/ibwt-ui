const variants = {
  error: "border-red-800 bg-red-900/20 text-red-400",
  success: "border-green-800 bg-green-900/20 text-green-400",
  warning: "border-yellow-800 bg-yellow-900/20 text-yellow-400",
};

export function Alert({
  variant = "error",
  children,
  className,
}: {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-3 border rounded-lg text-sm ${variants[variant]} ${className || ""}`}
    >
      {children}
    </div>
  );
}
