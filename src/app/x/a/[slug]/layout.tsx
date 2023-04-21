import "@/app/styles/reset.css";
import "@/app/styles/globals.scss";

export const metadata = {
  title: "IAM",
  description: "IAM IAM IAM",
};

export default function TokenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className='post'>{children}</section>;
}
