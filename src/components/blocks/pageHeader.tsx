import { Box } from '../primitives/box';
import Squiggle from '../joy/squiggle';
import Text from '../primitives/text';
import Comments from '../joy/comments';

// page header

export default function PageHeader({ ...props }: any) {
  return (
    <Box {...props} className="pageHeader" css={{ margin: `0`, width: `100%` }}>
      <Box css={{ width: `fit-content`, margin: `0 auto 24px` }}>
        <Text as="h2" css={{ width: `fit-content`, margin: `8px 0` }}>
          {props.pagetitle}
        </Text>
        <Box
          css={{
            margin: `0 auto`,
            display: `flex`,
            alignItems: `center`,
            justifyContent: `center`,
            gap: `1rem`,
          }}
        >
          {props.pagetype === `Blog` && (
            <Text
              as="small"
              css={{
                display: `block`,
                width: `fit-content`,
                margin: `0`,
              }}
            >
              Published: {props.publishdate}
            </Text>
          )}
          {(props.pagetype === `Blog` || props.pagetype === `Gallery`) && (
            <Comments slug={props.slug} css={{ margin: `0` }} />
          )}
        </Box>
      </Box>
      {(props.pagetype === `Blog` || props.pagetype === `Gallery`) && (
        <Squiggle squiggleWidth="8" height="24" />
      )}
    </Box>
  );
}
