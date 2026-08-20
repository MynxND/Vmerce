import QRCode from 'qrcode';

/**
 * Renders a payload as an inline SVG data URI.
 *
 * SVG keeps the response small and stays crisp at any size, and a data URI means
 * the storefront needs no extra request and no client-side QR library.
 */
export async function renderQrDataUri(payload: string): Promise<string> {
  const svg = await QRCode.toString(payload, {
    type: 'svg',
    margin: 1,
    // 'M' tolerates a printed or photographed QR losing ~15% of its modules,
    // which matters because buyers scan these off a phone screen.
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}
