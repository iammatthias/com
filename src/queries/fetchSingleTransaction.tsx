import { gql } from '@apollo/client';

export default gql`
  query FetchTransaction($postId: String!) {
    transactions(tags: { name: "PostId", values: [$postId] }) {
      edges {
        node {
          id
          block {
            timestamp
          }
        }
      }
    }
  }
`;
