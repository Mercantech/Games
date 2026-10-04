import './QrCard.css'

const QR_URL = 'https://games.mercantec.tech'

export default function QrCard({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`qr-card ${compact ? 'compact' : ''}`} aria-label="QR til klasseværelse">
      <img
        className="qr-img"
        src="/qr-games.png"
        alt={`QR-kode til ${QR_URL}`}
        width={280}
        height={280}
        loading="lazy"
      />
      <div className="qr-copy">
        <p className="qr-kicker">SCAN TO PLAY</p>
        <p className="qr-url">{QR_URL.replace('https://', '')}</p>
        <p className="qr-hint">Vis på projektor — elever scanner ind</p>
      </div>
    </aside>
  )
}
