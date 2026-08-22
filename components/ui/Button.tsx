type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

const variants = {
  primary: "bg-blue-600 text-white hover:bg-blue-500 border border-transparent",
  secondary: "border border-gray-400 text-inherit hover:bg-gray-500/20",
  danger: "border border-red-400 text-red-500 hover:bg-red-500/10"
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
