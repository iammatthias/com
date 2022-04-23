import { Box } from './primitives/box';
import Grid from './primitives/grid';

export default function Layout({ children }: any) {
  return (
    <Box css={{ margin: `64px 0 0` }}>
      <Grid>{children}</Grid>
    </Box>
  );
}
