"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Back() {
  const router = useRouter();
  return (
    <div>
      <Link href='#' onClick={() => router.back()}>
        Back
      </Link>
    </div>
  );
}
