import "@/app/styles/reset.css";
import "@/app/styles/globals.scss";
import Nav from "@/app/components/Nav";

export const metadata = {
  title: "IAM",
  description: "IAM IAM IAM",
};

export default function TokenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <section className='post'>{children}</section>
    </>
  );
}
