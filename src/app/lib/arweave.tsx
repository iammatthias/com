import Arweave from "arweave";

const arweave = Arweave.init({
  host: `arweave.net`,
  protocol: `https`,
  port: 443,
  timeout: 5000,
});

export default arweave;
