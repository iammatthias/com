// pages/thoughts.tsx

// helpers
import Thoughts from '@/components/joy/thoughts';

// components

export default function Home() {
  return <Thoughts />;
}

export const getStaticProps = async () => {
  return {
    props: {
      pageTitle: `Thoughts`,
    },
  };
};
