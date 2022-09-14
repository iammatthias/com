import { themeClass } from '@/styles/atoms.css';
import {
  layout,
  layoutContent,
  layoutFooter,
  layoutHeader,
} from './layout.css';
import Box from '@/components/box';
import Header from '@/components/header';
import Footer from '@/components/footer';

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <Box className={`${themeClass} ${layout}`}>
      <Box className={`${layoutHeader}`}>
        <Header />
      </Box>
      <Box className={`${layoutContent}`}>
        {children}
        <Box className={`${layoutFooter}`}>
          <Footer />
        </Box>
      </Box>
    </Box>
  );
}
