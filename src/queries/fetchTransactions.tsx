import { gql } from '@apollo/client';

export default gql`
  query FetchTransactions($addresses: [String!]!) {
    transactions(
      first: 100
      tags: [
        { name: "AppName", values: ["Paragraph"] }
        { name: "Contributor", values: $addresses }
      ]
    ) {
      edges {
        node {
          id
          block {
            timestamp
          }
          tags {
            name
            value
          }
        }
      }
    }
  }
`;
