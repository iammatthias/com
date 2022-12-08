import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const config = {
  runtime: `experimental-edge`,
};

// Make sure the font exists in the specified path:
const font = fetch(new URL(`../../assets/fonts/CrimsonPro.ttf`, import.meta.url)).then(
  (res) => res.arrayBuffer(),
);

export default async function handler(req: NextRequest) {
  const fontData = await font;
  try {
    const { searchParams } = new URL(req.url);

    // ?title=<title>
    const hasTitle = searchParams.has(`title`);
    const title = hasTitle ? searchParams.get(`title`)?.slice(0, 100) : `I AM MATTHIAS`;

    return new ImageResponse(
      (
        <div
          style={{
            background: `white`,
            width: `100%`,
            height: `100%`,
            paddingLeft: 32,
            paddingRight: 32,
            paddingTop: 16,
            paddingBottom: 16,
            display: `flex`,
            flexDirection: `column`,
            textAlign: `center`,
            alignItems: `center`,
            justifyContent: `space-between`,
          }}
        >
          <div
            style={{
              width: `100%`,
              padding: 16,
              borderBottom: `1px solid #000`,
              boxShadow: `0 16px 16px -16px rgba(0 0 0 0.1)`,
              fontSize: 24,
            }}
          >
            Hello, I am Matthias
          </div>
          {hasTitle ? (
            <div
              style={{
                width: `70%`,
                display: `flex`,
                alignItems: `center`,
                justifyContent: `center`,
                padding: 16,
                justifySelf: `flex-end`,
                fontSize: 48,
              }}
            >
              {title}
            </div>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              style={{
                height: `64px`,
                width: `64px`,
                fill: `#000`,
              }}
            >
              <path d="M.048 2.003 2.714.065l-.095-.13-2.667 1.937.096.131Zm-.07.964L7.187 5.02l.044-.156L.022 2.811l-.044.156ZM7.283 4.91 5.213-.031l-.15.062 2.071 4.942.15-.062Zm-.002.069L9.85.037l-.144-.074-2.569 4.942.144.075Zm-.044.038 4.595-1.689-.056-.152-4.595 1.69.056.151Zm4.64-1.802L10.204-.037l-.144.074 1.671 3.253.144-.074Zm.002.068L13.213.031l-.15-.062-1.333 3.254.15.061Zm-.082.05 4.071.355.015-.16-4.071-.356-.015.16Zm4.147.232L13.695-.043l-.137.086 2.249 3.609.137-.086Zm.003.081.124-.23-.142-.078-.125.232.143.076ZM16 3.528h-.124v.162H16v-.162Zm-.185.134.124.142.122-.106-.125-.142-.121.106Zm.16 5.452-1.76.569.05.154 1.76-.569-.05-.154Zm-1.657.667 1.636-6.151-.157-.042-1.635 6.151.156.042Zm1.736 1.483L14.294 9.7l-.108.12 1.76 1.565.108-.121ZM14.17 9.718l-2.391 3.983.138.083 2.391-3.982-.138-.084Zm-2.296 4.1 4.15-1.404-.05-.153-4.152 1.405.052.153Zm-.08-.015 2.551 2.258.108-.122-2.552-2.257-.107.12Zm4.06 2.222.222-.684-.154-.05-.222.684.154.05Zm-4.072-2.329-1.574 2.258.133.092 1.573-2.257-.132-.093Zm-4.385 2.27-1.743-3.663-.146.07 1.742 3.662.146-.07Zm-1.833-3.55 6.266 1.405.036-.158L5.6 12.26l-.035.158Zm6.164-9.134 2.435 6.506.152-.056-2.436-6.507-.151.057Zm.016-.083L6.98 8.408l.12.109 4.764-5.21-.12-.108Zm-4.72 5.343 7.2 1.298.03-.16-7.2-1.297-.03.159Zm.096-.076.169-3.52-.162-.008-.169 3.52.162.008Zm-.08-.085-2.7-.053-.003.162 2.702.053.004-.162Zm-2.64.08 2.87-3.467-.124-.103-2.872 3.466.125.103Zm-.003-.107L.06 3.608l-.12.109 4.338 4.746.12-.109Zm-.058-.026L.003 8.186l-.006.162 4.338.142.005-.162Zm1.173 3.968-2.205 3.662.14.084 2.204-3.663-.14-.083ZM-.05 11.148l1.564 1.236.1-.127L.05 11.02l-.1.127Zm1.68 1.219 2.774-3.911-.132-.094-2.774 3.911.132.094Zm10.279 1.32-4.81-5.28-.119.11 4.81 5.28.119-.11ZM4.26 8.434l1.244 3.93.154-.05-1.244-3.929-.154.05Zm1.397 3.933 1.458-3.875-.152-.057-1.458 3.875.152.057Zm-.075-.11-4.018-.017v.162l4.017.018v-.162ZM1.52 16.004l.124-3.68-.161-.006-.125 3.68.162.006Zm.029-3.763-1.564.285.028.159L1.58 12.4l-.029-.16ZM.069 14.87l1.564-2.507-.137-.086-1.565 2.507.138.085ZM0 0v-.162h-.162V0H0Zm16 0h.162v-.162H16V0Zm0 16v.162h.162V16H16ZM0 16h-.162v.162H0V16ZM-.162 0v1.938h.324V0h-.324Zm2.829-.162H0v.324h2.667v-.324Zm-2.829 2.1v.95h.324v-.95h-.324Zm5.3-2.1H2.667v.324h2.47v-.324Zm4.64 0h-4.64v.324h4.64v-.324Zm.355 0h-.355v.324h.355v-.324Zm3.005 0h-3.005v.324h3.005v-.324Zm.489 0h-.49v.324h.49v-.324Zm2.535 3.54V0h-.324v3.378h.324ZM16-.162h-2.373v.324H16v-.324Zm-.162 3.54v.23h.324v-.23h-.324Zm.324.373V3.61h-.324v.142h.324Zm-.324 0v5.44h.324v-5.44h-.324Zm0 5.44v2.133h.324V9.191h-.324Zm.324 3.147v-1.014h-.324v1.014h.324ZM14.4 16.162h1.378v-.324H14.4v.324Zm1.762-.846v-2.978h-.324v2.978h.324Zm-.384.846H16v-.324h-.222v.324Zm.384-.162v-.684h-.324V16h.324Zm-5.886.162H14.4v-.324h-4.124v.324Zm0-.324H7.324v.324h2.952v-.324ZM.162 3.662V2.89h-.324v.773h.324Zm0 4.605V3.662h-.324v4.605h.324Zm3.216 7.895h3.946v-.324H3.378v.324Zm-3.54-7.895v2.817h.324V8.267h-.324Zm3.54 7.571H1.44v.324h1.938v-.324ZM.162 12.604v-1.52h-.324v1.52h.324Zm-.324 0v2.223h.324v-2.223h-.324Zm1.602 3.234H0v.324h1.44v-.324ZM.162 16v-1.173h-.324V16h.324Z" />
            </svg>
          )}
          <div
            style={{
              width: `100%`,
              padding: 16,
              borderTop: `1px solid #000`,
              boxShadow: `0 -16px 16px -16px rgba(0 0 0 0.1)`,
              fontSize: 24,
            }}
          >
            @iammatthias
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: `CrimsonPRo`,
            data: fontData,
            style: `normal`,
          },
        ],
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
