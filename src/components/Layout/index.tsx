import { themeClass } from '@/styles/atoms.css';
import {
  layout,
  layoutContent,
  layoutFooter,
  layoutHeader,
} from './layout.css';
import Box from '@/components/Box';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
