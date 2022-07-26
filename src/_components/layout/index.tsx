import Header from '../header';
import Footer from '../footer';
import { themeClass } from '@/styles/sprinkles.css';
import { layout, content } from './layout.css';
import Box from '@/_components/Box';

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <Box className={`${themeClass} ${layout}`}>
      <Header />
      <Box as="main" className={`${content}`}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
