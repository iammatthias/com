import Grid from './primitives/grid';

export default function Layout({ children }: any) {
  return (
    <Grid
      css={{
        padding: `2rem 1rem 2rem`,
        height: `calc(100vh - 4rem)`,
      }}
    >
      {children}
    </Grid>
  );
}
