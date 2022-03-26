import { Box } from '../primitives/box';
import Squiggle from '../joy/squiggle';
import { Text } from '../primitives/text';
import Comments from '../joy/comments';

// page header

export default function PageHeader({ ...props }: any) {
  return (
    <Box
      {...props}
      className="pageHeader"
      css={{ margin: `16px 0`, width: `100%` }}
    >
      <Box css={{ width: `fit-content`, margin: `0 0 16px` }}>
        <Text as="h1" css={{ width: `fit-content`, margin: `8px 0 16px` }}>
          {props.pagetitle}
        </Text>
        {(props.pagetype === `Blog` || props.pagetype === `Gallery`) && (
          <>
            <Text as="small" css={{ display: `block`, width: `fit-content` }}>
              Published: {props.publishdate}
            </Text>
            <Comments slug={props.slug} />
          </>
        )}
      </Box>
      {(props.pagetype === `Blog` || props.pagetype === `Gallery`) && (
        <Squiggle />
      )}
    </Box>
  );
}
