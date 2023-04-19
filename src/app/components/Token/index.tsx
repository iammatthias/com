import styles from "./Token.module.scss";
import RemoteImage from "../RemoteImage";

export default function Token({
  tokenData,
  showCaption = false,
}: {
  tokenData: {
    tokenType: string;
    name: string;
    description: string;
    contentUrl: string;
    contentUrlMimeType: string;
  };
  showCaption?: boolean;
}) {
  return (
    <div className={`${styles.token}`}>
      <RemoteImage
        src={tokenData.contentUrl}
        alt={tokenData.name}
        mimeType={tokenData.contentUrlMimeType}
      />
      {showCaption && (
        <div className='caption'>
          <h3>{tokenData.name}</h3>
          <p>{tokenData.description}</p>
        </div>
      )}
    </div>
  );
}
