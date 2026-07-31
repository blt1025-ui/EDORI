import "./OperationalBanner.css";

import { getOperationalStatus } from "../../utils/OperationalStatus";

interface OperationalBannerProps {
  score: number;
}

export default function OperationalBanner({
  score,
}: OperationalBannerProps) {
  const status = getOperationalStatus(score);

  return (
    <div
      className="operational-banner"
      style={{
        borderLeft: `10px solid ${status.color}`,
      }}
    >
      <div className="banner-header">
        <div className="banner-icon">{status.icon}</div>

        <div className="banner-title-group">
          <h2>{status.title}</h2>

          <p className="banner-score">
            EDORI Score: <strong>{score.toFixed(0)}</strong>
          </p>
        </div>
      </div>

      <div className="banner-message">
        {status.recommendation}
      </div>
    </div>
  );
}