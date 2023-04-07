import Xyz from "@/ui/pages/xyz";

export default async function Index() {
  return (
    <>
      {/* @ts-expect-error Server Component */}
      <Xyz />
    </>
  );
}
