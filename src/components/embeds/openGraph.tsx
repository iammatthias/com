import useSWR from 'swr';
import axios from 'axios';
import EntryLink from './entryLink';

type Props = {
  url: string;
  children: React.ReactNode;
};

export default function OpenGraph({ url, children }: Props) {
  const { data, error } = useSWR(`/api/link-preview?url=${url}`, (url) =>
    axios.get(url).then((res) => res.data),
  );
  const isLoading = !data && !error;

  if (error) return <EntryLink href={url}>{children}</EntryLink>;

  return (
    <figure>
      {isLoading ? (
        <>loading...</>
      ) : (
        <EntryLink href={url}>
          <div>
            <div>
              <img src={data.image.url} alt={data.title} />
            </div>
            <div>
              <p>{data.title}</p>
              <p>{data.description}</p>
              <p>{new URL(data.url).hostname}</p>
            </div>
          </div>
        </EntryLink>
      )}
    </figure>
  );
}
