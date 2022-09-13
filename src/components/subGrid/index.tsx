import { subgrid } from './subgrid.css';
import Box from '@/components/box';

type Props = {
  children: React.ReactNode;
};

export default function SubGrid({ children }: Props) {
  return <Box className={`${subgrid}`}>{children}</Box>;
}
