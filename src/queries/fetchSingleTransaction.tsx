import { gql } from '@apollo/client';

export default gql`
  query FetchTransaction($digest: String!) {
    transactions(
      tags: [
        { name: "Original-Content-Digest", values: [$digest] }
        { name: "App-Name", values: "MirrorXYZ" }
      ]
    ) {
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
