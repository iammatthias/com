import { AppProps } from 'next/app';
import '@/styles/app.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
