import { Suspense } from "react";
import Grid from "@/app/components/Grid";
import Cell from "@/app/components/Grid/Cell";
import SubGrid from "@/app/components/Grid/SubGrid";
import DateAndTime from "@/app/components/Helpers/DateTime";
import Weather from "@/app/components/Helpers/Weather";
import Link from "next/link";
import fetchAndMergeData from "@/app/data/fetch/fetchAndMergeData";
import Nav from "@/app/components/Nav";
import IsConnected from "@/app/lib/isConnected";

export default async function Home() {
  const data = await fetchAndMergeData();

  return (
    <Grid>
      <Cell span={1} center invert>
        <Nav inverted />
      </Cell>
      <Cell span={1} center invert>
        <Suspense>
          {/* @ts-expect-error */}
          <Weather />
        </Suspense>
      </Cell>

      <Cell span={1} center invert>
        <Suspense>
          <DateAndTime />
        </Suspense>
      </Cell>
      <Cell span={4} invert>
        <p>
          I design & build growth systems —and have worked with wonderful teams
          at <Link href='https://opul.com/'>Revance (Opul)</Link>,{` `}
          <Link href='https://tornado.com/'>Tornado</Link>,{` `}
          <Link href='https://www.aspiration.com/'>Aspiration</Link>,{` `}
          <Link href='https://www.surfair.com/'>Surf Air</Link>, and{` `}
          <Link href='https://generalassemb.ly/'>General Assembly</Link>.
        </p>
      </Cell>

      <Cell span={3} center invert>
        <p>
          farcaster @iammatthias
          <br />
          bluesky @iam.bsky.social
          <br />
          <Link href='mailto:hey@iammatthias.com?subject=Collab&body=Hey%20Matthias%2C%0D%0A%0D%0A...'>
            hey@iammatthias.com
          </Link>
        </p>
      </Cell>

      {data.map((entry) => {
        // Check if the content should be displayed
        const shouldDisplayContent =
          entry.conditionals.isPublished ||
          process.env.NODE_ENV === "development";

        return (
          shouldDisplayContent && (
            // // @ts-expect-error
            // <IsConnected key={entry.id} isWalletGated={entry.conditionals.isWalletGated}>
            <ContentCell key={entry.id} entry={entry} />
            // </IsConnected>
          )
        );
      })}
      <Cell span={10} invisible>
        <></>
      </Cell>
    </Grid>
  );
}

interface ContentCellProps {
  id: string;
  name: string;
  created: number;
  fields: {
    address: string;
    span: number;
    token: string;
    tokenType: string;
    contentURL: string;
    contentURLMimeType: string;
    source: string;
    description: string;
    content: any;
  };
  conditionals: {
    isToken: boolean;
    isArweave: boolean;
    isLongform: boolean;
  };
}

function ContentCell({ entry }: { entry: ContentCellProps }) {
  return (
    <Cell span={entry.fields.span} key={entry.id}>
      <Link
        href={`/x/${
          entry.conditionals.isToken
            ? "t" // t for token
            : entry.conditionals.isArweave
            ? "a" // a for arweave
            : "o" // o is for obsidian (markdown)
        }/${
          entry.conditionals.isToken
            ? entry.fields.address
            : entry.conditionals.isArweave
            ? entry.id
            : entry.id
        }${entry.conditionals.isToken ? "/" + entry.fields.token : ""}`}>
        <SubGrid
          title={entry.name}
          id={entry.id}
          created={`${entry.created}`}
          isLongform={entry.conditionals.isLongform}
          isToken={entry.conditionals.isToken}
          tokenType={entry.fields.tokenType}
          contentUrl={entry.fields.contentURL}
          contentUrlMimeType={entry.fields.contentURLMimeType}
          source={entry.fields.source}
          description={entry.fields.description}
          content={entry.fields.content}
        />
      </Link>
    </Cell>
  );
}
