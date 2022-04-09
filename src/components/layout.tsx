import Grid from './primitives/grid';
import Background from './joy/background/backgroundWrapper';
import { Box } from './primitives/box';

export default function Layout({ children }: any) {
  return (
    <>
      <Grid>{children}</Grid>
      <Background />
    </>
  );
}
