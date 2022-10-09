import { layout } from './layout.css';

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return <div className={`${layout}`}>{children}</div>;
}
