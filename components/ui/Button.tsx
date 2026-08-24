type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

const variants = {
  primary:
    "bg-primary text-background hover:bg-primary-hover border border-transparent",
  secondary: "border border-border text-text-default hover:bg-surface",
  danger: "border border-danger text-danger hover:bg-danger/10"
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
