import './QrCard.css'

const QR_URL = 'https://games.mercantec.tech'

/** Subtil hjørne-QR — ingen stor card midt på siden */
export default function QrCard() {
  return (
    <a
      className="qr-corner"
      href={QR_URL}
      title={QR_URL.replace('https://', '')}
      aria-label={`QR til ${QR_URL}`}
    >
      <img
        className="qr-corner-img"
        src="/qr-games.png"
        alt=""
        width={56}
        height={56}
        loading="lazy"
      />
    </a>
  )
}
