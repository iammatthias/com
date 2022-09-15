import Box from '@/components/box';

import { buttonRecipe, ButtonVariants } from './button.css';

type Props = {
  children: React.ReactNode;
  ref?: React.ForwardedRef<HTMLButtonElement>;
  onClick?: () => void;
} & ButtonVariants;

export const Button = ({
  children,
  onClick,
  ref,
  kind = `secondary`,
}: Props) => {
  return (
    <Box
      as="button"
      onClick={onClick}
      ref={ref}
      className={buttonRecipe({ kind })}
    >
      {children}
    </Box>
  );
};

export default Button;
