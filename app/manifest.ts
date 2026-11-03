import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Stake — PayPal Commitment Contracts',
    short_name: 'Stake',
    description: 'Daily habit and milestone commitments backed by safe PayPal sandbox escrow holds.',
    start_url: '/',
    display: 'standalone',
    background_color: '#003087',
    theme_color: '#003087',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
  };
}

