"use client";

// import isConnected from "../helpers/isConnected";

export default function CursorProvider({ children }: { children: any }) {
  // return <main className={`${isConnected() && "cursor"}`}>{children}</main>;
  return <main className='cursor'>{children}</main>;
}
