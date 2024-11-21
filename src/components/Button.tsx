import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const variants = cva("px-5 py-1.5 bg-teal-900 text-white hover:bg-teal-950 transition-colors", {
  variants: {
    intent: {
      primary: "",
      destructive: "bg-red-800 hover:bg-red-900",
    },
  },
  defaultVariants: {
    intent: "primary",
  },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variants> {}

const Button = ({ className, intent, ...props }: ButtonProps) => <button className={twMerge(variants({ className, intent }))} {...props} />;

export default Button;
